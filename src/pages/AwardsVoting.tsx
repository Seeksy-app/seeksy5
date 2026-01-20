import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Trophy, Heart, Star, Award, ExternalLink, CheckCircle, XCircle 
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/navigation/BackButton";

const VOTED_STORAGE_KEY = "seeksy_awards_voted";

function getVotedPrograms(): string[] {
  try {
    const stored = localStorage.getItem(VOTED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markProgramAsVoted(programId: string) {
  const voted = getVotedPrograms();
  if (!voted.includes(programId)) {
    voted.push(programId);
    localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(voted));
  }
}

export default function AwardsVoting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);

  // Check if user already voted
  useEffect(() => {
    if (id) {
      setHasAlreadyVoted(getVotedPrograms().includes(id));
    }
  }, [id]);

  const { data: program, isLoading } = useQuery({
    queryKey: ["awards-voting", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards_programs")
        .select(`
          *,
          award_categories (
            *,
            award_nominees (*)
          ),
          award_sponsorships (
            *,
            award_sponsorship_packages (*)
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const submitVotes = useMutation({
    mutationFn: async () => {
      if (!voterName || !voterEmail) {
        throw new Error("Please provide your name and email");
      }

      const votesToSubmit = Object.entries(selectedVotes).map(([categoryId, nomineeId]) => ({
        program_id: id,
        category_id: categoryId,
        nominee_id: nomineeId,
        voter_name: voterName,
        voter_email: voterEmail,
        vote_weight: 1,
      }));

      const { error } = await supabase
        .from("award_votes")
        .insert(votesToSubmit);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Votes Submitted!",
        description: "Thank you for participating in the awards!",
      });
      if (id) markProgramAsVoted(id);
      setHasAlreadyVoted(true);
      queryClient.invalidateQueries({ queryKey: ["awards-voting", id] });
      setSelectedVotes({});
      setVoterName("");
      setVoterEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Submitting Votes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  const totalCategories = program.award_categories?.length || 0;
  const votedCategories = Object.keys(selectedVotes).length;
  const canSubmit = voterName && voterEmail && votedCategories > 0 && !hasAlreadyVoted;
  
  // Check if voting is closed
  const isVotingClosed = program.status === "closed" || program.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-navy text-white py-12">
        <div className="container mx-auto px-4">
          <BackButton fallbackPath="/browse-awards" label="Back to Awards" className="mb-6 text-white hover:bg-white/10" />

          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-brand-gold" />
              <h1 className="text-5xl font-black">{program.title}</h1>
            </div>
            {program.description && (
              <p className="text-xl text-white/90 mb-4">{program.description}</p>
            )}
            {isVotingClosed ? (
              <Badge className="bg-orange-500 text-white text-lg px-4 py-2">
                Voting Closed
              </Badge>
            ) : (
              <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                Voting Open
              </Badge>
            )}
            {program.ceremony_date && (
              <p className="text-white/80 mt-4">
                Ceremony: {format(new Date(program.ceremony_date), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Already Voted or Voting Closed Banner */}
        {hasAlreadyVoted && (
          <Card className="p-6 mb-8 border-green-500/30 bg-green-500/10">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                  You've already submitted your votes for this program
                </h3>
                <p className="text-sm text-muted-foreground">
                  Thank you for participating! Your votes have been recorded.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isVotingClosed && !hasAlreadyVoted && (
          <Card className="p-6 mb-8 border-orange-500/30 bg-orange-500/10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <XCircle className="h-8 w-8 text-orange-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400">
                    Voting has closed for this program
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Winners will be announced soon. Check back later!
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/awards/${id}/winners`)}
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
              >
                <Trophy className="mr-2 h-4 w-4" />
                View Winners
              </Button>
            </div>
          </Card>
        )}

        {/* Sponsors Section */}
        {program.award_sponsorships && program.award_sponsorships.length > 0 && (
          <Card className="p-8 mb-8 border-brand-gold/20">
            <h2 className="text-2xl font-bold mb-6 text-center">Our Sponsors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {program.award_sponsorships.map((sponsorship: any) => (
                <a
                  key={sponsorship.id}
                  href={sponsorship.sponsor_website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-brand-gold/5 transition-colors group"
                >
                  {sponsorship.sponsor_logo_url && (
                    <img
                      src={sponsorship.sponsor_logo_url}
                      alt={sponsorship.sponsor_name}
                      className="h-16 w-auto object-contain group-hover:scale-110 transition-transform"
                    />
                  )}
                  <span className="text-sm font-semibold text-center">{sponsorship.sponsor_name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-brand-gold" />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Voting Progress - Only show if voting is open */}
        {!isVotingClosed && !hasAlreadyVoted && (
          <Card className="p-6 mb-8 border-brand-gold/20 bg-brand-gold/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Your Voting Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Voted in {votedCategories} of {totalCategories} categories
                </p>
              </div>
              <div className="text-3xl font-black text-brand-gold">
                {totalCategories > 0 ? Math.round((votedCategories / totalCategories) * 100) : 0}%
              </div>
            </div>
          </Card>
        )}

        {/* Voter Information - Only show if voting is open */}
        {!isVotingClosed && !hasAlreadyVoted && (
          <Card className="p-6 mb-8 border-brand-gold/20">
            <h3 className="text-xl font-bold mb-4">Your Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voterName">Your Name *</Label>
                <Input
                  id="voterName"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="voterEmail">Your Email *</Label>
                <Input
                  id="voterEmail"
                  type="email"
                  value={voterEmail}
                  onChange={(e) => setVoterEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Categories and Nominees */}
        <div className="space-y-8">
          {program.award_categories?.map((category: any) => (
            <Card key={category.id} className="p-6 border-brand-gold/20">
              <div className="flex items-start gap-3 mb-4">
                <Award className="h-6 w-6 text-brand-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
              </div>

              {category.award_nominees && category.award_nominees.length > 0 ? (
                <div className="grid gap-4 mt-6">
                  {category.award_nominees.map((nominee: any) => {
                    const isSelected = selectedVotes[category.id] === nominee.id;
                    const canVote = !isVotingClosed && !hasAlreadyVoted;
                    
                    return (
                      <Card
                        key={nominee.id}
                        className={`p-4 transition-all ${
                          canVote ? "cursor-pointer" : "cursor-default"
                        } ${
                          isSelected
                            ? "border-2 border-brand-gold bg-brand-gold/5 shadow-lg"
                            : canVote 
                              ? "border hover:border-brand-gold/50 hover:shadow-md"
                              : "border"
                        }`}
                        onClick={() => {
                          if (canVote) {
                            setSelectedVotes((prev) => ({
                              ...prev,
                              [category.id]: nominee.id,
                            }));
                          }
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {nominee.nominee_image_url && (
                            <img
                              src={nominee.nominee_image_url}
                              alt={nominee.nominee_name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-lg">{nominee.nominee_name}</h4>
                                {nominee.nominee_description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {nominee.nominee_description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <Heart className="h-6 w-6 text-brand-gold fill-brand-gold flex-shrink-0" />
                              )}
                            </div>
                            {nominee.total_votes > 0 && program.show_live_results && (
                              <div className="mt-3 flex items-center gap-2">
                                <Star className="h-4 w-4 text-brand-gold" />
                                <span className="text-sm font-semibold">
                                  {nominee.total_votes} vote{nominee.total_votes !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No nominees in this category yet
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Submit Button - Only show if voting is open and user hasn't voted */}
        {!isVotingClosed && !hasAlreadyVoted && (
          <div className="sticky bottom-6 mt-8 z-10">
            <Card className="p-6 border-brand-gold shadow-2xl bg-background">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold">Ready to submit your votes?</p>
                  <p className="text-sm text-muted-foreground">
                    You've voted in {votedCategories} categor{votedCategories !== 1 ? "ies" : "y"}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => submitVotes.mutate()}
                  disabled={!canSubmit || submitVotes.isPending}
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold"
                >
                  {submitVotes.isPending ? "Submitting..." : "Submit Votes"}
                  <Trophy className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
