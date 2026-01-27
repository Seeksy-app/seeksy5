import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Palette, CheckCircle2, XCircle, MessageCircle, Smile,
  Plus, Trash2, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BrandVoiceItem {
  id: string;
  category: string;
  title: string;
  description: string | null;
  examples: string[];
  is_active: boolean;
}

const categories = [
  { value: "tone", label: "Tone of Voice", icon: MessageCircle, color: "bg-blue-100 text-blue-800" },
  { value: "do", label: "Do's", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  { value: "dont", label: "Don'ts", icon: XCircle, color: "bg-red-100 text-red-800" },
  { value: "vocabulary", label: "Vocabulary", icon: Palette, color: "bg-purple-100 text-purple-800" },
  { value: "emoji", label: "Emoji Policy", icon: Smile, color: "bg-yellow-100 text-yellow-800" },
  { value: "ai_prompting", label: "AI Prompting Rules", icon: Sparkles, color: "bg-amber-100 text-amber-800" }
];

export function BrandVoiceGuide() {
  const [items, setItems] = useState<BrandVoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category: "tone",
    title: "",
    description: "",
    examples: ""
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("cco_brand_voice")
      .select("*")
      .eq("is_active", true)
      .order("category");

    if (data) setItems(data as BrandVoiceItem[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newItem.title) {
      toast.error("Title is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await (supabase as any).from("cco_brand_voice").insert({
      user_id: user.id,
      category: newItem.category,
      title: newItem.title,
      description: newItem.description || null,
      examples: newItem.examples.split("\n").map((e: string) => e.trim()).filter(Boolean)
    });

    if (error) {
      toast.error("Failed to create item");
      return;
    }

    toast.success("Brand voice guideline added");
    setIsCreateOpen(false);
    setNewItem({ category: "tone", title: "", description: "", examples: "" });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from("cco_brand_voice")
      .update({ is_active: false })
      .eq("id", id);

    if (!error) {
      toast.success("Item removed");
      fetchItems();
    }
  };

  const groupedItems = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category === cat.value)
  }));

  // Demo data if empty
  const demoData: Record<string, { title: string; description: string; examples: string[] }[]> = {
    tone: [
      { title: "Warm & Confident", description: "We speak with warmth and confidence, never arrogance", examples: ["We're excited to help you grow", "Your success is our mission"] },
      { title: "Clear & Direct", description: "Avoid jargon, be straightforward", examples: ["Upload your video and we'll handle the rest", "Get paid for your content"] },
    ],
    do: [
      { title: "Use 'creators' not 'users'", description: "Our community consists of creators, not generic users", examples: [] },
      { title: "Celebrate wins", description: "Acknowledge achievements and milestones", examples: ["Congrats on hitting 1,000 plays!"] },
    ],
    dont: [
      { title: "No corporate speak", description: "Avoid buzzwords and empty phrases", examples: ["synergy", "leverage"] },
      { title: "Never blame the user", description: "Even if it's user error, be graceful", examples: [] },
    ],
    vocabulary: [
      { title: "Preferred terms", description: "Words we use to describe our platform", examples: ["creator OS", "voice certification"] },
    ],
    emoji: [
      { title: "Appropriate contexts", description: "Social media, celebrations, casual comms", examples: ["🎉 for milestones", "✨ for new features"] },
    ],
    ai_prompting: [
      { title: "Always include brand context", description: "Start AI prompts with Seeksy positioning", examples: [] },
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Voice Guardrails
          </h2>
          <p className="text-muted-foreground text-sm">
            Guidelines for consistent external messaging
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Guideline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Brand Voice Guideline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={newItem.category} 
                  onValueChange={(v) => setNewItem({ ...newItem, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input 
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Guideline title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Detailed explanation..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Examples (one per line)</Label>
                <Textarea 
                  value={newItem.examples}
                  onChange={(e) => setNewItem({ ...newItem, examples: e.target.value })}
                  placeholder="Example 1&#10;Example 2&#10;Example 3"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Add Guideline</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedItems.map(category => {
          const displayItems = category.items.length > 0 
            ? category.items 
            : (demoData[category.value] || []).map((d, i) => ({ 
                id: `demo-${i}`, 
                category: category.value,
                title: d.title,
                description: d.description,
                examples: d.examples,
                is_active: true
              }));

          return (
            <Card key={category.value}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <category.icon className="h-5 w-5" />
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayItems.map((item) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{item.title}</p>
                      {!item.id.startsWith('demo-') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                    {item.examples && item.examples.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.examples.map((ex, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
