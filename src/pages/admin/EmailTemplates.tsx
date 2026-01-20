import { useState } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, Edit, History, Send, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_PERSONAS, EMAIL_CATEGORIES, MERGE_TAGS, type EmailPersona } from "@/lib/email-personas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  description: string | null;
  variables: Record<string, any> | null;
  is_active: boolean;
  version: string | null;
  category: string | null;
  persona: string | null;
  preference_channel: string | null;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [testEmail, setTestEmail] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("category", { ascending: true })
        .order("template_name");

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template status updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  const sendTestEmail = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !testEmail) {
        throw new Error("Missing template or email address");
      }

      const { data, error } = await supabase.functions.invoke("render-email-template", {
        body: {
          templateKey: selectedTemplate.template_key,
          variables: generateSampleVariables(),
          recipientEmail: testEmail,
        },
      });

      if (error) throw error;

      // Send via Resend
      const { error: sendError } = await supabase.functions.invoke("send-campaign-email", {
        body: {
          to: testEmail,
          subject: `[TEST] ${selectedTemplate.template_name}`,
          html: data.html,
        },
      });

      if (sendError) throw sendError;
    },
    onSuccess: () => {
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test email");
    },
  });

  const renderPreview = async (template: EmailTemplate) => {
    try {
      const { data, error } = await supabase.functions.invoke("render-email-template", {
        body: {
          templateKey: template.template_key,
          variables: generateSampleVariables(),
          recipientEmail: "preview@seeksy.io",
        },
      });

      if (error) throw error;

      setSelectedTemplate({ ...template, renderedHtml: data.html } as any);
    } catch (error: any) {
      toast.error(error.message || "Failed to render preview");
    }
  };

  const generateSampleVariables = (): Record<string, any> => {
    return {
      name: "John Doe",
      creator_name: "Jane Creator",
      recipient_name: "John Doe",
      code: "123456",
      resetLink: "https://seeksy.io/reset-password?token=sample",
      hostName: "Jane Smith",
      meetingTitle: "Product Demo",
      date: "December 15, 2024",
      time: "2:00 PM EST",
      meetingLink: "https://seeksy.io/meeting/sample",
      eventName: "Creator Summit 2024",
      location: "Virtual Event",
      addToCalendarLink: "https://seeksy.io/calendar/add",
      episodeTitle: "Episode 42: The Future of AI",
      showName: "Tech Talks",
      episodeLink: "https://seeksy.io/podcast/episode/42",
      sessionTitle: "Morning Podcast Recording",
      downloadLink: "https://seeksy.io/download/sample",
      clipsLink: "https://seeksy.io/clips/sample",
      subscriberEmail: "subscriber@example.com",
      preferencesLink: "https://seeksy.io/preferences",
      subject: "Welcome to Our Community",
      body: "<p>This is a sample campaign email body with <strong>rich formatting</strong>.</p>",
      ctaText: "Get Started",
      ctaLink: "https://seeksy.io/get-started",
      type: "Face",
      certificateUrl: "https://seeksy.io/certificate/sample",
    };
  };

  const filteredTemplates = templates?.filter(
    (t) => categoryFilter === "all" || t.category === categoryFilter
  );

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  const PersonaIcon = selectedTemplate?.persona && EMAIL_PERSONAS[selectedTemplate.persona as EmailPersona]
    ? EMAIL_PERSONAS[selectedTemplate.persona as EmailPersona].icon
    : null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage and preview all email templates used across the platform
          </p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EMAIL_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates?.map((template) => {
          const persona = template.persona && EMAIL_PERSONAS[template.persona as EmailPersona]
            ? EMAIL_PERSONAS[template.persona as EmailPersona]
            : null;
          const Icon = persona?.icon;

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className={`h-4 w-4 ${persona?.color}`} />}
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {template.template_key}
                    </CardDescription>
                  </div>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.category && (
                  <Badge variant="outline" className={persona?.bgColor}>
                    {template.category}
                  </Badge>
                )}

                <div className="text-sm text-muted-foreground">
                  <strong>Variables:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables &&
                      Object.keys(template.variables).map((key: string) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}
                        </Badge>
                      ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) =>
                        toggleActive.mutate({ id: template.id, isActive: checked })
                      }
                    />
                    <Label className="text-sm">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => renderPreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <History className="h-4 w-4" />
                  </Button>
                </div>

                {template.version && (
                  <div className="text-xs text-muted-foreground">
                    Version {template.version}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {PersonaIcon && <PersonaIcon className="h-5 w-5" />}
                <span>{selectedTemplate?.template_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={deviceMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeviceMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeviceMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("light")}
                >
                  Light
                </Button>
                <Button
                  variant={previewMode === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("dark")}
                >
                  Dark
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Preview of {selectedTemplate?.template_key}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="preview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="test">Send Test</TabsTrigger>
              <TabsTrigger value="tags">Merge Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div
                className={`border rounded-lg p-4 ${
                  previewMode === "dark" ? "bg-gray-900" : "bg-gray-50"
                } ${deviceMode === "mobile" ? "max-w-[375px] mx-auto" : ""}`}
              >
                {(selectedTemplate as any)?.renderedHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml((selectedTemplate as any).renderedHtml) }}
                    className="max-w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">Loading preview...</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="space-y-2">
                <Label>Test Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    onClick={() => sendTestEmail.mutate()}
                    disabled={!testEmail || sendTestEmail.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Test emails will be sent with sample data
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Available Merge Tags</h3>
                <div className="grid gap-2">
                  {MERGE_TAGS.map(({ tag, description }) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <code className="text-sm bg-muted px-2 py-1 rounded">{tag}</code>
                      <span className="text-sm text-muted-foreground">{description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
