import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  MessageSquare, 
  Clock, 
  FileText, 
  Flag,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Coins
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { GrowthAction } from "@/types/local-visibility";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ActionTypeIcon = ({ type }: { type: GrowthAction['type'] }) => {
  const icons = {
    review_reply: <MessageSquare className="h-4 w-4" />,
    add_hours: <Clock className="h-4 w-4" />,
    generate_post: <Sparkles className="h-4 w-4" />,
    create_content: <FileText className="h-4 w-4" />,
    flag_issue: <Flag className="h-4 w-4" />,
  };
  return icons[type];
};

const ImpactBadge = ({ impact }: { impact: GrowthAction['estimatedImpact'] }) => {
  const config = {
    low: { label: 'Low Impact', className: 'bg-muted text-muted-foreground' },
    medium: { label: 'Medium Impact', className: 'bg-yellow-500/10 text-yellow-600' },
    high: { label: 'High Impact', className: 'bg-green-500/10 text-green-600' },
  };
  return <Badge variant="outline" className={config[impact].className}>{config[impact].label}</Badge>;
};

const RiskBadge = ({ risk }: { risk: GrowthAction['riskLevel'] }) => {
  const config = {
    low: { label: 'Safe', icon: CheckCircle2, className: 'text-green-600' },
    medium: { label: 'Review First', icon: AlertTriangle, className: 'text-yellow-600' },
    high: { label: 'Admin Required', icon: AlertTriangle, className: 'text-red-600' },
  };
  const { label, icon: Icon, className } = config[risk];
  return (
    <span className={`flex items-center gap-1 text-xs ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const ActionCard = ({ 
  action, 
  onPreview, 
  onExecute 
}: { 
  action: GrowthAction; 
  onPreview: (action: GrowthAction) => void;
  onExecute: (action: GrowthAction) => void;
}) => {
  const isCompleted = action.status === 'completed';
  const isPending = action.status === 'in_progress';

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ActionTypeIcon type={action.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm">{action.title}</h4>
              {isCompleted && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
            
            <div className="flex items-center gap-3 mt-3">
              <ImpactBadge impact={action.estimatedImpact} />
              <RiskBadge risk={action.riskLevel} />
              {action.creditCost > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  {action.creditCost} credit{action.creditCost > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {!isCompleted && !isPending && (
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onPreview(action)}
                >
                  Preview
                </Button>
                {action.riskLevel === 'low' && (
                  <Button 
                    size="sm"
                    onClick={() => onExecute(action)}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Execute
                  </Button>
                )}
              </div>
            )}

            {isPending && (
              <div className="mt-3">
                <Badge variant="secondary">
                  <div className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-primary" />
                  Processing...
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function GrowthActionsSection() {
  const { growthActions, updateGrowthAction, addActivityLog } = useLocalVisibilityStore();
  const [previewAction, setPreviewAction] = useState<GrowthAction | null>(null);

  // Mock actions
  const mockActions: GrowthAction[] = growthActions.length ? growthActions : [
    {
      id: '1',
      type: 'review_reply',
      title: 'Reply to 3 pending reviews',
      description: 'Use AI to generate personalized responses to recent customer reviews.',
      estimatedImpact: 'high',
      creditCost: 1,
      riskLevel: 'low',
      status: 'available',
      preview: 'AI will analyze each review and generate a personalized, professional response that you can edit before sending.',
    },
    {
      id: '2',
      type: 'add_hours',
      title: 'Add Christmas holiday hours',
      description: 'Update your Google Business Profile with holiday hours for December 24-26.',
      estimatedImpact: 'medium',
      creditCost: 0,
      riskLevel: 'low',
      status: 'available',
      preview: 'We\'ll add the following hours:\n• Dec 24: 7:00 AM - 3:00 PM\n• Dec 25: Closed\n• Dec 26: 9:00 AM - 5:00 PM',
    },
    {
      id: '3',
      type: 'generate_post',
      title: 'Create a GBP post about your holiday menu',
      description: 'Generate engaging content to promote your seasonal offerings.',
      estimatedImpact: 'medium',
      creditCost: 2,
      riskLevel: 'low',
      status: 'available',
      preview: '🎄 Holiday Menu Now Available!\n\nWarm up this winter with our seasonal favorites:\n• Peppermint Mocha\n• Gingerbread Latte\n• Spiced Apple Cider\n\nAvailable for a limited time. Stop by today!',
    },
    {
      id: '4',
      type: 'create_content',
      title: 'Generate location page content',
      description: 'Create SEO-optimized content for your downtown location page.',
      estimatedImpact: 'high',
      creditCost: 3,
      riskLevel: 'medium',
      status: 'available',
    },
    {
      id: '5',
      type: 'flag_issue',
      title: 'Flag tracking issues for agency',
      description: 'Compile a report of tracking issues to share with your web team.',
      estimatedImpact: 'low',
      creditCost: 0,
      riskLevel: 'low',
      status: 'available',
    },
  ];

  const handlePreview = (action: GrowthAction) => {
    setPreviewAction(action);
    addActivityLog({
      type: 'user_action',
      title: 'Action preview viewed',
      description: `Previewed: ${action.title}`,
      isAI: false,
    });
  };

  const handleExecute = (action: GrowthAction) => {
    updateGrowthAction(action.id, { status: 'in_progress' });
    addActivityLog({
      type: 'executed_change',
      title: 'Action executed',
      description: action.title,
      isAI: true,
    });
    
    // Simulate completion
    setTimeout(() => {
      updateGrowthAction(action.id, { status: 'completed' });
      toast.success(`Completed: ${action.title}`);
    }, 2000);
    
    setPreviewAction(null);
  };

  const availableActions = mockActions.filter(a => a.status === 'available');
  const completedActions = mockActions.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI Growth Actions
              </CardTitle>
              <CardDescription>
                Safe, AI-powered actions to improve your local visibility
              </CardDescription>
            </div>
            <Badge variant="outline">{availableActions.length} available</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Available Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Available Actions</h3>
        <div className="grid gap-3">
          {mockActions.filter(a => a.status !== 'completed').map((action) => (
            <ActionCard 
              key={action.id} 
              action={action} 
              onPreview={handlePreview}
              onExecute={handleExecute}
            />
          ))}
        </div>
      </div>

      {/* Completed Actions */}
      {completedActions.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          <div className="grid gap-3">
            {completedActions.map((action) => (
              <ActionCard 
                key={action.id} 
                action={action} 
                onPreview={handlePreview}
                onExecute={handleExecute}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAction} onOpenChange={() => setPreviewAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewAction && <ActionTypeIcon type={previewAction.type} />}
              {previewAction?.title}
            </DialogTitle>
            <DialogDescription>{previewAction?.description}</DialogDescription>
          </DialogHeader>
          
          {previewAction?.preview && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Preview</p>
              <p className="text-sm whitespace-pre-wrap">{previewAction.preview}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {previewAction && <ImpactBadge impact={previewAction.estimatedImpact} />}
            {previewAction && <RiskBadge risk={previewAction.riskLevel} />}
            {previewAction && previewAction.creditCost > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                {previewAction.creditCost} credit{previewAction.creditCost > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewAction(null)}>Cancel</Button>
            <Button onClick={() => previewAction && handleExecute(previewAction)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
