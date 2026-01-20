import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";

interface Step {
  id?: string;
  title: string;
  description: string;
  link: string;
  expected_result: string;
  step_order: number;
}

const ChecklistTemplate = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = templateId === "new";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "QA",
  });

  const [steps, setSteps] = useState<Step[]>([
    { title: "", description: "", link: "", expected_result: "", step_order: 0 },
  ]);

  const { isLoading } = useQuery({
    queryKey: ["checklist-template", templateId],
    queryFn: async () => {
      if (isNew) return null;

      const { data: template, error: templateError } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      const { data: templateSteps, error: stepsError } = await supabase
        .from("checklist_steps")
        .select("*")
        .eq("template_id", templateId)
        .order("step_order");

      if (stepsError) throw stepsError;

      setFormData({
        name: template.name,
        description: template.description || "",
        category: template.category,
      });

      if (templateSteps && templateSteps.length > 0) {
        setSteps(templateSteps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          link: s.link || "",
          expected_result: s.expected_result || "",
          step_order: s.step_order,
        })));
      }

      return template;
    },
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!formData.name) throw new Error("Template name is required");
      if (steps.filter(s => s.title).length === 0) throw new Error("At least one step is required");

      let templateIdToUse = templateId;

      if (isNew) {
        const { data: newTemplate, error: templateError } = await supabase
          .from("checklist_templates")
          .insert({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            created_by: user.id,
          })
          .select()
          .single();

        if (templateError) throw templateError;
        templateIdToUse = newTemplate.id;
      } else {
        const { error: updateError } = await supabase
          .from("checklist_templates")
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
          })
          .eq("id", templateId);

        if (updateError) throw updateError;

        // Delete existing steps
        const { error: deleteError } = await supabase
          .from("checklist_steps")
          .delete()
          .eq("template_id", templateId);

        if (deleteError) throw deleteError;
      }

      // Insert steps
      const validSteps = steps.filter(s => s.title).map((s, idx) => ({
        template_id: templateIdToUse,
        title: s.title,
        description: s.description,
        link: s.link,
        expected_result: s.expected_result,
        step_order: idx,
      }));

      if (validSteps.length > 0) {
        const { error: stepsError } = await supabase
          .from("checklist_steps")
          .insert(validSteps);

        if (stepsError) throw stepsError;
      }

      return templateIdToUse;
    },
    onSuccess: (newId) => {
      toast.success("Template saved successfully");
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      if (isNew) {
        navigate(`/admin/checklists/template/${newId}`);
      }
    },
    onError: (error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });

  const addStep = () => {
    setSteps([...steps, { title: "", description: "", link: "", expected_result: "", step_order: steps.length }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof Step, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/checklists")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Checklists
        </Button>
        <h1 className="text-3xl font-bold">{isNew ? "New Checklist Template" : "Edit Template"}</h1>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Face Identity Verification – QA Run"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="End-to-end testing of face identity verification flow..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Internal Testing">Internal Testing</SelectItem>
                <SelectItem value="Creator Verification">Creator Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checklist Steps</CardTitle>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
                  </div>
                  {steps.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Step Title *</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(index, "title", e.target.value)}
                    placeholder="Upload face photos"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, "description", e.target.value)}
                    placeholder="Navigate to /identity and click 'Verify Face Identity'..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Link (optional)</Label>
                    <Input
                      value={step.link}
                      onChange={(e) => updateStep(index, "link", e.target.value)}
                      placeholder="/identity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Result</Label>
                    <Input
                      value={step.expected_result}
                      onChange={(e) => updateStep(index, "expected_result", e.target.value)}
                      placeholder="Face verified badge appears"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/admin/checklists")}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </div>
  );
};

export default ChecklistTemplate;
