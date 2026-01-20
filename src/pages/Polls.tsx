import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Plus, Calendar, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Poll {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  deadline: string | null;
  created_at: string;
}

const Polls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolls(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading polls",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Polls</h1>
          <p className="text-muted-foreground mt-1">
            Create polls to find the best meeting times
          </p>
        </div>
        <Button onClick={() => navigate("/create-poll")}>
          <Plus className="h-4 w-4 mr-2" />
          New Poll
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first poll Seeksy and find the perfect time everyone can meet
          </p>
          <Button onClick={() => navigate("/create-poll")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Poll Seeksy
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <InteractiveCard
              key={poll.id}
              className="p-5 hover:shadow-lg transition-shadow"
              onInteract={() => navigate(`/poll/${poll.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold">{poll.title}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    poll.is_published
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {poll.is_published ? "Published" : "Draft"}
                </span>
              </div>
              
              {poll.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {poll.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(poll.created_at), "MMM d, yyyy")}
                </span>
                {poll.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Deadline: {format(new Date(poll.deadline), "MMM d")}
                  </span>
                )}
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Polls;