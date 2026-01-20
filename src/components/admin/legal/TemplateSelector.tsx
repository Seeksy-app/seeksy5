import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Template {
  name: string;
  displayName: string;
}

interface TemplateSelectorProps {
  value: string;
  onChange: (templateName: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function TemplateSelector({ value, onChange, label = "Document Template", disabled = false }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("legal-templates")
          .list("investment-documents", { limit: 100 });

        if (error) {
          // Folder might not exist yet
          if (error.message.includes("not found")) {
            setTemplates([]);
            return;
          }
          throw error;
        }

        const templateList = (data || [])
          .filter(f => f.name.endsWith(".docx"))
          .map(f => ({
            name: f.name,
            displayName: f.name.replace(".docx", "").replace(/_/g, " "),
          }));

        setTemplates(templateList);
        
        // Auto-select first template if none selected
        if (!value && templateList.length > 0) {
          onChange(templateList[0].name);
        }
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 px-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading templates...
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 text-sm text-destructive h-10 px-3 border border-destructive/50 rounded-md bg-destructive/5">
          <FileText className="h-4 w-4" />
          No templates found. Please upload a template first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a template">
            {value && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>{value.replace(".docx", "").replace(/_/g, " ")}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-lg z-50">
          {templates.map((template) => (
            <SelectItem key={template.name} value={template.name}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{template.displayName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
