import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Calendar, Plus, Trash2, Flag } from 'lucide-react';
import { Milestone } from '@/hooks/useCEOVTO';

interface Props {
  milestones: Milestone[];
  setMilestones: (m: Milestone[]) => void;
  kpis: Record<string, number>;
  readOnly?: boolean;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  at_risk: 'At Risk',
  completed: 'Completed',
};

export function OperationsSection({ milestones, setMilestones, kpis, readOnly = false }: Props) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const operationalKPIs = [
    { label: 'New Verified/Mo', value: kpis.newVerifiedPerMonth?.toLocaleString() || '0', color: 'bg-emerald-500' },
    { label: 'Creator CAC', value: `$${kpis.cac}`, color: 'bg-blue-500' },
    { label: 'Churn Rate', value: '4.2%', color: 'bg-red-500' },
    { label: 'LTV/Creator', value: `$${kpis.ltv}`, color: 'bg-purple-500' },
    { label: 'ARR', value: formatNumber(kpis.arr), color: 'bg-indigo-500' },
    { label: 'Runway', value: `${kpis.runway} mo`, color: 'bg-amber-500' },
    { label: 'Burn Rate', value: formatNumber(kpis.burnRate) + '/mo', color: 'bg-pink-500' },
    { label: 'EBITDA', value: `${kpis.ebitda?.toFixed(1)}%`, color: 'bg-teal-500' },
    { label: 'Avg Clips/Creator', value: kpis.avgClipsPerCreator?.toString() || '0', color: 'bg-cyan-500' },
    { label: 'Studio Hours', value: kpis.studioUsageHours?.toLocaleString() || '0', color: 'bg-orange-500' },
    { label: '% Verified', value: `${Math.round((kpis.verifiedCreators / kpis.creatorCount) * 100) || 0}%`, color: 'bg-green-500' },
    { label: 'AI Tool Adoption', value: `${kpis.aiToolAdoption}%`, color: 'bg-violet-500' },
  ];

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: '',
      owner: '',
      deadline: new Date().toISOString().split('T')[0],
      status: 'not_started',
    };
    setMilestones([...milestones, newMilestone]);
  };

  const deleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // Sort by deadline
  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            KPI Overview
            <span className="text-xs font-normal text-muted-foreground ml-2">(Auto-pulled from CFO + Product Analytics)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {operationalKPIs.map((kpi) => (
              <div key={kpi.label} className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                <div className={`w-2 h-2 rounded-full ${kpi.color} mx-auto mb-2`} />
                <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operational Milestones */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Flag className="w-4 h-4 text-white" />
              </div>
              Operational Milestones
              <span className="text-xs font-normal text-muted-foreground ml-2">(Sorted by deadline)</span>
            </CardTitle>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={addMilestone}>
                <Plus className="w-4 h-4 mr-1" /> Add Milestone
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedMilestones.map((milestone) => (
              <div key={milestone.id} className={`p-4 rounded-lg border ${statusColors[milestone.status]}`}>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                      placeholder="Milestone Title"
                      className="font-medium bg-background"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={milestone.owner}
                      onChange={(e) => updateMilestone(milestone.id, 'owner', e.target.value)}
                      placeholder="Owner"
                      className="bg-background"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={milestone.deadline}
                        onChange={(e) => updateMilestone(milestone.id, 'deadline', e.target.value)}
                        className="bg-background"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={milestone.status}
                      onValueChange={(v) => updateMilestone(milestone.id, 'status', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!readOnly && (
                    <div className="col-span-1 flex justify-end">
                      <Button size="icon" variant="ghost" onClick={() => deleteMilestone(milestone.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
