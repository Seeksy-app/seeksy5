import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

const FORM_TEMPLATES = {
  lead_form: {
    name: "Lead Form",
    description: "Capture lead information with photos and GPS",
    default_fields: ["name", "email", "phone", "company", "address", "notes", "photos", "gps"]
  },
  contact_form: {
    name: "Contact Form",
    description: "Simple contact information collection",
    default_fields: ["name", "email", "phone", "message"]
  },
  service_request: {
    name: "Service Request",
    description: "Service request with details and scheduling",
    default_fields: ["name", "email", "phone", "service_type", "preferred_date", "notes"]
  }
};

const AVAILABLE_FIELDS = [
  { id: "name", label: "Name", type: "text", required: true },
  { id: "email", label: "Email", type: "email", required: true },
  { id: "phone", label: "Phone", type: "tel", required: false },
  { id: "company", label: "Company", type: "text", required: false },
  { id: "address", label: "Address", type: "text", required: false },
  { id: "notes", label: "Notes", type: "textarea", required: false },
  { id: "photos", label: "Photo Upload", type: "file", required: false },
  { id: "gps", label: "GPS Location", type: "gps", required: false },
  { id: "message", label: "Message", type: "textarea", required: false },
  { id: "service_type", label: "Service Type", type: "select", required: false },
  { id: "preferred_date", label: "Preferred Date", type: "date", required: false },
];

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [description, setDescription] = useState("");
  const [formType, setFormType] = useState<keyof typeof FORM_TEMPLATES>("lead_form");
  const [enabledFields, setEnabledFields] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Array<{label: string; type: string; required: boolean}>>([]);
  const [isActive, setIsActive] = useState(true);
  const [createTicket, setCreateTicket] = useState(true);

  // Fetch existing form if editing
  const { data: existingForm } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingForm) {
      setFormName(existingForm.form_name);
      setFormSlug(existingForm.form_slug);
      setDescription(existingForm.description || "");
      setFormType(existingForm.form_type as keyof typeof FORM_TEMPLATES);
      setEnabledFields((existingForm.enabled_fields as string[]) || []);
      setCustomFields((existingForm.custom_fields as Array<{label: string; type: string; required: boolean}>) || []);
      setIsActive(existingForm.is_active);
      const settings = existingForm.settings as { createTicket?: boolean } | null;
      setCreateTicket(settings?.createTicket !== false);
    } else {
      // Set default fields for new form
      setEnabledFields(FORM_TEMPLATES[formType].default_fields);
    }
  }, [existingForm, formType]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setFormName(value);
    if (!isEditing) {
      setFormSlug(generateSlug(value));
    }
  };

  const toggleField = (fieldId: string) => {
    setEnabledFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { label: "", type: "text", required: false }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: Partial<typeof customFields[0]>) => {
    setCustomFields(prev => prev.map((f, i) => i === index ? { ...f, ...field } : f));
  };

  const saveForm = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const formData = {
        user_id: user.id,
        form_name: formName,
        form_slug: formSlug,
        form_type: formType,
        description,
        enabled_fields: enabledFields,
        custom_fields: customFields.filter(f => f.label),
        is_active: isActive,
        settings: {
          createTicket,
        },
      };

      if (isEditing) {
        const { error } = await supabase
          .from("forms")
          .update(formData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forms")
          .insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success(isEditing ? "Form updated successfully" : "Form created successfully");
      navigate("/forms");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save form");
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{isEditing ? "Edit Form" : "Create New Form"}</h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "Update your form configuration" : "Build a custom form with templates and fields"}
            </p>
          </div>
          <Button onClick={() => saveForm.mutate()} disabled={saveForm.isPending || !formName || !formSlug} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saveForm.isPending ? "Saving..." : "Save Form"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure your form's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formName">Form Name *</Label>
                <Input
                  id="formName"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Johnny's Lead Form"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formSlug">Form URL Slug *</Label>
                <Input
                  id="formSlug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="johnny-leads"
                />
                <p className="text-xs text-muted-foreground">
                  Form will be available at: /f/{formSlug || "your-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this form..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formType">Form Template</Label>
                <Select value={formType} onValueChange={(val) => setFormType(val as keyof typeof FORM_TEMPLATES)}>
                  <SelectTrigger id="formType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORM_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="isActive">Form Active</Label>
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="createTicket">Auto-create Ticket</Label>
                <Switch id="createTicket" checked={createTicket} onCheckedChange={setCreateTicket} />
              </div>
            </CardContent>
          </Card>

          {/* Field Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>Select which fields to include in your form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Standard Fields</Label>
                <div className="space-y-2">
                  {AVAILABLE_FIELDS.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={enabledFields.includes(field.id)}
                          onCheckedChange={() => toggleField(field.id)}
                          disabled={field.required}
                        />
                        <Label className="cursor-pointer">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                      </div>
                      <span className="text-xs text-muted-foreground">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Custom Fields</Label>
                  <Button variant="outline" size="sm" onClick={addCustomField}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Field label"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, { label: e.target.value })}
                        className="flex-1"
                      />
                      <Select value={field.type} onValueChange={(val) => updateCustomField(index, { type: val })}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="tel">Phone</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeCustomField(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
