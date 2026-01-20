import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Lightbulb, Target, Trophy } from 'lucide-react';
import { VisionData } from '@/hooks/useCEOVTO';

interface Props {
  vision: VisionData;
  setVision: (v: VisionData) => void;
  kpis: Record<string, number>;
  readOnly?: boolean;
}

export function VisionSection({ vision, setVision, kpis, readOnly = false }: Props) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const formatPercent = (n: number) => `${n.toFixed(1)}%`;

  const kpiCards = [
    { label: 'ARR', value: formatNumber(kpis.arr), color: 'bg-emerald-500' },
    { label: 'CAC', value: `$${kpis.cac}`, color: 'bg-blue-500' },
    { label: 'LTV', value: `$${kpis.ltv}`, color: 'bg-purple-500' },
    { label: 'Runway', value: `${kpis.runway} mo`, color: 'bg-amber-500' },
    { label: 'Burn Rate', value: formatNumber(kpis.burnRate) + '/mo', color: 'bg-red-500' },
    { label: 'EBITDA', value: formatPercent(kpis.ebitda), color: 'bg-indigo-500' },
    { label: 'Creator Count', value: kpis.creatorCount.toLocaleString(), color: 'bg-teal-500' },
    { label: 'Verified Creators', value: kpis.verifiedCreators.toLocaleString(), color: 'bg-cyan-500' },
    { label: 'AI Tool Adoption', value: `${kpis.aiToolAdoption}%`, color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Vision Summary */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            Vision Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">10-Year Vision</Label>
            <Textarea
              value={vision.tenYearVision}
              onChange={(e) => setVision({ ...vision, tenYearVision: e.target.value })}
              className="mt-1.5 min-h-[80px] resize-none"
              placeholder="Where will the company be in 10 years?"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">3-Year Picture</Label>
            <Textarea
              value={vision.threeYearPicture}
              onChange={(e) => setVision({ ...vision, threeYearPicture: e.target.value })}
              className="mt-1.5 min-h-[80px] resize-none"
              placeholder="What does success look like in 3 years?"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">1-Year Focus</Label>
            <Textarea
              value={vision.oneYearFocus}
              onChange={(e) => setVision({ ...vision, oneYearFocus: e.target.value })}
              className="mt-1.5 min-h-[80px] resize-none"
              placeholder="What must we accomplish this year?"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Differentiators */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            Differentiators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Why We Win</Label>
            <div className="mt-1.5 space-y-2">
              {vision.whyWeWin.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <Textarea
                    value={item}
                    onChange={(e) => {
                      const updated = [...vision.whyWeWin];
                      updated[idx] = e.target.value;
                      setVision({ ...vision, whyWeWin: updated });
                    }}
                    className="min-h-[40px] resize-none flex-1"
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">What Sets Us Apart</Label>
            <div className="mt-1.5 space-y-2">
              {vision.whatSetsUsApart.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <Textarea
                    value={item}
                    onChange={(e) => {
                      const updated = [...vision.whatSetsUsApart];
                      updated[idx] = e.target.value;
                      setVision({ ...vision, whatSetsUsApart: updated });
                    }}
                    className="min-h-[40px] resize-none flex-1"
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Competitive Edge Overview</Label>
            <Textarea
              value={vision.competitiveEdge}
              onChange={(e) => setVision({ ...vision, competitiveEdge: e.target.value })}
              className="mt-1.5 min-h-[60px] resize-none"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Company Metrics */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            Key Company Metrics
            <span className="text-xs font-normal text-muted-foreground ml-2">(Auto-pulled from CFO + Product)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${kpi.color} mx-auto mb-2`} />
                <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
