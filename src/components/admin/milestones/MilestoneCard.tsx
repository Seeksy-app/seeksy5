import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Milestone, 
  CATEGORY_LABELS, 
  STATUS_LABELS, 
  STATUS_COLORS,
  calculateProgress,
  useUpdateMilestone,
  useDeleteMilestone,
  useUpdateSubtask,
  AVAILABLE_METRICS,
} from '@/hooks/useMilestones';
import { MoreVertical, Pencil, Trash2, Calendar, User, Target, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface MilestoneCardProps {
  milestone: Milestone;
  allMilestones: Milestone[];
  onEdit: (milestone: Milestone) => void;
}

export function MilestoneCard({ milestone, allMilestones, onEdit }: MilestoneCardProps) {
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const updateSubtask = useUpdateSubtask();
  
  const progress = calculateProgress(milestone);
  
  const daysUntilDue = milestone.due_date 
    ? differenceInDays(new Date(milestone.due_date), new Date())
    : null;
  
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;
  
  const dependencies = milestone.dependencies
    ?.map(depId => allMilestones.find(m => m.id === depId))
    .filter(Boolean) as Milestone[] || [];
  
  const metricLabel = AVAILABLE_METRICS.find(m => m.key === milestone.metric_key)?.label;

  const handleStatusChange = async (status: Milestone['status']) => {
    await updateMilestone.mutateAsync({ id: milestone.id, status });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      await deleteMilestone.mutateAsync(milestone.id);
    }
  };

  const handleSubtaskToggle = async (subtaskId: string, isCompleted: boolean) => {
    await updateSubtask.mutateAsync({ id: subtaskId, is_completed: !isCompleted });
  };

  return (
    <Card className="relative">
      {milestone.is_demo && (
        <Badge variant="outline" className="absolute top-2 right-12 text-xs">Demo</Badge>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {milestone.title}
            </CardTitle>
            {milestone.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {milestone.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(milestone)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('not_started')}>
                Mark as Not Started
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('at_risk')}>
                Mark as At Risk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                Mark as Blocked
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{CATEGORY_LABELS[milestone.category]}</Badge>
          <Badge className={STATUS_COLORS[milestone.status]}>
            {STATUS_LABELS[milestone.status]}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {milestone.progress_type === 'metric' && metricLabel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>
              {metricLabel}: {milestone.metric_current?.toLocaleString() || 0} / {milestone.metric_target?.toLocaleString() || 0}
            </span>
          </div>
        )}
        
        {milestone.progress_type === 'subtask' && milestone.subtasks && milestone.subtasks.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Subtasks:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {milestone.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={subtask.is_completed}
                    onCheckedChange={() => handleSubtaskToggle(subtask.id, subtask.is_completed)}
                  />
                  <span className={subtask.is_completed ? 'line-through text-muted-foreground' : ''}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {milestone.owner && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{milestone.owner}</span>
            </div>
          )}
          
          {milestone.due_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : isDueSoon ? 'text-yellow-600' : ''}`}>
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
            </div>
          )}
        </div>
        
        {dependencies.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Depends on: </span>
            {dependencies.map((dep, i) => (
              <span key={dep.id}>
                {i > 0 && ', '}
                <span className={dep.status === 'blocked' || dep.status === 'at_risk' ? 'text-destructive' : ''}>
                  {dep.title}
                </span>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
