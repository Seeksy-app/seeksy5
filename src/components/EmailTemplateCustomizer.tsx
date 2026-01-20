import { useState } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Save, Eye, Code } from "lucide-react";

interface EmailTemplateCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    name: string;
    previewHtml: string;
  } | null;
}

export const EmailTemplateCustomizer = ({ open, onOpenChange, template }: EmailTemplateCustomizerProps) => {
  const [customizedHtml, setCustomizedHtml] = useState(template?.previewHtml || "");
  const [templateName, setTemplateName] = useState(template?.name || "");
  const [previewMode, setPreviewMode] = useState(true);
  
  // Default values for merge tags
  const [mergeFields, setMergeFields] = useState({
    companyLogo: "SEEKSY",
    companyName: "Your Company",
    companyWebsite: "www.yourcompany.com",
    senderName: "John Doe",
    senderTitle: "Account Manager",
    senderPhone: "(555) 123-4567",
    senderEmail: "john@yourcompany.com",
  });

  const handleSaveTemplate = () => {
    // Here you would save the template to the database
    toast.success("Template saved successfully!");
    onOpenChange(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    setMergeFields(prev => ({ ...prev, [field]: value }));
  };

  // Replace merge tags with actual values for preview
  const getPreviewHtml = () => {
    let html = customizedHtml;
    html = html.replace(/\{\{company\.LOGO\}\}/g, mergeFields.companyLogo);
    html = html.replace(/\{\{company\.NAME\}\}/g, mergeFields.companyName);
    html = html.replace(/\{\{company\.WEBSITE\}\}/g, mergeFields.companyWebsite);
    html = html.replace(/\{\{sender\.NAME\}\}/g, mergeFields.senderName);
    html = html.replace(/\{\{sender\.TITLE\}\}/g, mergeFields.senderTitle);
    html = html.replace(/\{\{sender\.PHONE\}\}/g, mergeFields.senderPhone);
    html = html.replace(/\{\{sender\.EMAIL\}\}/g, mergeFields.senderEmail);
    html = html.replace(/\{\{contact\.FIRSTNAME\}\}/g, "Sarah");
    html = html.replace(/\{\{project\.NAME\}\}/g, "Your Project");
    html = html.replace(/\{\{dashboard_url\}\}/g, "#");
    html = html.replace(/\{\{support_url\}\}/g, "#");
    return html;
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Customize Email Template</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {previewMode ? "Edit HTML" : "Preview"}
              </Button>
              <Button size="sm" onClick={handleSaveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Customization Options */}
          <div className="w-80 border-r bg-muted/30">
            <Tabs defaultValue="branding" className="h-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="branding" className="rounded-none">Branding</TabsTrigger>
                <TabsTrigger value="content" className="rounded-none">Content</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[calc(85vh-140px)]">
                <TabsContent value="branding" className="p-4 space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="My Custom Template"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-logo">Company Logo Text</Label>
                    <Input
                      id="company-logo"
                      value={mergeFields.companyLogo}
                      onChange={(e) => handleFieldChange("companyLogo", e.target.value)}
                      placeholder="SEEKSY"
                    />
                    <p className="text-xs text-muted-foreground">
                      Later you can upload an image logo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={mergeFields.companyName}
                      onChange={(e) => handleFieldChange("companyName", e.target.value)}
                      placeholder="Your Company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      value={mergeFields.companyWebsite}
                      onChange={(e) => handleFieldChange("companyWebsite", e.target.value)}
                      placeholder="www.yourcompany.com"
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Signature</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sender-name">Your Name</Label>
                      <Input
                        id="sender-name"
                        value={mergeFields.senderName}
                        onChange={(e) => handleFieldChange("senderName", e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sender-title">Your Title</Label>
                      <Input
                        id="sender-title"
                        value={mergeFields.senderTitle}
                        onChange={(e) => handleFieldChange("senderTitle", e.target.value)}
                        placeholder="Account Manager"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sender-phone">Phone</Label>
                      <Input
                        id="sender-phone"
                        value={mergeFields.senderPhone}
                        onChange={(e) => handleFieldChange("senderPhone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sender-email">Email</Label>
                      <Input
                        id="sender-email"
                        value={mergeFields.senderEmail}
                        onChange={(e) => handleFieldChange("senderEmail", e.target.value)}
                        placeholder="john@yourcompany.com"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="p-4 space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Available Merge Tags</Label>
                    <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                      <code className="block">{'{{contact.FIRSTNAME}}'}</code>
                      <code className="block">{'{{company.NAME}}'}</code>
                      <code className="block">{'{{sender.NAME}}'}</code>
                      <code className="block">{'{{project.NAME}}'}</code>
                      <p className="text-xs text-muted-foreground mt-2">
                        These will be replaced with actual values when sending
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {previewMode ? (
              <ScrollArea className="h-full">
                <div className="p-8 bg-gradient-to-br from-muted/30 to-background">
                  <div 
                    className="mx-auto bg-white rounded-lg shadow-xl"
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(getPreviewHtml()) }}
                  />
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full p-4">
                <Textarea
                  value={customizedHtml}
                  onChange={(e) => setCustomizedHtml(e.target.value)}
                  className="h-full font-mono text-sm"
                  placeholder="Edit HTML here..."
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
