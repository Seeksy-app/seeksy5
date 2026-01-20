import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ActivityLog from "@/components/ActivityLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, List, LayoutGrid, User, ArrowUpDown, CheckCircle, Clock, Rows3, Check, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CategoryManager } from "@/components/tasks/CategoryManager";
import { CategorySelect } from "@/components/tasks/CategorySelect";
import { SectionSelect, useSections } from "@/components/tasks/SectionSelect";
import { TaskSectionsView } from "@/components/tasks/TaskSectionsView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTaskReminders } from "@/hooks/useTaskReminders";
import { TaskComments } from "@/components/tasks/TaskComments";
import { Separator } from "@/components/ui/separator";
import { TaskBulkActions } from "@/components/tasks/TaskBulkActions";
import { Checkbox } from "@/components/ui/checkbox";

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  section: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  assignee?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  assigner?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface TeamMember {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

const INITIAL_TASKS = [
  {
    title: "InfluenceHub - Instagram, Facebook, TikTok Integration",
    description: "Connect and post to Instagram, Facebook, and TikTok accounts",
    category: "influencehub",
    priority: "high",
    status: "in_progress"
  },
  {
    title: "InfluenceHub - Creator Dashboard & Media Library",
    description: "Upload media, organize in collections, drag-and-drop calendar",
    category: "influencehub",
    priority: "high",
    status: "in_progress"
  },
  {
    title: "InfluenceHub - Agency Multi-Creator Management",
    description: "Allow agencies to manage multiple creators and approve content",
    category: "influencehub",
    priority: "high",
    status: "in_progress"
  },
  {
    title: "InfluenceHub - AI Caption Generation",
    description: "Use Lovable AI to generate captions, hashtags, and content suggestions",
    category: "influencehub",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "InfluenceHub - Influencer CRM",
    description: "Track brand partnerships, contracts, deliverables, rates, pipeline",
    category: "influencehub",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "InfluenceHub - Analytics Dashboard",
    description: "Engagement rates, growth, content performance, per-platform analytics",
    category: "influencehub",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "AI Context Storage System",
    description: "Store brand guidelines, creator preferences, past successful content for AI to reference",
    category: "ai",
    priority: "high",
    status: "backlog"
  },
  {
    title: "Email Integration for Campaign Briefs",
    description: "Parse campaign briefs from client emails, extract requirements, store in DB",
    category: "integrations",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Firefly/Granola Integration",
    description: "Capture meeting transcriptions, extract action items, campaign details",
    category: "integrations",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Document Upload for AI Training",
    description: "Upload brand guidelines, PDFs, documents that AI can reference",
    category: "ai",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Per-Creator AI Customization",
    description: "Each creator has their own knowledge base and AI preferences",
    category: "ai",
    priority: "low",
    status: "backlog"
  },
  {
    title: "Task Manager - Basic Reminders",
    description: "Browser notifications for outstanding tasks (hourly, start/end of day)",
    category: "task-manager",
    priority: "medium",
    status: "done"
  },
  {
    title: "Task Manager - Team Assignments",
    description: "Assign tasks to team members, track who's responsible for what",
    category: "task-manager",
    priority: "high",
    status: "backlog"
  },
  {
    title: "Task Manager - Due Dates",
    description: "Set due dates for tasks, show overdue indicators, sort by urgency",
    category: "task-manager",
    priority: "high",
    status: "backlog"
  },
  {
    title: "Task Manager - Comments & Activity",
    description: "Add comments to tasks, track activity history, collaborate on tasks",
    category: "task-manager",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Task Manager - Filters & Search",
    description: "Filter by assignee, category, priority, status. Search tasks by title/description",
    category: "task-manager",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Task Manager - Advanced Reminders",
    description: "Smart notifications based on due dates, priority, customizable per task",
    category: "task-manager",
    priority: "low",
    status: "backlog"
  },
  {
    title: "Blog System - Creator Personal Blogs",
    description: "Individual blog pages for creators at seeksy.creator.blog, integrated into My Page with SEO optimization, custom domains support",
    category: "blog",
    priority: "high",
    status: "backlog"
  },
  {
    title: "Blog System - Master Seeksy Blog",
    description: "Central Seeksy blog where creators can submit/syndicate their articles. Community-driven content discovery",
    category: "blog",
    priority: "high",
    status: "backlog"
  },
  {
    title: "Blog System - Podcast-to-Blog AI Conversion",
    description: "Auto-convert podcast transcripts to SEO-optimized blog posts with AI-generated images, headings, meta descriptions, and formatting",
    category: "blog",
    priority: "high",
    status: "backlog"
  },
  {
    title: "Blog System - Auto-Generate Seeksy Blog Posts",
    description: "AI system to automatically generate 3 blog posts for Seeksy platform without human intervention, publish directly to Master Blog",
    category: "blog",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Blog System - Rich Editor & Media Management",
    description: "WYSIWYG editor with image uploads, video embeds, code blocks, similar to Medium/Dropinblog experience",
    category: "blog",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Blog System - SEO Tools & Analytics",
    description: "Built-in SEO scoring, keyword suggestions, meta tag editor, Google Analytics integration, performance tracking",
    category: "blog",
    priority: "medium",
    status: "backlog"
  },
  {
    title: "Blog System - Advanced SEO Editor (DropInBlog-style)",
    description: "Real-time SEO analysis with Mention Boost scoring, keyword density tracking, content optimization suggestions, visual progress indicators, detailed SEO feedback similar to DropInBlog interface",
    category: "blog",
    priority: "high",
    status: "backlog"
  }
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list" | "sections">("board");
  const [viewModeLoaded, setViewModeLoaded] = useState(false);
  const [sortField, setSortField] = useState<keyof Task | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"my" | "all" | "due">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Enable Chrome notifications for task reminders
  useTaskReminders();

  // Save view mode preference when it changes
  useEffect(() => {
    if (!viewModeLoaded || !currentUserId) return;
    
    const saveViewMode = async () => {
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: currentUserId, task_view_mode: viewMode },
          { onConflict: "user_id" }
        );
    };
    
    saveViewMode();
  }, [viewMode, viewModeLoaded, currentUserId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    status: "backlog",
    section: "none",
    assigned_to: "unassigned", // Will be updated when currentUserId is loaded
    due_date: "",
  });

  // Auto-assign to current user when they're loaded
  useEffect(() => {
    if (currentUserId && formData.assigned_to === "unassigned") {
      setFormData(prev => ({ ...prev, assigned_to: currentUserId }));
    }
  }, [currentUserId]);

  const { sections, getSectionColor, reloadSections } = useSections();

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load view mode preference
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("task_view_mode")
        .eq("user_id", user.id)
        .single();
      
      if (prefs?.task_view_mode) {
        setViewMode(prefs.task_view_mode as "board" | "list" | "sections");
      }
      setViewModeLoaded(true);

      await Promise.all([
        fetchTasks(),
        fetchTeamMembers(),
        loadCategories(),
      ]);
    };

    initialize();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get team members from team_members table
      const { data: teamData } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", user.id);

      const memberIds = teamData ? teamData.map(m => m.user_id) : [];
      
      // Always include current user
      const allMemberIds = [...new Set([user.id, ...memberIds])];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", allMemberIds);

      setTeamMembers(profilesData || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Fallback to just current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (currentUserProfile) {
          setTeamMembers([currentUserProfile]);
        }
      }
    }
  };

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('task_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return category?.color || '#3B82F6';
  };

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If no tasks exist, create initial tasks
      if (!data || data.length === 0) {
        await initializeTasks(user.id);
        await fetchTasks();
        return;
      }

      // Fetch profile data for assignees and assigners
      const userIds = new Set<string>();
      data.forEach(task => {
        if (task.assigned_to) userIds.add(task.assigned_to);
        if (task.user_id) userIds.add(task.user_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich tasks with profile data
      const enrichedTasks = data.map(task => ({
        ...task,
        assignee: task.assigned_to ? profileMap.get(task.assigned_to) : null,
        assigner: task.user_id ? profileMap.get(task.user_id) : null,
      }));

      setTasks(enrichedTasks);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeTasks = async (userId: string) => {
    const tasksToInsert = INITIAL_TASKS.map(task => ({
      ...task,
      user_id: userId
    }));

    const { error } = await supabase
      .from("tasks")
      .insert(tasksToInsert);

    if (error) {
      console.error("Error initializing tasks:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingTask) {
        const { error } = await supabase
          .from("tasks")
          .update({
            ...formData,
            section: formData.section === "none" ? null : formData.section,
            assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
            due_date: formData.due_date || null,
          })
          .eq("id", editingTask.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert({
            ...formData,
            section: formData.section === "none" ? null : formData.section,
            assigned_to: formData.assigned_to === "unassigned" ? user.id : formData.assigned_to,
            due_date: formData.due_date || null,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }

      setFormData({
        title: "",
        description: "",
        category: "general",
        priority: "medium",
        status: "backlog",
        section: "none",
        assigned_to: "unassigned",
        due_date: "",
      });
      setEditingTask(null);
      setDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      category: task.category,
      priority: task.priority,
      status: task.status,
      section: task.section || "none",
      assigned_to: task.assigned_to || "unassigned",
      due_date: task.due_date || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted",
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Status updated",
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

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ priority: newPriority })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Priority updated",
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

  const handleAssigneeChange = async (taskId: string, newAssignee: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: newAssignee === "unassigned" ? null : newAssignee })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignee updated",
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


  const handleDueDateChange = async (taskId: string, newDueDate: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: newDueDate || null })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Due date updated",
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

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getFilteredTasks = () => {
    let result = tasks;
    
    // Apply filter mode
    if (filterMode === "my") {
      result = result.filter(t => t.assigned_to === currentUserId);
    } else if (filterMode === "due") {
      result = [...result]
        .filter(t => t.due_date)
        .sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.section?.toLowerCase().includes(query)
      );
    }
    
    return result;
  };

  const filteredTasks = getFilteredTasks();

  const getSortedTasks = () => {
    if (!sortField) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Selection handlers for bulk actions
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleAllSelection = () => {
    const sortedTasks = getSortedTasks();
    if (selectedTaskIds.length === sortedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(sortedTasks.map(t => t.id));
    }
  };

  const clearSelection = () => setSelectedTaskIds([]);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));

      toast({
        title: "Success",
        description: "Task moved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle moving task to a different section
  const handleSectionMove = async (taskId: string, newSection: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.section === newSection) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ section: newSection })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, section: newSection } : t
      ));

      toast({
        title: "Success",
        description: "Task moved to " + newSection,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const SortableTaskCard = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const assignedUser = getAssignedUser(task.assigned_to);

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card className="hover:shadow-md transition-shadow cursor-move">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight">
                {task.title}
              </CardTitle>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEdit(task)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              <Badge 
                className="text-white text-xs cursor-default"
                style={{ backgroundColor: getCategoryColor(task.category) }}
              >
                {task.category}
              </Badge>
              <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                {task.priority}
              </Badge>
            </div>
            {task.due_date && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              <Input
                type="date"
                value={task.due_date || ""}
                onChange={(e) => handleDueDateChange(task.id, e.target.value)}
                className="h-8 text-xs"
                placeholder="Set due date"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              {task.assignee && (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Assigned to: {task.assignee.full_name || "Unknown"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-xs text-muted-foreground">
                    {task.assignee.full_name || "Unknown"}
                  </span>
                </div>
              )}
              {task.assigner && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border-2 border-primary">
                        <AvatarImage src={task.assigner.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {task.assigner.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Created by: {task.assigner.full_name || "Unknown"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const DroppableColumn = ({ status, children }: { status: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    return (
      <div
        ref={setNodeRef}
        className={`space-y-4 min-h-[200px] p-3 rounded-lg transition-colors ${
          isOver ? 'bg-accent' : 'bg-muted/30'
        }`}
      >
        {children}
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "todo": return "bg-yellow-500";
      case "backlog": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getAssignedUser = (userId: string | null) => {
    if (!userId) return null;
    return teamMembers.find(m => m.id === userId);
  };

  const getUserInitials = (user: TeamMember | null) => {
    if (!user) return "?";
    if (user.full_name) {
      const parts = user.full_name.split(" ");
      return parts.map(p => p[0]).join("").substring(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "?";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Calculate these after loading check
  const groupedTasks = {
    backlog: filteredTasks.filter(t => t.status === "backlog"),
    todo: filteredTasks.filter(t => t.status === "todo"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    done: filteredTasks.filter(t => t.status === "done"),
    cancelled: filteredTasks.filter(t => t.status === "cancelled"),
  };

  // Calculate today's tasks stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysTasks = filteredTasks.filter(t => {
    const createdDate = new Date(t.created_at);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime() && t.status !== "done" && t.status !== "cancelled";
  });
  const estimatedHours = todaysTasks.length * 2; // Assume 2 hours per task

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Task Manager</h1>
          <p className="text-muted-foreground">
            Track all our ideas and features
          </p>
        </div>

        <div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTask(null);
              setFormData({
                title: "",
                description: "",
                category: "general",
                priority: "medium",
                status: "backlog",
                section: "none",
                assigned_to: "unassigned",
                due_date: "",
              });
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update task details" : "Create a new task or idea"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <CategorySelect
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    onManageCategories={() => {
                      setDialogOpen(false);
                      setCategoryManagerOpen(true);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div>
                <Label htmlFor="section">Section / Group</Label>
                <SectionSelect
                  value={formData.section}
                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                />
              </div>
              </div>
              <div>
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.username || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTask ? "Update Task" : "Create Task"}
              </Button>
            </form>

            {editingTask && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notes & Comments</h3>
                  <TaskComments taskId={editingTask.id} teamMembers={teamMembers} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="log">My Log</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {/* Task Stats Banner */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{todaysTasks.length}</p>
                      <p className="text-sm text-muted-foreground">Tasks today</p>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{estimatedHours}h</p>
                      <p className="text-sm text-muted-foreground">Estimated time</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={filterMode === "my" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterMode("my")}
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Tasks
                    </Button>
                    <Button
                      variant={filterMode === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterMode("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterMode === "due" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterMode("due")}
                    >
                      By Due Date
                    </Button>
                  </div>
                  
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === "sections" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("sections")}
                      className="rounded-r-none"
                    >
                      <Rows3 className="h-4 w-4 mr-2" />
                      Sections
                    </Button>
                    <Button
                      variant={viewMode === "board" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("board")}
                      className="rounded-none"
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Board
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Sections View */}
      {viewMode === "sections" && (
        <TaskSectionsView
          tasks={filteredTasks}
          sections={sections}
          onTaskMove={handleSectionMove}
          onTaskClick={(task) => {
            setEditingTask(task);
            setFormData({
              title: task.title,
              description: task.description || "",
              category: task.category,
              priority: task.priority,
              status: task.status,
              section: task.section || "none",
              assigned_to: task.assigned_to || "unassigned",
              due_date: task.due_date || "",
            });
            setDialogOpen(true);
          }}
          onAddTask={(sectionName) => {
            setEditingTask(null);
            setFormData({
              title: "",
              description: "",
              category: "general",
              priority: "medium",
              status: "todo",
              section: sectionName,
              assigned_to: currentUserId || "unassigned",
              due_date: "",
            });
            setDialogOpen(true);
          }}
          onAddSection={() => {
            // Open section manager - trigger via SectionSelect component
            const event = new CustomEvent('openSectionManager');
            window.dispatchEvent(event);
          }}
        />
      )}

      {/* Board View */}
      {viewMode === "board" && (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(groupedTasks).map(([status, statusTasks]) => (
              <DroppableColumn key={status} status={status}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold capitalize">
                    {status.replace("_", " ")} ({statusTasks.length})
                  </h3>
                </div>
                <SortableContext
                  items={statusTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <SortableTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </SortableContext>
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <Card className="opacity-90 cursor-grabbing">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {tasks.find(t => t.id === activeId)?.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedTaskIds.length > 0 && selectedTaskIds.length === getSortedTasks().length}
                    onCheckedChange={toggleAllSelection}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("title")} className="h-8 px-2">
                    Title
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("category")} className="h-8 px-2">
                    Category
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("priority")} className="h-8 px-2">
                    Priority
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("status")} className="h-8 px-2">
                    Status
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("due_date")} className="h-8 px-2">
                    Due Date
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("section")} className="h-8 px-2">
                    Section
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedTasks().map((task) => {
                const assignedUser = getAssignedUser(task.assigned_to);
                return (
                  <TableRow 
                    key={task.id} 
                    className={`cursor-pointer hover:bg-accent/50 ${selectedTaskIds.includes(task.id) ? 'bg-accent/30' : ''}`}
                    onClick={() => handleEdit(task)}
                  >
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="font-medium">{task.title}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge 
                        className="text-white text-xs cursor-default"
                        style={{ backgroundColor: getCategoryColor(task.category) }}
                      >
                        {task.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select
                        value={task.priority}
                        onValueChange={(value) => handlePriorityChange(task.id, value)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="date"
                        value={task.due_date || ""}
                        onChange={(e) => handleDueDateChange(task.id, e.target.value)}
                        className="h-8 w-36 text-xs"
                        placeholder="Set due date"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      {task.section ? (
                        <Badge 
                          className="text-white text-xs cursor-default"
                          style={{ backgroundColor: getSectionColor(task.section) }}
                        >
                          {task.section}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {task.assignee && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={task.assignee.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {task.assignee.full_name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Assigned to: {task.assignee.full_name || "Unknown"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Select
                            value={task.assigned_to || "unassigned"}
                            onValueChange={(value) => handleAssigneeChange(task.id, value)}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.full_name || member.username || "Unknown"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {task.assigner && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="whitespace-nowrap">Assigned by:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={task.assigner.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {task.assigner.full_name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{task.assigner.full_name || "Unknown"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(task);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="log">
          <ActivityLog />
        </TabsContent>
      </Tabs>

      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={(open) => {
          setCategoryManagerOpen(open);
          if (!open) {
            // Reopen task dialog if it was open before
            setDialogOpen(true);
          }
        }}
        onCategoryChange={() => {
          loadCategories();
          // Trigger reload in CategorySelect component
          if ((window as any)._reloadTaskCategories) {
            (window as any)._reloadTaskCategories();
          }
        }}
      />

      {/* Bulk Actions Toolbar */}
      <TaskBulkActions
        selectedIds={selectedTaskIds}
        sections={sections}
        onClearSelection={clearSelection}
        onRefresh={fetchTasks}
      />
    </div>
  );
}
