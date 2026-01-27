import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Circle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  due_date: string | null;
}

export function TodaysTasks() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin-todays-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = format(new Date(), "yyyy-MM-dd");

      const { data } = await (supabase as any)
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("due_date", today)
        .in("status", ["todo", "in_progress", "backlog"])
        .order("priority", { ascending: true })
        .limit(10);

      return (data || []) as Task[];
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress": return "In Progress";
      case "todo": return "To Do";
      case "backlog": return "Backlog";
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Today's Tasks
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/tasks">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-3 p-2">
              <Circle className="h-4 w-4 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-muted/50">
              <div className="p-3 rounded-full bg-primary/10">
                <CheckSquare className="h-8 w-8 text-primary opacity-60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No tasks due today</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add a task with today's due date to see it here
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/tasks">Go to Tasks</Link>
              </Button>
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/admin/tasks?task=${task.id}`}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-border/50 cursor-pointer"
                >
                  <div className={`h-3 w-3 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link to="/admin/tasks">View All Tasks</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
