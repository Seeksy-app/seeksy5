import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Crown, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { BackButton } from "@/components/navigation/BackButton";

interface AwardsWinnersProgram {
  id: string;
  title: string;
  ceremony_date?: string;
  award_winners?: any[];
}

export default function AwardsWinners() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: program, isLoading } = useQuery({
    queryKey: ["awards-winners", id],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("awards_programs")
        .select(`
          *,
          award_winners(
            *,
            award_categories(*),
            award_nominees(*)
          )
        `)
        .eq("id", id)
        .single();

      if (result.error) throw result.error;
      return result.data as AwardsWinnersProgram;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Program Not Found</h1>
        <Button onClick={() => navigate("/browse-awards")}>Browse Awards</Button>
      </div>
    );
  }

  const winners = program.award_winners || [];

  if (winners.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-brand-navy text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <BackButton fallbackPath={`/awards/${id}`} label="Back to Program" className="mb-6 text-white hover:bg-white/10" />
            <Trophy className="h-16 w-16 mx-auto mb-4 text-brand-gold" />
            <h1 className="text-4xl font-bold">{program.title}</h1>
            <p className="text-xl text-white/80 mt-2">Winners</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 text-center">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Winners Not Yet Announced</h2>
          <p className="text-muted-foreground mb-6">
            Check back later to see the winners of this awards program.
          </p>
          {program.ceremony_date && (
            <p className="text-sm text-muted-foreground">
              Ceremony date: {format(new Date(program.ceremony_date), "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-navy text-white py-12">
        <div className="container mx-auto px-4">
          <BackButton fallbackPath={`/awards/${id}`} label="Back to Program" className="mb-6 text-white hover:bg-white/10" />
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-brand-gold" />
            </div>
            <h1 className="text-5xl font-black mb-4">{program.title}</h1>
            <p className="text-xl text-white/90">Winners</p>
            <Badge className="bg-brand-gold text-brand-navy mt-4">
              {winners.length} Winners Announced
            </Badge>
          </div>
        </div>
      </div>

      {/* Winners Grid */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {winners.map((winner: any) => {
            const category = winner.award_categories;
            const nominee = winner.award_nominees;

            if (!category || !nominee) return null;

            return (
              <Card
                key={winner.id}
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Winner Image */}
                {nominee.nominee_image_url ? (
                  <div className="relative">
                    <img
                      src={nominee.nominee_image_url}
                      alt={nominee.nominee_name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-brand-gold text-brand-navy">
                        <Crown className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-brand-gold/20 flex items-center justify-center relative">
                    <Trophy className="h-16 w-16 text-brand-gold" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-brand-gold text-brand-navy">
                        <Crown className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-brand-gold" />
                    <span className="text-sm font-medium text-brand-gold">
                      {category.name}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-brand-gold transition-colors">
                    {nominee.nominee_name}
                  </h3>

                  {nominee.nominee_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {nominee.nominee_description}
                    </p>
                  )}

                  {nominee.nominee_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <a
                        href={nominee.nominee_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Sponsors Section */}
        {program.ceremony_date && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Announced on {format(new Date(program.ceremony_date), "MMMM d, yyyy")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
