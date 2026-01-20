/**
 * Milestones Tracker - Connected to Admin database with AI insights
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, Circle, Clock, AlertTriangle, 
  ArrowRight, Calendar, Users, Zap, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useMilestones, 
  calculateProgress, 
  CATEGORY_LABELS, 
  STATUS_LABELS,
  AVAILABLE_METRICS,
  Milestone,
} from '@/hooks/useMilestones';
import { BoardMilestoneAIInsights } from '@/components/board/milestones/BoardMilestoneAIInsights';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'completed' | 'in_progress' | 'at_risk' | 'blocked' | 'not_started';

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  not_started: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border' },
  at_risk: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  blocked: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const CATEGORY_ICONS = {
  product: Zap,
  engineering: Zap,
  growth: Users,
  ops: Target,
  fundraising: Calendar,
};

export default function BoardMilestones() {
  const { data: milestones, isLoading } = useMilestones();
  const [filter, setFilter] = useState<FilterStatus>('all');
  
  const filteredMilestones = filter === 'all' 
    ? milestones 
    : milestones?.filter(m => m.status === filter);
  
  const stats = {
    total: milestones?.length || 0,
    completed: milestones?.filter(m => m.status === 'completed').length || 0,
    inProgress: milestones?.filter(m => m.status === 'in_progress').length || 0,
    atRisk: milestones?.filter(m => m.status === 'at_risk' || m.status === 'blocked').length || 0,
    notStarted: milestones?.filter(m => m.status === 'not_started').length || 0,
  };
  
  const overallProgress = milestones?.length 
    ? Math.round(milestones.reduce((sum, m) => sum + calculateProgress(m), 0) / milestones.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Milestones Tracker</h1>
        <p className="text-muted-foreground">Track progress on key company milestones</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">
                {stats.completed} of {stats.total} milestones complete
              </p>
            </div>
            <span className="text-3xl font-bold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setFilter('completed')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setFilter('in_progress')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilter('at_risk')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.atRisk}</p>
                <p className="text-sm text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-border transition-colors" onClick={() => setFilter('not_started')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.notStarted}</p>
                <p className="text-sm text-muted-foreground">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {milestones && milestones.length > 0 && (
        <BoardMilestoneAIInsights milestones={milestones} />
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'completed', 'in_progress', 'at_risk', 'not_started'] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones?.map(milestone => {
          const config = STATUS_CONFIG[milestone.status];
          const StatusIcon = config.icon;
          const CategoryIcon = CATEGORY_ICONS[milestone.category] || Zap;
          const progress = calculateProgress(milestone);
          const metricLabel = AVAILABLE_METRICS.find(m => m.key === milestone.metric_key)?.label;
          
          return (
            <Card key={milestone.id} className={cn("border", config.border)}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", config.bg)}>
                    <StatusIcon className={cn("w-5 h-5", config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{milestone.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {CATEGORY_LABELS[milestone.category]}
                      </Badge>
                      {milestone.is_demo && (
                        <Badge variant="secondary" className="text-xs">Demo</Badge>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                    )}
                    
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    {/* Metric info */}
                    {milestone.progress_type === 'metric' && metricLabel && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {metricLabel}: {milestone.metric_current?.toLocaleString() || 0} / {milestone.metric_target?.toLocaleString() || 0}
                      </p>
                    )}
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {milestone.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {milestone.owner && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {milestone.owner}
                        </span>
                      )}
                      {milestone.dependencies && milestone.dependencies.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {milestone.dependencies.length} dependencies
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={
                      milestone.status === 'completed' ? 'default' :
                      milestone.status === 'in_progress' ? 'secondary' :
                      milestone.status === 'at_risk' || milestone.status === 'blocked' ? 'destructive' : 'outline'
                    }>
                      {STATUS_LABELS[milestone.status]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
