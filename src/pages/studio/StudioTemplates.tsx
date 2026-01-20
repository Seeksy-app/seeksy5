import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, FileText, Mic, DollarSign, 
  Clock, Star, ChevronLeft, MoreHorizontal,
  Copy, Pencil, Trash2
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  type: "script" | "ad-read" | "intro" | "outro";
  content: string;
  duration?: string;
  favorite: boolean;
  lastUsed: string;
}

export default function StudioTemplates() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [templates] = useState<Template[]>([
    {
      id: "1",
      title: "Standard Podcast Intro",
      type: "intro",
      content: "Welcome back to [Podcast Name]! I'm your host [Name], and today we're diving into...",
      duration: "30s",
      favorite: true,
      lastUsed: "2 days ago"
    },
    {
      id: "2",
      title: "Sponsor Read - Athletic Greens",
      type: "ad-read",
      content: "This episode is brought to you by Athletic Greens. AG1 is the daily foundational nutrition supplement...",
      duration: "60s",
      favorite: true,
      lastUsed: "1 week ago"
    },
    {
      id: "3",
      title: "Episode Outro Template",
      type: "outro",
      content: "Thank you for listening to this episode! Don't forget to subscribe, leave a review...",
      duration: "20s",
      favorite: false,
      lastUsed: "3 days ago"
    },
    {
      id: "4",
      title: "Interview Questions Script",
      type: "script",
      content: "1. Tell us about your background and how you got started...\n2. What's the biggest challenge you've faced...",
      favorite: false,
      lastUsed: "5 days ago"
    },
  ]);

  const getTypeIcon = (type: Template["type"]) => {
    switch (type) {
      case "ad-read": return DollarSign;
      case "intro": return Mic;
      case "outro": return Mic;
      default: return FileText;
    }
  };

  const getTypeColor = (type: Template["type"]) => {
    switch (type) {
      case "ad-read": return "bg-green-500";
      case "intro": return "bg-blue-500";
      case "outro": return "bg-purple-500";
      default: return "bg-muted";
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || t.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Templates</h1>
              <p className="text-sm text-muted-foreground">Scripts, ad reads, and recording templates</p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        {/* Tabs & Search */}
        <div className="flex items-center gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="script">Scripts</TabsTrigger>
              <TabsTrigger value="ad-read">Ad Reads</TabsTrigger>
              <TabsTrigger value="intro">Intros</TabsTrigger>
              <TabsTrigger value="outro">Outros</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No templates found</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first template to get started</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => {
              const TypeIcon = getTypeIcon(template.type);
              return (
                <div
                  key={template.id}
                  className="group p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(template.type)} flex items-center justify-center`}>
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.title}</h3>
                          {template.favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs capitalize">{template.type}</Badge>
                          {template.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {template.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {template.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Used {template.lastUsed}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Add Section */}
        <div className="mt-10 p-6 rounded-xl bg-muted/30 border border-dashed border-border">
          <h3 className="font-medium mb-4">Quick Add Templates</h3>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Blank Script
            </Button>
            <Button variant="outline" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Ad Read Template
            </Button>
            <Button variant="outline" className="gap-2">
              <Mic className="w-4 h-4" />
              Podcast Intro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
