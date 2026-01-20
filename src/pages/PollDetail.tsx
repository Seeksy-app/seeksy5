import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, Users, ArrowLeft, Check, Loader2, Share2, Copy } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Poll {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  allow_multiple_votes: boolean;
  require_voter_info: boolean;
  image_url: string | null;
  deadline: string | null;
  user_id: string;
}

interface PollOption {
  id: string;
  option_date: string;
  start_time: string | null;
  end_time: string | null;
  vote_count?: number;
}

interface Vote {
  option_id: string;
  voter_email: string;
  voter_name: string;
}

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadPollData();
  }, [id]);

  const loadPollData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load poll
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .single();

      if (pollError) throw pollError;
      setPoll(pollData);
      setIsOwner(user?.id === pollData.user_id);

      // Load options
      const { data: optionsData, error: optionsError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", id)
        .order("option_date", { ascending: true });

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);

      // Load votes
      const { data: votesData, error: votesError } = await supabase
        .from("poll_votes")
        .select("*")
        .eq("poll_id", id);

      if (votesError) throw votesError;
      setVotes(votesData || []);

      // Pre-fill email if user is logged in
      if (user?.email) {
        setVoterEmail(user.email);
      }
    } catch (error: any) {
      toast({
        title: "Error loading poll",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVoteCount = (optionId: string) => {
    return votes.filter((v) => v.option_id === optionId).length;
  };

  const handleOptionToggle = (optionId: string) => {
    if (poll?.allow_multiple_votes) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }

    if (poll?.require_voter_info && (!voterName || !voterEmail)) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and email",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const votesData = selectedOptions.map((optionId) => ({
        poll_id: id!,
        option_id: optionId,
        voter_email: voterEmail || "anonymous@poll.vote",
        voter_name: voterName || "Anonymous",
      }));

      const { error } = await supabase.from("poll_votes").insert(votesData);

      if (error) throw error;

      toast({
        title: "Vote submitted!",
        description: "Thank you for voting",
      });

      // Reload to show updated results
      await loadPollData();
      setSelectedOptions([]);
    } catch (error: any) {
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Loading poll...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Poll not found</h3>
          <Button onClick={() => navigate("/polls")}>Back to Polls</Button>
        </Card>
      </div>
    );
  }

  const pollUrl = `${window.location.origin}/poll/${poll.id}`;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/polls")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Polls
      </Button>

      <Card className="p-6 mb-6">
        {poll.image_url && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img 
              src={poll.image_url} 
              alt={poll.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{poll.title}</h1>
              <Badge variant={poll.is_published ? "default" : "secondary"}>
                {poll.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            {poll.description && (
              <p className="text-muted-foreground">{poll.description}</p>
            )}
          </div>
          {isOwner && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Poll
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Share this poll</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy this link to share with voters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input value={pollUrl} readOnly className="flex-1" />
                    <Button
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(pollUrl);
                        toast({
                          title: "Link copied!",
                          description: "Poll link copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {navigator.share && (
                    <Button
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: poll.title,
                            text: `Vote on: ${poll.title}`,
                            url: pollUrl,
                          });
                        } catch (error) {
                          // User cancelled
                        }
                      }}
                      className="w-full"
                      variant="secondary"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share via...
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {poll.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Voting deadline: {format(new Date(poll.deadline), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Voting Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
          
          {poll.require_voter_info && (
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="voterName">Your Name *</Label>
                <Input
                  id="voterName"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voterEmail">Your Email *</Label>
                <Input
                  id="voterEmail"
                  type="email"
                  value={voterEmail}
                  onChange={(e) => setVoterEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
          )}

          <div className="space-y-2 mb-6">
            <Label className="text-lg font-semibold">
              Select {poll.allow_multiple_votes ? "Options" : "an Option"}
            </Label>
            {options.map((option) => (
              <Card
                key={option.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedOptions.includes(option.id)
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedOptions.includes(option.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedOptions.includes(option.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(option.option_date), "EEE, MMM d, yyyy")}
                      </p>
                      {option.start_time && option.end_time && (
                        <p className="text-sm text-muted-foreground">
                          {option.start_time} - {option.end_time}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {getVoteCount(option.id)}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleSubmitVote}
            className="w-full"
            disabled={submitting || selectedOptions.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Vote
          </Button>
        </Card>

        {/* Results Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          <div className="space-y-4">
            {options.map((option) => {
              const voteCount = getVoteCount(option.id);
              const totalVotes = votes.length;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const optionVoters = votes
                .filter((v) => v.option_id === option.id)
                .map((v) => v.voter_name);

              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {format(new Date(option.option_date), "MMM d, yyyy")}
                      {option.start_time && ` • ${option.start_time}`}
                    </span>
                    <span className="text-muted-foreground">
                      {voteCount} {voteCount === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {optionVoters.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {optionVoters.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {votes.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No votes yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PollDetail;