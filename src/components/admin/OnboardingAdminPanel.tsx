// Admin Panel for Onboarding Configuration
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, BarChart3, FileText, Users, RefreshCw, 
  ChevronDown, ChevronUp, GripVertical, Plus, Trash2,
  Eye, Download, Upload
} from "lucide-react";
import { motion } from "framer-motion";
import { ONBOARDING_QUESTIONS, RECOMMENDATION_RULES } from "@/config/onboardingQuestions";

// Mock analytics data
const mockAnalytics = {
  totalCompletions: 1247,
  completionRate: 78,
  avgTimeMinutes: 3.2,
  dropOffSteps: [
    { step: 1, users: 1600 },
    { step: 2, users: 1520 },
    { step: 3, users: 1420 },
    { step: 4, users: 1350 },
    { step: 5, users: 1300 },
    { step: 6, users: 1260 },
    { step: 7, users: 1247 },
  ],
  topCreatorTypes: [
    { type: "Podcaster", count: 412, percent: 33 },
    { type: "Influencer", count: 324, percent: 26 },
    { type: "Entrepreneur", count: 211, percent: 17 },
    { type: "Speaker", count: 156, percent: 13 },
    { type: "Other", count: 144, percent: 11 },
  ],
  topGoals: [
    { goal: "Host Podcast", count: 389 },
    { goal: "Connect Social", count: 356 },
    { goal: "Monetize", count: 298 },
    { goal: "Build Page", count: 204 },
  ],
};

export function OnboardingAdminPanel() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [questions, setQuestions] = useState(ONBOARDING_QUESTIONS);
  const [rules, setRules] = useState(JSON.stringify(RECOMMENDATION_RULES, null, 2));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Configuration</h2>
          <p className="text-muted-foreground">Manage questions, rules, and view analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview Flow
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <FileText className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Users className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{mockAnalytics.totalCompletions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Completions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{mockAnalytics.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{mockAnalytics.avgTimeMinutes} min</div>
                <p className="text-xs text-muted-foreground">Avg. Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">Step 3</div>
                <p className="text-xs text-muted-foreground">Highest Drop-off</p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel & Distribution */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Step Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockAnalytics.dropOffSteps.map((s, i) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">Step {s.step}</span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-primary/70 transition-all"
                          style={{ width: `${(s.users / mockAnalytics.dropOffSteps[0].users) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-16 text-right">{s.users.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Creator Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnalytics.topCreatorTypes.map((t) => (
                    <div key={t.type} className="flex items-center justify-between">
                      <span className="text-sm">{t.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${t.percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{t.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Drag to reorder questions. Changes are saved automatically.</p>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={q.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="cursor-grab text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {q.step}</Badge>
                          <Badge variant="secondary">{q.type === "multi" ? "Multi-select" : "Single"}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Question</Label>
                        <Input defaultValue={q.question} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Options ({q.options.length})</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {q.options.map((opt) => (
                            <Badge key={opt.id} variant="outline" className="text-xs">
                              {opt.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommendation Rules JSON</CardTitle>
              <CardDescription>Edit the mapping rules that determine which modules are recommended based on user selections.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="font-mono text-xs min-h-[400px]"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Reset to Default
                </Button>
                <Button size="sm">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Onboarding Sessions</CardTitle>
              <CardDescription>View what users selected during onboarding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 1, email: "alex@example.com", type: "Podcaster", goal: "Host Podcast", time: "2 min ago", completed: true },
                  { id: 2, email: "sarah@brand.co", type: "Brand", goal: "Find Creators", time: "5 min ago", completed: true },
                  { id: 3, email: "mike@agency.io", type: "Agency", goal: "Manage Clients", time: "12 min ago", completed: false },
                  { id: 4, email: "jen@creator.me", type: "Influencer", goal: "Connect Social", time: "18 min ago", completed: true },
                  { id: 5, email: "tom@events.com", type: "Event Host", goal: "Create Event", time: "25 min ago", completed: true },
                ].map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{log.email}</p>
                        <p className="text-xs text-muted-foreground">{log.type} • {log.goal}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                      <Badge variant={log.completed ? "default" : "secondary"}>
                        {log.completed ? "Completed" : "Dropped"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
