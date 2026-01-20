import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, Calendar, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Awards() {
  const navigate = useNavigate();
  
  const { data: programs, isLoading } = useQuery({
    queryKey: ["awards-programs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("awards_programs")
        .select(`
          *,
          award_categories(count),
          award_nominees(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      nominations_open: "bg-blue-500",
      voting_open: "bg-green-500",
      closed: "bg-orange-500",
      completed: "bg-purple-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-brand-gold">
            Awards Programs
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your awards programs, voting, and ceremonies
          </p>
        </div>
        <Button 
          onClick={() => navigate("/awards/create")}
          className="bg-brand-gold hover:bg-brand-darkGold text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Awards Program
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program: any) => (
            <Card
              key={program.id}
              className="cursor-pointer hover:shadow-lg transition-all border-brand-gold/20 hover:border-brand-gold/50 group"
              onClick={() => navigate(`/awards/${program.id}`)}
            >
              {program.cover_image_url ? (
                <img
                  src={program.cover_image_url}
                  alt={program.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-brand-gold/20 rounded-t-lg flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-brand-gold" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold group-hover:text-brand-gold transition-colors">
                    {program.title}
                  </h3>
                  <Badge className={`${getStatusColor(program.status)} text-white`}>
                    {getStatusLabel(program.status)}
                  </Badge>
                </div>
                
                {program.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {program.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>{program.award_categories?.[0]?.count || 0} Categories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{program.award_nominees?.[0]?.count || 0} Nominees</span>
                  </div>
                  {program.voting_open_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Voting: {format(new Date(program.voting_open_date), "MMM d")}</span>
                    </div>
                  )}
                  {program.ceremony_date && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Ceremony: {format(new Date(program.ceremony_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-2 border-brand-gold/30">
          <Trophy className="h-16 w-16 mx-auto text-brand-gold mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Awards Programs Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first awards program to start collecting nominations and votes
          </p>
          <Button 
            onClick={() => navigate("/awards/create")}
            className="bg-brand-gold hover:bg-brand-darkGold text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Awards Program
          </Button>
        </Card>
      )}
    </div>
  );
}