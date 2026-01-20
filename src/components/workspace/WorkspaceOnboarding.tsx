import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Mic, 
  Palette, 
  Briefcase, 
  Layers,
  ArrowRight,
  Check
} from "lucide-react";
import { toast } from "sonner";

const WORKSPACE_TEMPLATES = [
  {
    id: "podcast",
    name: "Podcast Workspace",
    description: "Perfect for podcasters and audio creators",
    icon: Mic,
    color: "#8B5CF6",
    modules: ["studio", "podcasts", "clips", "ai-post-production", "media-library", "blog", "contacts"],
  },
  {
    id: "creator",
    name: "Creator Workspace", 
    description: "For content creators and influencers",
    icon: Palette,
    color: "#F59E0B",
    modules: ["studio", "clips", "media-library", "my-page", "campaigns", "contacts", "identity"],
  },
  {
    id: "business",
    name: "Client Services",
    description: "For agencies and service businesses",
    icon: Briefcase,
    color: "#10B981",
    modules: ["crm", "projects", "tasks", "meetings", "proposals", "email", "forms"],
  },
  {
    id: "blank",
    name: "Blank Workspace",
    description: "Start fresh and add modules as you go",
    icon: Layers,
    color: "#6B7280",
    modules: [],
  },
];

interface WorkspaceOnboardingProps {
  onComplete?: () => void;
}

export function WorkspaceOnboarding({ onComplete }: WorkspaceOnboardingProps) {
  const navigate = useNavigate();
  const { createWorkspace, setCurrentWorkspace } = useWorkspace();
  const [step, setStep] = useState<'template' | 'name'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = WORKSPACE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setWorkspaceName(template.id === 'blank' ? '' : template.name);
    }
    setStep('name');
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    setIsCreating(true);
    
    const template = WORKSPACE_TEMPLATES.find(t => t.id === selectedTemplate);
    const workspace = await createWorkspace(
      workspaceName,
      template?.modules || []
    );

    if (workspace) {
      setCurrentWorkspace(workspace);
      toast.success(`Welcome to ${workspaceName}!`);
      onComplete?.();
      navigate('/dashboard');
    } else {
      toast.error("Failed to create workspace");
    }

    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {step === 'template' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Create your first workspace</h1>
              <p className="text-muted-foreground">
                Choose a template to get started quickly, or create a blank workspace
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WORKSPACE_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTemplate === template.id && "ring-2 ring-primary"
                    )}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${template.color}20` }}
                        >
                          <Icon 
                            className="h-6 w-6" 
                            style={{ color: template.color }}
                          />
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    {template.modules.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {template.modules.slice(0, 4).map((mod) => (
                            <span
                              key={mod}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {mod.replace('-', ' ')}
                            </span>
                          ))}
                          {template.modules.length > 4 && (
                            <span className="text-xs text-muted-foreground">
                              +{template.modules.length - 4} more
                            </span>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-6">
            <button 
              onClick={() => setStep('template')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to templates
            </button>
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Name your workspace</h1>
              <p className="text-muted-foreground">
                Give your workspace a memorable name
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Awesome Workspace"
                className="text-center text-lg h-12"
                autoFocus
              />
              
              <Button
                onClick={handleCreateWorkspace}
                disabled={!workspaceName.trim() || isCreating}
                className="w-full h-12"
                size="lg"
              >
                {isCreating ? (
                  "Creating..."
                ) : (
                  <>
                    Create workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
