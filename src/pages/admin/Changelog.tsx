import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone, Star, Zap, Bug, Sparkles, Plus, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnreadUpdates } from "@/hooks/useUnreadUpdates";

interface PlatformUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'update';
  items: string[];
  visibility: string[];
  published_at: string;
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case "feature":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Sparkles className="h-3 w-3 mr-1" />New Feature</Badge>;
    case "improvement":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Zap className="h-3 w-3 mr-1" />Improvement</Badge>;
    case "bugfix":
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20"><Bug className="h-3 w-3 mr-1" />Bug Fix</Badge>;
    default:
      return <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Update</Badge>;
  }
};

const getVisibilityBadges = (visibility: string[]) => {
  return visibility.map(v => (
    <Badge key={v} variant="outline" className="text-xs capitalize">
      {v}
    </Badge>
  ));
};

export default function AdminChangelog() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { unreadCount, markAllAsRead } = useUnreadUpdates();
  
  const [form, setForm] = useState({
    version: "",
    title: "",
    description: "",
    type: "feature" as const,
    items: [] as string[],
    visibility: ["admin"] as string[],
  });

  const { data: updates, isLoading } = useQuery({
    queryKey: ['platform-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_updates')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as PlatformUpdate[];
    }
  });

  // Fetch read status
  useQuery({
    queryKey: ['user-update-reads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from('user_update_reads')
        .select('update_id')
        .eq('user_id', user.id);
      
      setReadIds(new Set(data?.map(r => r.update_id) || []));
      return data;
    }
  });

  // Mark all as read when visiting the page
  useEffect(() => {
    if (updates?.length) {
      markAllAsRead.mutate(updates.map(u => u.id));
    }
  }, [updates]);

  const createMutation = useMutation({
    mutationFn: async (update: typeof form) => {
      const { error } = await supabase
        .from('platform_updates')
        .insert({
          ...update,
          published_at: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-updates'] });
      toast.success("Update added successfully");
      setShowForm(false);
      setForm({ version: "", title: "", description: "", type: "feature", items: [], visibility: ["admin"] });
    },
    onError: (err) => toast.error("Failed to add update: " + (err as Error).message)
  });

  const addItem = () => {
    if (newItem.trim()) {
      setForm(f => ({ ...f, items: [...f.items, newItem.trim()] }));
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const toggleVisibility = (role: string) => {
    setForm(f => ({
      ...f,
      visibility: f.visibility.includes(role)
        ? f.visibility.filter(v => v !== role)
        : [...f.visibility, role]
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              What's New
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Latest updates and improvements to Seeksy</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Update
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input 
                  placeholder="e.g., 2.5.0" 
                  value={form.version}
                  onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">New Feature</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="bugfix">Bug Fix</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                placeholder="Update title" 
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Brief description of the update" 
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Bullet Points</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a bullet point" 
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                />
                <Button type="button" variant="outline" onClick={addItem}>Add</Button>
              </div>
              {form.items.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded">
                      <span className="flex-1">{item}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label>Visibility (who can see this update)</Label>
              <div className="flex gap-4">
                {['admin', 'creator', 'board'].map(role => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox 
                      checked={form.visibility.includes(role)}
                      onCheckedChange={() => toggleVisibility(role)}
                    />
                    <span className="text-sm capitalize">{role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.version || !form.title}>
                Save Update
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading updates...</div>
      ) : (
        <div className="space-y-6">
          {updates?.map((entry) => (
            <Card key={entry.id} className={!readIds.has(entry.id) ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    {getTypeBadge(entry.type)}
                    {!readIds.has(entry.id) && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getVisibilityBadges(entry.visibility)}
                    <span className="text-sm text-muted-foreground">
                      <span className="font-medium">v{entry.version}</span>
                      <span className="mx-2">•</span>
                      {new Date(entry.published_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{entry.description}</p>
                {entry.items && entry.items.length > 0 && (
                  <ul className="space-y-2">
                    {entry.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
