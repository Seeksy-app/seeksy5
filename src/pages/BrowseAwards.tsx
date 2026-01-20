import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function BrowseAwards() {
  const navigate = useNavigate();

  const { data: programs, isLoading } = useQuery({
    queryKey: ["public-awards-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards_programs")
        .select(`
          *,
          award_categories (id),
          award_nominees (id)
        `)
        .in("status", ["nominations_open", "voting_open"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      nominations_open: "bg-blue-500",
      voting_open: "bg-green-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusText = (status: string) => {
    const texts = {
      nominations_open: "Nominations Open",
      voting_open: "Voting Open",
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-navy text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-brand-gold" />
              <h1 className="text-5xl font-black">Awards Programs</h1>
            </div>
            <p className="text-xl text-white/90">
              Discover active awards programs, submit nominations, and vote for your favorites
            </p>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="container mx-auto px-4 py-12">
        {!programs || programs.length === 0 ? (
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No Active Programs</h3>
            <p className="text-muted-foreground mb-6">
              There are currently no awards programs accepting nominations or votes. Check back soon!
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return Home
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {programs.map((program) => (
              <Card 
                key={program.id} 
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-brand-gold/20 hover:border-brand-gold"
                onClick={() => {
                  if (program.status === "nominations_open") {
                    navigate(`/nominate/${program.id}`);
                  } else if (program.status === "voting_open") {
                    navigate(`/awards/${program.id}/vote`);
                  }
                }}
              >
                {/* Cover Image */}
                {program.cover_image_url ? (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={program.cover_image_url}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-brand-gold/20 flex items-center justify-center">
                    <Trophy className="h-20 w-20 text-brand-gold" />
                  </div>
                )}

                <div className="p-6">
                  {/* Status Badge */}
                  <Badge className={`${getStatusColor(program.status)} text-white mb-3`}>
                    {getStatusText(program.status)}
                  </Badge>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-brand-gold transition-colors">
                    {program.title}
                  </h3>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {program.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      <span>{program.award_categories?.length || 0} Categories</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{program.award_nominees?.length || 0} Nominees</span>
                    </div>
                  </div>

                  {/* Ceremony Date */}
                  {program.ceremony_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>Ceremony: {format(new Date(program.ceremony_date), "MMM d, yyyy")}</span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold group-hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (program.status === "nominations_open") {
                        navigate(`/nominate/${program.id}`);
                      } else if (program.status === "voting_open") {
                        navigate(`/awards/${program.id}/vote`);
                      }
                    }}
                  >
                    {program.status === "nominations_open" ? "Submit Nomination" : "Vote Now"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
