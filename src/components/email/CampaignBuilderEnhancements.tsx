import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Code2, Save } from "lucide-react";
import { toast } from "sonner";

interface CampaignBuilderEnhancementsProps {
  subject: string;
  preheader: string;
  selectedTemplate: string;
  selectedList: string;
  selectedAccount: string;
  onAutoSave?: () => void;
}

const MERGE_TAGS = [
  { tag: "{{first_name}}", description: "Contact's first name" },
  { tag: "{{last_name}}", description: "Contact's last name" },
  { tag: "{{email}}", description: "Contact's email address" },
  { tag: "{{company}}", description: "Contact's company" },
  { tag: "{{unsubscribe_url}}", description: "Unsubscribe link" },
];

export function CampaignBuilderEnhancements({
  subject,
  preheader,
  selectedTemplate,
  selectedList,
  selectedAccount,
  onAutoSave,
}: CampaignBuilderEnhancementsProps) {
  // Autosave every 10 seconds
  useEffect(() => {
    if (!subject && !preheader && !selectedTemplate) return;

    const autoSaveInterval = setInterval(() => {
      if (onAutoSave) {
        onAutoSave();
      }
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [subject, preheader, selectedTemplate, selectedList, selectedAccount, onAutoSave]);

  const copyMergeTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Copied ${tag} to clipboard`);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Code2 className="h-4 w-4 mr-2" />
            Merge Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Available Merge Tags</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Click to copy and paste into your subject or email content
              </p>
            </div>
            <div className="space-y-2">
              {MERGE_TAGS.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => copyMergeTag(item.tag)}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="font-mono text-sm font-medium">{item.tag}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {onAutoSave && (
        <Button variant="ghost" size="sm" onClick={onAutoSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
      )}
    </div>
  );
}
