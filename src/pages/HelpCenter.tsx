import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Video,
  Search,
  Film,
  Camera,
  Scissors,
  Type,
  ImageIcon,
  Play,
  Download,
  Sparkles,
} from "lucide-react";
import timelineOverview from "@/assets/tutorial-seeksy-timeline.jpg";
import aiTools from "@/assets/tutorial-seeksy-ai-tools.jpg";
import manualTools from "@/assets/tutorial-seeksy-manual-tools.jpg";
import exportSave from "@/assets/tutorial-seeksy-export-save.jpg";

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const guides = [
    {
      id: "post-production",
      title: "Post Production Studio Guide",
      category: "Video Editing",
      icon: Film,
      description: "Complete guide to video editing with AI-powered tools",
    },
    {
      id: "ai-camera",
      title: "AI Camera Focus",
      category: "AI Tools",
      icon: Camera,
      description: "Create multicam-style edits from single-camera footage",
    },
    {
      id: "smart-trim",
      title: "Smart Trim",
      category: "AI Tools",
      icon: Scissors,
      description: "Remove filler words and awkward pauses automatically",
    },
  ];

  const filteredGuides = guides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BookOpen className="h-8 w-8" />
                Help Center
              </h1>
              <p className="text-muted-foreground mt-1">
                Guides, tutorials, and documentation for Seeksy
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guides and documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-8">
          <TabsList>
            <TabsTrigger value="all">All Guides</TabsTrigger>
            <TabsTrigger value="video-editing">Video Editing</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4">
              {filteredGuides.map((guide) => (
                <Card
                  key={guide.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/help-center/${guide.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <guide.icon className="h-6 w-6 text-primary" />
                      <Badge variant="secondary">{guide.category}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Featured Guide: Post Production Studio */}
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Film className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Post Production Studio - Complete Guide</CardTitle>
                    <CardDescription>Everything you need to know about video editing in Seeksy</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Overview */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Overview</h3>
                  <p className="text-muted-foreground mb-4">
                    The Post Production Studio is your complete video editing workspace that transforms single-camera videos into polished, professional content. Whether you're using AI-powered tools or manual controls, this guide will walk you through everything you need to know.
                  </p>
                  <img
                    src={timelineOverview}
                    alt="Timeline Overview"
                    className="w-full rounded-lg border"
                  />
                </section>

                <Separator />

                {/* Getting Started */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Accessing the Studio</h4>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Navigate to Media Library</li>
                        <li>Find your video file</li>
                        <li>Click the Edit button or select Post Production from the actions menu</li>
                        <li>The Post Production Studio will open with your video loaded</li>
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Interface Overview</h4>
                      <p className="text-muted-foreground mb-2">The studio interface consists of four main areas:</p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li><strong>Header Bar</strong> - File name, undo/redo, save, and export controls</li>
                        <li><strong>Video Preview</strong> - Watch your video and see edits in real-time</li>
                        <li><strong>Timeline Controls</strong> - Playback controls and draggable timeline scrubber</li>
                        <li><strong>Tools Sidebar</strong> - AI and manual editing tools</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* AI Tools */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Tools
                  </h3>
                  <img
                    src={aiTools}
                    alt="AI Tools"
                    className="w-full rounded-lg border mb-6"
                  />
                  
                  <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Full AI Enhancement
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        The fastest way to edit your video - AI automatically applies camera focus, smart trim, and ad placement in one click.
                      </p>
                      <Badge>Recommended for beginners</Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        AI Camera Focus
                      </h4>
                      <p className="text-muted-foreground mb-2">
                        Creates a polished multicam-style edit from your single-camera footage using intelligent punch-ins, digital zooms, and reframing.
                      </p>
                      <div className="bg-muted/50 rounded p-3 text-sm space-y-1">
                        <p><strong>Best for:</strong> Interview content, talking-head videos, podcast recordings, presentations</p>
                        <p><strong>Pro Tip:</strong> Works best with videos featuring clear speakers. AI alternates between wide, medium, and close-up shots.</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Scissors className="h-4 w-4" />
                        Smart Trim
                      </h4>
                      <p className="text-muted-foreground mb-2">
                        Removes filler words ("um," "uh," "like"), dead air, and awkward pauses to create a tighter, more professional edit.
                      </p>
                      <div className="bg-muted/50 rounded p-3 text-sm space-y-1">
                        <p><strong>Best for:</strong> Interview cleanup, presentation polishing, podcast tightening</p>
                        <p><strong>Pro Tip:</strong> Can reduce video length by 10-20% on average while maintaining natural speech flow.</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        Insert AI Ad
                      </h4>
                      <p className="text-muted-foreground">
                        Automatically finds the best natural breaks in your content to insert advertisements based on content analysis and engagement patterns.
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Manual Tools */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Manual Editing Tools</h3>
                  <img
                    src={manualTools}
                    alt="Manual Tools"
                    className="w-full rounded-lg border mb-6"
                  />
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Lower Third / Name Tag
                      </h4>
                      <p className="text-muted-foreground mb-2">
                        Adds professional text overlays for names, titles, or other information at any timestamp.
                      </p>
                      <div className="bg-muted/50 rounded p-3 text-sm">
                        <p><strong>Pro Tip:</strong> Place at the beginning when speakers are introduced. Keep text concise and readable.</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Insert B-Roll
                      </h4>
                      <p className="text-muted-foreground mb-2">
                        Places supplemental footage or images at specific timestamps to add visual interest and maintain viewer engagement.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Scissors className="h-4 w-4" />
                        Manual Cut
                      </h4>
                      <p className="text-muted-foreground mb-2">
                        Mark precise cut points to remove unwanted sections from your video with frame-accurate control.
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Timeline and Playback */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Timeline and Playback
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Timeline Navigation</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li><strong>Click timeline</strong> - Jump to any point in your video</li>
                        <li><strong>Drag scrubber</strong> - Smoothly scrub through video frame-by-frame</li>
                        <li><strong>Timeline markers</strong> - Color-coded by type:
                          <ul className="ml-6 mt-2 space-y-1">
                            <li>🟡 Yellow - Ad insertion points</li>
                            <li>🔵 Blue - Camera focus/angles</li>
                            <li>🟢 Green - Lower thirds</li>
                            <li>🟣 Purple - B-roll</li>
                            <li>🔴 Red - Cut points</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Playback Controls</h4>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li><strong>Play/Pause</strong> - Space bar or play button</li>
                        <li><strong>Skip Back</strong> - Jump 5 seconds backward</li>
                        <li><strong>Skip Forward</strong> - Jump 5 seconds forward</li>
                        <li><strong>Time Display</strong> - Shows current time and total duration</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Saving and Exporting */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Saving and Exporting
                  </h3>
                  <img
                    src={exportSave}
                    alt="Export and Save"
                    className="w-full rounded-lg border mb-6"
                  />
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Saving Your Work</h4>
                      <p className="text-muted-foreground mb-2">Click Save in the header to preserve all markers and edits. You can return to editing anytime.</p>
                      <div className="bg-muted/50 rounded p-3 text-sm">
                        <p><strong>What gets saved:</strong></p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All marker positions and types</li>
                          <li>Marker metadata (text, durations, etc.)</li>
                          <li>Current edit state</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Exporting Final Video</h4>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Review all your edits</li>
                        <li>Click Export in the header</li>
                        <li>Choose export settings (resolution, format, quality)</li>
                        <li>Processing begins</li>
                        <li>Download your finished video</li>
                      </ol>
                      <div className="bg-primary/5 border border-primary/10 rounded p-3 text-sm mt-3">
                        <p><strong>Export includes:</strong> All AI camera angles, ad slots, lower thirds, B-roll, smart trims, and manual cuts applied.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Best Practices */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Workflow Best Practices</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Editing Order</h4>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Watch through once - Get familiar with content</li>
                        <li>Use Full AI Enhancement OR individual AI tools first</li>
                        <li>Add manual tools (lower thirds, B-roll, manual cuts)</li>
                        <li>Review - Watch through completed edit</li>
                        <li>Save frequently during long editing sessions</li>
                        <li>Export - Render final video</li>
                      </ol>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded p-4">
                      <h4 className="font-semibold mb-2 text-amber-600 dark:text-amber-400">Common Mistakes to Avoid</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Over-zooming with too many camera angles</li>
                        <li>Placing too many ad breaks too close together</li>
                        <li>Lower thirds that stay on screen too long</li>
                        <li>Not previewing edits before export</li>
                        <li>Forgetting to save work in progress</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Support */}
                <section>
                  <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
                  <div className="bg-card border rounded-lg p-6">
                    <p className="text-muted-foreground mb-4">
                      If you need additional assistance with the Post Production Studio:
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="mailto:hello@seeksy.io">
                          📧 Email: hello@seeksy.io
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => navigate("/post-production-studio?id=" + new URLSearchParams(window.location.search).get("id"))}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Open Interactive Tutorial
                      </Button>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video-editing">
            <p className="text-muted-foreground">Video editing guides coming soon...</p>
          </TabsContent>

          <TabsContent value="ai-tools">
            <p className="text-muted-foreground">AI tools guides coming soon...</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
