import { Inbox, Send, Clock, FileText, Archive, AlertCircle, UserX, Edit3, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

interface EmailFolderListProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
  onCompose: () => void;
  counts: {
    inbox: number;
    sent: number;
    scheduled: number;
    drafts: number;
    archived: number;
    bounced: number;
    suppressed: number;
    trash: number;
  };
  /** When true, routes to admin-scoped paths instead of creator paths */
  isAdmin?: boolean;
}

const folders = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "bounced", label: "Bounced", icon: AlertCircle },
  { id: "suppressed", label: "Suppressed", icon: UserX },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export function EmailFolderList({ selectedFolder, onFolderSelect, onCompose, counts, isAdmin = false }: EmailFolderListProps) {
  const navigate = useNavigate();
  
  const handleSettingsClick = () => {
    navigate(isAdmin ? "/admin/email-settings" : "/email-settings");
  };

  return (
    <div className="h-full border-r bg-muted/30 p-3 flex flex-col w-[240px]">
      <Button 
        onClick={onCompose}
        className="w-full mb-4"
        size="default"
      >
        <Edit3 className="h-4 w-4 mr-2" />
        New Email
      </Button>
      
      <nav className="space-y-0.5 flex-1">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const count = counts[folder.id as keyof typeof counts] || 0;
          
          return (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                selectedFolder === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                <span>{folder.label}</span>
              </div>
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center",
                  selectedFolder === folder.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : folder.id === "inbox"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      <Separator className="my-2" />
      
      <button
        onClick={handleSettingsClick}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted text-muted-foreground"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </button>
    </div>
  );
}
