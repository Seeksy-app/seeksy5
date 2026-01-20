import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ClipboardList, PlayCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminChecklists = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("templates");

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["checklist-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_instances")
        .select(`
          *,
          template:checklist_templates(name, category)
        `)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "not_started":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Checklists & QA</h1>
          <p className="text-muted-foreground mt-1">
            Manage testing workflows, onboarding, and quality assurance checklists
          </p>
        </div>
        <Button onClick={() => navigate("/admin/checklists/new-template")}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Runs</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="instances">Checklist Runs</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {loadingTemplates ? (
            <Card>
              <CardContent className="pt-6 text-center">Loading templates...</CardContent>
            </Card>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No checklist templates yet</p>
                <Button onClick={() => navigate("/admin/checklists/new-template")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/checklists/template/${template.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/checklists/run/${template.id}`)}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Run
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                        {template.category}
                      </span>
                      <span>
                        {instances.filter((i) => i.template_id === template.id).length} runs
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-4">
          {loadingInstances ? (
            <Card>
              <CardContent className="pt-6 text-center">Loading checklist runs...</CardContent>
            </Card>
          ) : instances.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <PlayCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No checklist runs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {instances.map((instance) => {
                const template = instance.template as any;
                return (
                  <Card key={instance.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader onClick={() => navigate(`/admin/checklists/instance/${instance.id}`)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{template?.name || "Unknown Template"}</CardTitle>
                          <CardDescription className="mt-1">
                            Assigned to: {instance.assigned_to || "Unassigned"}
                          </CardDescription>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(instance.status)}`}>
                          {instance.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                          {template?.category || "N/A"}
                        </span>
                        <span>
                          Started: {new Date(instance.started_at).toLocaleDateString()}
                        </span>
                        {instance.completed_at && (
                          <span>
                            Completed: {new Date(instance.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminChecklists;
