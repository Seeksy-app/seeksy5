import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  FolderKanban,
  Calendar,
  ArrowRight
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  category: string;
  created_at: string;
}

export default function MyWork() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "upcoming">("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch tasks assigned to the user OR created by the user
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("tasks")
        .insert({
          title: newTaskTitle,
          user_id: user.id,
          status: "todo",
          priority: "medium",
          category: "general",
        });

      if (error) throw error;

      toast({
        title: "Task added",
        description: "New task has been created",
      });
      setNewTaskTitle("");
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "done" })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Task completed",
        description: "Task marked as done",
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFilteredTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "today":
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      case "overdue":
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate < today;
        });
      case "upcoming":
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate > today;
        });
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "todo": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "backlog": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate.getTime() === today.getTime()) return "Today";
    if (dueDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    if (dueDate < today) return "Overdue";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-primary" />
              My Work
            </h1>
            <p className="text-muted-foreground mt-1">
              All your tasks in one place
            </p>
          </div>
          <Button onClick={() => navigate('/tasks')}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Open Project Manager
          </Button>
        </div>

        {/* Quick Add */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Add a quick task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                className="flex-1"
              />
              <Button onClick={handleQuickAdd} disabled={!newTaskTitle.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className={`cursor-pointer transition-colors ${filter === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{tasks.length}</div>
              <div className="text-sm text-muted-foreground">All Tasks</div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors ${filter === 'today' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            onClick={() => setFilter('today')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">
                {tasks.filter(t => {
                  if (!t.due_date) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const due = new Date(t.due_date);
                  due.setHours(0, 0, 0, 0);
                  return due.getTime() === today.getTime();
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Due Today</div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors ${filter === 'overdue' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            onClick={() => setFilter('overdue')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">
                {tasks.filter(t => isOverdue(t.due_date)).length}
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors ${filter === 'upcoming' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            onClick={() => setFilter('upcoming')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">
                {tasks.filter(t => {
                  if (!t.due_date) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return new Date(t.due_date) > today;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {filter === 'all' && 'All Tasks'}
              {filter === 'today' && 'Due Today'}
              {filter === 'overdue' && 'Overdue Tasks'}
              {filter === 'upcoming' && 'Upcoming Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No tasks yet. Add your first task above!' : 'No tasks match this filter'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <Checkbox
                        checked={task.status === 'done'}
                        onCheckedChange={() => handleToggleComplete(task.id)}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          {task.due_date && (
                            <span className={`text-xs flex items-center gap-1 ${isOverdue(task.due_date) ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {isOverdue(task.due_date) ? (
                                <AlertCircle className="h-3 w-3" />
                              ) : (
                                <Calendar className="h-3 w-3" />
                              )}
                              {formatDueDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate('/tasks')}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
