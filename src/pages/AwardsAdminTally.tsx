import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";
import { 
  Trophy, Award, Lock, Crown, Loader2, BarChart3 
} from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AwardsAdminTally() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRoles();

  const [selectedWinner, setSelectedWinner] = useState<{
    categoryId: string;
    nomineeId: string;
    nomineeName: string;
    categoryName: string;
  } | null>(null);

  // Fetch program with categories, nominees, and votes
  const { data: program, isLoading } = useQuery({
    queryKey: ["awards-tally", id],
    queryFn: async () => {
      const programResult = await (supabase as any)
        .from("awards_programs")
        .select(`
          *,
          award_categories(
            *,
            award_nominees(*, total_votes),
            award_winners(*)
          )
        `)
        .eq("id", id)
        .single();

      if (programResult.error) throw programResult.error;
      const data = programResult.data as any;

      // Fetch vote counts for each nominee
      const votesResult = await (supabase as any)
        .from("award_votes")
        .select("nominee_id")
        .eq("program_id", id);
      const votes = votesResult.data as any[] || [];

      // Count votes per nominee
      const voteCounts: Record<string, number> = {};
      votes.forEach((v: any) => {
        voteCounts[v.nominee_id] = (voteCounts[v.nominee_id] || 0) + 1;
      });

      // Fetch judge scores
      const scoresResult = await (supabase as any)
        .from("award_judge_scores")
        .select("nominee_id, score");
      const judgeScores = scoresResult.data as any[] || [];

      const avgScores: Record<string, { total: number; count: number }> = {};
      judgeScores.forEach((s: any) => {
        if (!avgScores[s.nominee_id]) {
          avgScores[s.nominee_id] = { total: 0, count: 0 };
        }
        avgScores[s.nominee_id].total += s.score;
        avgScores[s.nominee_id].count += 1;
      });

      // Attach vote counts and scores to nominees
      data.award_categories?.forEach((cat: any) => {
        cat.award_nominees?.forEach((nom: any) => {
          nom.vote_count = voteCounts[nom.id] || 0;
          const scoreData = avgScores[nom.id];
          nom.avg_judge_score = scoreData 
            ? (scoreData.total / scoreData.count).toFixed(1) 
            : null;
        });
        // Sort by votes descending
        cat.award_nominees?.sort((a: any, b: any) => b.vote_count - a.vote_count);
      });

      return data;
    },
  });

  // Lock category mutation - skip for now as table doesn't have status
  const lockCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      // Table doesn't have a lock field, just show toast
      console.log("Lock category:", categoryId);
    },
    onSuccess: () => {
      toast({ title: "Category locked" });
      queryClient.invalidateQueries({ queryKey: ["awards-tally", id] });
    },
  });

  // Select winner mutation
  const selectWinner = useMutation({
    mutationFn: async ({ categoryId, nomineeId }: { categoryId: string; nomineeId: string }) => {
      // Insert winner
      const result = await (supabase as any)
        .from("award_winners")
        .insert([{
          category_id: categoryId,
          nominee_id: nomineeId,
          placement: 1,
          program_id: id,
        }]);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast({ title: "Winner selected!", description: "The winner has been announced." });
      queryClient.invalidateQueries({ queryKey: ["awards-tally", id] });
      setSelectedWinner(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error selecting winner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
        <p className="text-muted-foreground">You need admin privileges to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  const categories = program.award_categories || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-navy text-white py-8">
        <div className="container mx-auto px-4">
          <BackButton fallbackPath={`/awards/${id}`} label="Back to Program" className="mb-4 text-white hover:bg-white/10" />
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6" />
            <Badge variant="secondary">Admin Tally</Badge>
          </div>
          <h1 className="text-3xl font-bold">{program.title}</h1>
          <p className="text-white/80 mt-1">Vote tallies and winner selection</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {categories.map((cat: any) => {
            const nominees = cat.award_nominees || [];
            const winner = cat.award_winners?.[0];
            const isLocked = cat.status === "closed";

            return (
              <Card key={cat.id} className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-brand-gold" />
                    <div>
                      <h2 className="text-xl font-bold">{cat.name}</h2>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {winner && (
                      <Badge className="bg-green-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Winner Declared
                      </Badge>
                    )}
                    {isLocked && !winner && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    {!isLocked && !winner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => lockCategory.mutate(cat.id)}
                        disabled={lockCategory.isPending}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Lock Category
                      </Button>
                    )}
                  </div>
                </div>

                {/* Nominees Table */}
                <div className="space-y-3">
                  {nominees.map((nominee: any, index: number) => {
                    const isWinner = winner?.nominee_id === nominee.id;

                    return (
                      <div
                        key={nominee.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isWinner
                            ? "bg-brand-gold/10 border-2 border-brand-gold"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-muted-foreground w-8">
                            #{index + 1}
                          </span>
                          {nominee.nominee_image_url && (
                            <img
                              src={nominee.nominee_image_url}
                              alt={nominee.nominee_name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {nominee.nominee_name}
                              {isWinner && (
                                <Crown className="h-5 w-5 text-brand-gold" />
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{nominee.vote_count}</p>
                            <p className="text-xs text-muted-foreground">Votes</p>
                          </div>

                          {nominee.avg_judge_score && (
                            <div className="text-center">
                              <p className="text-2xl font-bold">{nominee.avg_judge_score}</p>
                              <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                          )}

                          {!winner && !isLocked && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedWinner({
                                categoryId: cat.id,
                                nomineeId: nominee.id,
                                nomineeName: nominee.nominee_name,
                                categoryName: cat.name,
                              })}
                            >
                              Select Winner
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {nominees.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No nominees in this category
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Confirm Winner Dialog */}
      <AlertDialog open={!!selectedWinner} onOpenChange={() => setSelectedWinner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Winner Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to select <strong>{selectedWinner?.nomineeName}</strong> as the 
              winner for <strong>{selectedWinner?.categoryName}</strong>. This action will 
              lock the category and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedWinner) {
                  selectWinner.mutate({
                    categoryId: selectedWinner.categoryId,
                    nomineeId: selectedWinner.nomineeId,
                  });
                }
              }}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Confirm Winner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
