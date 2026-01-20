import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Mic, Users, Megaphone, Calendar, Handshake } from 'lucide-react';

const channels = [
  {
    icon: Sparkles,
    name: 'AI Studio Funnel',
    description: 'Creators discover Seeksy through AI clip generation and editing tools.',
    reach: 95,
    cost: '$',
    conversionRate: '38%',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Mic,
    name: 'Podcast Hosting Migration',
    description: 'One-click migration from Anchor, Buzzsprout, Libsyn with RSS redirect.',
    reach: 75,
    cost: '$$',
    conversionRate: '45%',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Users,
    name: 'Creator Referrals',
    description: 'Incentivized referral program with revenue share for active creators.',
    reach: 60,
    cost: '$',
    conversionRate: '58%',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Megaphone,
    name: 'Influencer Ads (Meta/TikTok)',
    description: 'Targeted campaigns to creators based on content type and audience size.',
    reach: 90,
    cost: '$$$$',
    conversionRate: '18%',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Calendar,
    name: 'Conference Activations',
    description: 'Podcast Movement, VidCon, NAB — demos, workshops, and creator meetups.',
    reach: 40,
    cost: '$$$',
    conversionRate: '47%',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Handshake,
    name: 'Brand Partnerships',
    description: 'Co-marketing with mic brands, camera companies, and editing tool makers.',
    reach: 55,
    cost: '$$',
    conversionRate: '32%',
    color: 'from-teal-500 to-teal-600',
  },
];

const getCostLabel = (cost: string) => {
  const colors: Record<string, string> = {
    '$': 'bg-emerald-100 text-emerald-700',
    '$$': 'bg-blue-100 text-blue-700',
    '$$$': 'bg-amber-100 text-amber-700',
    '$$$$': 'bg-red-100 text-red-700',
  };
  return colors[cost] || 'bg-slate-100 text-slate-700';
};

export function ChannelsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel) => (
          <Card key={channel.name} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${channel.color}`}>
                  <channel.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{channel.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{channel.description}</p>
                  
                  {/* Metrics */}
                  <div className="mt-4 space-y-3">
                    {/* Reach Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Reach Potential</span>
                        <span className="font-medium text-slate-700">{channel.reach}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${channel.color} rounded-full transition-all`}
                          style={{ width: `${channel.reach}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Cost & Conversion */}
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostLabel(channel.cost)}`}>
                        Cost: {channel.cost}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        Conv: {channel.conversionRate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Cost Efficiency Legend</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">$</span>
              <span className="text-xs text-slate-600">Very Low Cost</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">$$</span>
              <span className="text-xs text-slate-600">Low Cost</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">$$$</span>
              <span className="text-xs text-slate-600">Moderate Cost</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">$$$$</span>
              <span className="text-xs text-slate-600">High Cost</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
