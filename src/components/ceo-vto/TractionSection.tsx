import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, Target, Users, Megaphone, Cpu, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { Rock, YearGoal, TractionSliders } from '@/hooks/useCEOVTO';

interface Props {
  rocks: Rock[];
  setRocks: (r: Rock[]) => void;
  yearGoals: YearGoal[];
  setYearGoals: (g: YearGoal[]) => void;
  sliders: TractionSliders;
  setSliders: (s: TractionSliders) => void;
  kpis: Record<string, number>;
  readOnly?: boolean;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  at_risk: 'At Risk',
  completed: 'Completed',
};

export function TractionSection({ rocks, setRocks, yearGoals, setYearGoals, sliders, setSliders, kpis, readOnly = false }: Props) {
  const updateRock = (id: string, field: keyof Rock, value: string) => {
    setRocks(rocks.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRock = () => {
    const newRock: Rock = {
      id: Date.now().toString(),
      name: '',
      description: '',
      owner: '',
      status: 'not_started',
    };
    setRocks([...rocks, newRock]);
  };

  const deleteRock = (id: string) => {
    setRocks(rocks.filter(r => r.id !== id));
  };

  const updateGoal = (id: string, target: string) => {
    setYearGoals(yearGoals.map(g => g.id === id ? { ...g, target } : g));
  };

  return (
    <div className="space-y-6">
      {/* Quarterly Rocks */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              Quarterly Rocks
            </CardTitle>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={addRock}>
                <Plus className="w-4 h-4 mr-1" /> Add Rock
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rocks.map((rock) => (
              <div key={rock.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-3">
                    <Input
                      value={rock.name}
                      onChange={(e) => updateRock(rock.id, 'name', e.target.value)}
                      placeholder="Rock Name"
                      className="font-medium"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-4">
                    <Textarea
                      value={rock.description}
                      onChange={(e) => updateRock(rock.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="min-h-[40px] resize-none"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={rock.owner}
                      onChange={(e) => updateRock(rock.id, 'owner', e.target.value)}
                      placeholder="Owner"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={rock.status}
                      onValueChange={(v) => updateRock(rock.id, 'status', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
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
                      <Button size="icon" variant="ghost" onClick={() => deleteRock(rock.id)}>
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

      {/* 1-Year Company Goals */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            1-Year Company Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {yearGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-muted/30 rounded-lg">
                <Label className="text-xs text-muted-foreground">{goal.label}</Label>
                <Input
                  value={goal.target}
                  onChange={(e) => updateGoal(goal.id, e.target.value)}
                  className="mt-1 font-semibold"
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CEO Adjustable Sliders */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            CEO Adjustable Projections
            <span className="text-xs font-normal text-muted-foreground ml-2">(Real-time KPI impact)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Creator Growth */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <Label>Creator Growth %</Label>
              </div>
              <Badge variant="outline">{sliders.creatorGrowth}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">How fast creators join each month</p>
            <Slider
              value={[sliders.creatorGrowth]}
              onValueChange={([v]) => setSliders({ ...sliders, creatorGrowth: v })}
              min={1}
              max={20}
              step={1}
              disabled={readOnly}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Advertising Demand */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <Label>Advertising Demand %</Label>
              </div>
              <Badge variant="outline">{sliders.advertisingDemand > 0 ? '+' : ''}{sliders.advertisingDemand}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Adjust marketplace projections</p>
            <Slider
              value={[sliders.advertisingDemand]}
              onValueChange={([v]) => setSliders({ ...sliders, advertisingDemand: v })}
              min={-20}
              max={50}
              step={5}
              disabled={readOnly}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-20%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* AI Automation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-500" />
                <Label>AI Automation Efficiency</Label>
              </div>
              <Badge variant="outline">{sliders.aiAutomation.toFixed(1)}x</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Degree to which AI reduces OpEx</p>
            <Slider
              value={[sliders.aiAutomation * 100]}
              onValueChange={([v]) => setSliders({ ...sliders, aiAutomation: v / 100 })}
              min={80}
              max={120}
              step={5}
              disabled={readOnly}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.8x</span>
              <span>1.2x</span>
            </div>
          </div>

          {/* Identity Verification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <Label>Identity Verification Adoption</Label>
              </div>
              <Badge variant="outline">{sliders.identityVerification}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Percent of creators completing identity verification</p>
            <Slider
              value={[sliders.identityVerification]}
              onValueChange={([v]) => setSliders({ ...sliders, identityVerification: v })}
              min={10}
              max={100}
              step={5}
              disabled={readOnly}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
