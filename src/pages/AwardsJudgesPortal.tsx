import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Award, User, Star, CheckCircle, Loader2 } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";

export default function AwardsJudgesPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; notes: string }>>({});

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get judge assignments
  const { data: judgeData, isLoading } = useQuery({
    queryKey: ["judge-assignments", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get judge record
      const result = await (supabase as any)
        .from("award_judges")
        .select(`
          *,
          awards_programs(
            id,
            title,
            status,
            award_categories(
              *,
              award_nominees(*)
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (result.error) {
        console.error("Judge lookup error:", result.error);
        return null;
      }

      return result.data as any;
    },
    enabled: !!user,
  });

  // Get existing scores
  const { data: existingScores } = useQuery({
    queryKey: ["judge-scores", user?.id],
    queryFn: async () => {
      if (!user || !judgeData) return {};

      const result = await (supabase as any)
        .from("award_judge_scores")
        .select("*")
        .eq("judge_id", judgeData.id);

      if (result.error) {
        console.error("Scores lookup error:", result.error);
        return {};
      }

      const data = result.data as any[];
      const scoreMap: Record<string, { score: number; notes: string }> = {};
      data?.forEach(s => {
        scoreMap[s.nominee_id] = { score: s.score, notes: s.comments || "" };
      });
      return scoreMap;
    },
    enabled: !!user && !!judgeData,
  });

  useEffect(() => {
    if (existingScores) {
      setScores(existingScores);
    }
  }, [existingScores]);

  // Submit score mutation
  const submitScore = useMutation({
    mutationFn: async ({ nomineeId, score, notes }: { nomineeId: string; score: number; notes: string }) => {
      if (!judgeData) throw new Error("No judge record");

      const result = await (supabase as any)
        .from("award_judge_scores")
        .upsert({
          judge_id: judgeData.id,
          nominee_id: nomineeId,
          program_id: judgeData.program_id,
          category_id: judgeData.assigned_categories?.[0] || "",
          score,
          comments: notes,
        }, {
          onConflict: "judge_id,nominee_id",
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast({ title: "Score saved!" });
      queryClient.invalidateQueries({ queryKey: ["judge-scores"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving score",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScoreChange = (nomineeId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [nomineeId]: { ...prev[nomineeId], score, notes: prev[nomineeId]?.notes || "" },
    }));
  };

  const handleNotesChange = (nomineeId: string, notes: string) => {
    setScores(prev => ({
      ...prev,
      [nomineeId]: { ...prev[nomineeId], notes, score: prev[nomineeId]?.score || 5 },
    }));
  };

  const handleSaveScore = (nomineeId: string) => {
    const scoreData = scores[nomineeId];
    if (scoreData) {
      submitScore.mutate({
        nomineeId,
        score: scoreData.score,
        notes: scoreData.notes,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!judgeData || !judgeData.awards_programs) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl text-center">
        <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Judge Assignments</h1>
        <p className="text-muted-foreground mb-6">
          You don't have any active judge assignments. Contact the awards program administrator.
        </p>
        <Button onClick={() => navigate("/awards")}>Browse Awards Programs</Button>
      </div>
    );
  }

  const program = judgeData.awards_programs;
  const categories = program.award_categories || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-navy text-white py-8">
        <div className="container mx-auto px-4">
          <BackButton fallbackPath="/awards" label="Back to Awards" className="mb-4 text-white hover:bg-white/10" />
          <div className="flex items-center gap-3 mb-2">
            <User className="h-6 w-6" />
            <Badge variant="secondary">Judge Portal</Badge>
          </div>
          <h1 className="text-3xl font-bold">{program.title}</h1>
          <p className="text-white/80 mt-1">
            Welcome • {categories.length} categories to review
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((cat: any) => {
                  const nominees = cat.award_nominees || [];
                  const scoredCount = nominees.filter((n: any) => scores[n.id]?.score).length;
                  const isComplete = scoredCount === nominees.length && nominees.length > 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-xs opacity-70">
                          {scoredCount}/{nominees.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content - Nominees */}
          <div className="lg:col-span-3">
            {selectedCategory ? (
              <div className="space-y-6">
                {categories
                  .filter((cat: any) => cat.id === selectedCategory)
                  .map((cat: any) => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-3 mb-6">
                        <Award className="h-6 w-6 text-brand-gold" />
                        <div>
                          <h2 className="text-2xl font-bold">{cat.name}</h2>
                          {cat.description && (
                            <p className="text-muted-foreground">{cat.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(cat.award_nominees || []).map((nominee: any) => {
                          const currentScore = scores[nominee.id]?.score || 5;
                          const currentNotes = scores[nominee.id]?.notes || "";
                          const hasScore = existingScores?.[nominee.id];

                          return (
                            <Card key={nominee.id} className="p-6">
                              <div className="flex gap-4">
                                {nominee.nominee_image_url && (
                                  <img
                                    src={nominee.nominee_image_url}
                                    alt={nominee.nominee_name}
                                    className="w-24 h-24 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold">
                                        {nominee.nominee_name}
                                      </h3>
                                      {nominee.nominee_description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {nominee.nominee_description}
                                        </p>
                                      )}
                                    </div>
                                    {hasScore && (
                                      <Badge variant="secondary">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Scored
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="mt-6 space-y-4">
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <Label>Score</Label>
                                        <div className="flex items-center gap-2">
                                          <Star className="h-4 w-4 text-brand-gold" />
                                          <span className="text-lg font-bold">{currentScore}</span>
                                          <span className="text-muted-foreground">/ 10</span>
                                        </div>
                                      </div>
                                      <Slider
                                        value={[currentScore]}
                                        onValueChange={([v]) => handleScoreChange(nominee.id, v)}
                                        min={1}
                                        max={10}
                                        step={1}
                                        className="py-2"
                                      />
                                    </div>

                                    <div>
                                      <Label>Notes (optional)</Label>
                                      <Textarea
                                        value={currentNotes}
                                        onChange={(e) => handleNotesChange(nominee.id, e.target.value)}
                                        placeholder="Add your judging notes..."
                                        rows={2}
                                        className="mt-1"
                                      />
                                    </div>

                                    <Button
                                      onClick={() => handleSaveScore(nominee.id)}
                                      disabled={submitScore.isPending}
                                      size="sm"
                                    >
                                      {submitScore.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : null}
                                      Save Score
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Category</h3>
                <p className="text-muted-foreground">
                  Choose a category from the sidebar to start scoring nominees.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
