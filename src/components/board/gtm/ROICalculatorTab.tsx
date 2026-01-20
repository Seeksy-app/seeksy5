import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Users, Target } from 'lucide-react';

export function ROICalculatorTab() {
  const [monthlySpend, setMonthlySpend] = useState(10000);
  const [leadsGenerated, setLeadsGenerated] = useState(500);
  const [conversionRate, setConversionRate] = useState(35);
  const [avgCreatorValue, setAvgCreatorValue] = useState(450);

  const calculations = useMemo(() => {
    const conversions = Math.round(leadsGenerated * (conversionRate / 100));
    const revenue = conversions * avgCreatorValue;
    const roi = monthlySpend > 0 ? ((revenue - monthlySpend) / monthlySpend) * 100 : 0;
    const costPerLead = leadsGenerated > 0 ? monthlySpend / leadsGenerated : 0;
    const costPerAcquisition = conversions > 0 ? monthlySpend / conversions : 0;

    return {
      conversions,
      revenue,
      roi,
      costPerLead,
      costPerAcquisition,
    };
  }, [monthlySpend, leadsGenerated, conversionRate, avgCreatorValue]);

  const channelROI = [
    { channel: 'AI Studio', roi: 320, spend: 2000 },
    { channel: 'Podcast Migration', roi: 280, spend: 1500 },
    { channel: 'Creator Referrals', roi: 450, spend: 1000 },
    { channel: 'Paid Ads', roi: 85, spend: 4000 },
    { channel: 'Conferences', roi: 180, spend: 1500 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <Calculator className="w-5 h-5 text-blue-600" />
              ROI Calculator Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-sm text-slate-600">Monthly Marketing Spend ($)</Label>
              <Input
                type="number"
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600">Leads Generated</Label>
              <Input
                type="number"
                value={leadsGenerated}
                onChange={(e) => setLeadsGenerated(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600">Conversion Rate (%)</Label>
              <Input
                type="number"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600">Avg Creator Value (ARR)</Label>
              <Input
                type="number"
                value={avgCreatorValue}
                onChange={(e) => setAvgCreatorValue(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Outputs */}
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Calculated Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-500">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ${calculations.revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-slate-500">ROI</span>
                </div>
                <p className={`text-2xl font-bold ${calculations.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {calculations.roi.toFixed(0)}%
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-slate-500">Cost per Lead</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ${calculations.costPerLead.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-slate-500">Cost per Acquisition</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ${calculations.costPerAcquisition.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel ROI Comparison */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">ROI Comparison by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelROI} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} unit="%" />
                <YAxis dataKey="channel" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={120} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="roi" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Insights */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Channel Insights</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><strong>Creator Referrals</strong> delivers highest ROI (450%) due to low acquisition cost and high trust.</li>
            <li><strong>AI Studio Funnel</strong> shows strong organic conversion from product-led growth.</li>
            <li><strong>Paid Ads</strong> have lowest ROI but highest reach — best for awareness campaigns.</li>
            <li><strong>Conferences</strong> provide medium ROI but drive high-value enterprise leads.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
