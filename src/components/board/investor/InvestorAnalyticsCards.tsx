import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Clock, MousePointer, Mail, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function InvestorAnalyticsCards() {
  const { data: links } = useQuery({
    queryKey: ['investorLinksStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['allLinkActivities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_link_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const totalViews = links?.reduce((sum, l) => sum + (l.total_views || 0), 0) || 0;
  const activeLinks = links?.filter(l => l.status === 'active').length || 0;
  const totalEmails = links?.length || 0;

  // Calculate section view frequency
  const sectionCounts: Record<string, number> = {};
  activities?.forEach(a => {
    if (a.tab_viewed) {
      sectionCounts[a.tab_viewed] = (sectionCounts[a.tab_viewed] || 0) + 1;
    }
  });
  const sectionData = Object.entries(sectionCounts).map(([name, count]) => ({ name, count }));

  // Calculate engagement over time (last 7 days)
  const now = new Date();
  const engagementData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = activities?.filter(a => 
      a.created_at.startsWith(dateStr)
    ).length || 0;
    engagementData.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      views: count,
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
                <p className="text-xs text-slate-500">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeLinks}</p>
                <p className="text-xs text-slate-500">Active Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalEmails}</p>
                <p className="text-xs text-slate-500">Links Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {links?.filter(l => l.expires_at && new Date(l.expires_at) > new Date()).length || 0}
                </p>
                <p className="text-xs text-slate-500">Not Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Sections Viewed Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectionData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Engagement Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={engagementData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
