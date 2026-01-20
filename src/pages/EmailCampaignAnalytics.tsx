import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  UserMinus, 
  MoreHorizontal,
  ExternalLink,
  Copy,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

type MetricType = "opens" | "clicks" | "delivered" | "unsubscribed";

export default function EmailCampaignAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeMetric, setActiveMetric] = useState<MetricType>("opens");

  const { data: campaign } = useQuery({
    queryKey: ["email-campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["campaign-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_events")
        .select("*")
        .eq("campaign_id", id)
        .order("occurred_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  const stats = {
    delivered: campaign.total_delivered || 0,
    opened: campaign.total_opened || 0,
    clicked: campaign.total_clicked || 0,
    unsubscribed: 0, // TODO: Add unsubscribe tracking
  };

  const rates = {
    openRate: stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : "0.0",
    clickRate: stats.delivered > 0 ? ((stats.clicked / stats.delivered) * 100).toFixed(1) : "0.0",
  };

  // Group events by hour/day for chart
  const eventsByTime = events?.reduce((acc: any, event: any) => {
    const time = format(new Date(event.occurred_at), "MMM d HH:mm");
    if (!acc[time]) {
      acc[time] = { time, opened: 0, clicked: 0, delivered: 0, unsubscribed: 0 };
    }
    if (event.event_type === "opened") acc[time].opened++;
    if (event.event_type === "clicked") acc[time].clicked++;
    if (event.event_type === "delivered") acc[time].delivered++;
    if (event.event_type === "unsubscribed") acc[time].unsubscribed++;
    return acc;
  }, {});

  const chartData = Object.values(eventsByTime || {});

  const metricConfig = {
    opens: { key: "opened", color: "#3b82f6", label: "Opens" },
    clicks: { key: "clicked", color: "#14b8a6", label: "Clicks" },
    delivered: { key: "delivered", color: "#10b981", label: "Delivered" },
    unsubscribed: { key: "unsubscribed", color: "#f59e0b", label: "Unsubscribed" },
  };

  const currentMetric = metricConfig[activeMetric];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
      {/* Top Header Bar */}
      <div className="h-[72px] bg-gradient-to-r from-[#F7F7FA] to-[#E0ECF9] border-b border-black/[0.06] relative">
        <div className="max-w-[1400px] mx-auto h-full px-8 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-foreground">Campaign Analytics</h1>
            <p className="text-[15px] font-medium text-[#4B5563] mt-0.5">
              Performance for: {campaign.campaign_name || campaign.subject}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/email/${id}/view`)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Email
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Resend Campaign
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Spark Mascot */}
        <img 
          src="/spark/base/idle.png" 
          alt="" 
          className="absolute right-8 top-2 w-[60px] h-[60px] opacity-[0.12] pointer-events-none"
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {/* Metric Strip */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {/* Delivered */}
          <div className="bg-white rounded-xl h-[110px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#4B5563] mb-1">Delivered</p>
                <p className="text-[26px] font-semibold text-foreground">{stats.delivered}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Successfully delivered</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-500 mt-1" />
            </div>
          </div>

          {/* Opens */}
          <div className="bg-white rounded-xl h-[110px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#4B5563] mb-1">Opens</p>
                <p className="text-[26px] font-semibold text-foreground">{stats.opened}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{rates.openRate}% open rate</p>
              </div>
              <Eye className="h-6 w-6 text-blue-500 mt-1" />
            </div>
          </div>

          {/* Clicks */}
          <div className="bg-white rounded-xl h-[110px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#4B5563] mb-1">Clicks</p>
                <p className="text-[26px] font-semibold text-foreground">{stats.clicked}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{rates.clickRate}% click rate</p>
              </div>
              <MousePointerClick className="h-6 w-6 text-teal-500 mt-1" />
            </div>
          </div>

          {/* Unsubscribed */}
          <div className="bg-white rounded-xl h-[110px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#4B5563] mb-1">Unsubscribed</p>
                <p className="text-[26px] font-semibold text-foreground">{stats.unsubscribed}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Opted out</p>
              </div>
              <UserMinus className="h-6 w-6 text-red-500 mt-1" />
            </div>
          </div>
        </div>

        {/* Performance Graph */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-semibold text-foreground">Performance Over Time</h3>
            <div className="flex bg-muted rounded-lg p-1">
              {(["opens", "clicks", "delivered", "unsubscribed"] as MetricType[]).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    activeMetric === metric
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {metricConfig[metric].label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentMetric.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={currentMetric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Line 
                type="monotone" 
                dataKey={currentMetric.key}
                stroke={currentMetric.color}
                strokeWidth={2.5}
                fill="url(#metricGradient)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Timeline */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <h3 className="text-[18px] font-semibold text-foreground mb-4">Event Timeline</h3>
          <div className="space-y-3">
            {events?.slice(0, 20).map((event) => {
              const eventColors = {
                delivered: "text-gray-600",
                opened: "text-blue-600",
                clicked: "text-teal-600",
                bounced: "text-red-600",
                unsubscribed: "text-orange-600",
              };
              const eventIcons = {
                delivered: CheckCircle2,
                opened: Eye,
                clicked: MousePointerClick,
                bounced: UserMinus,
                unsubscribed: UserMinus,
              };
              const Icon = eventIcons[event.event_type as keyof typeof eventIcons] || CheckCircle2;
              const color = eventColors[event.event_type as keyof typeof eventColors] || "text-gray-600";

              return (
                <div key={event.id} className="grid grid-cols-[40px_1fr_120px] items-center gap-4 py-2 border-b border-border/50 last:border-0">
                  <Icon className={cn("h-5 w-5", color)} />
                  <span className="text-[14px] font-medium text-foreground capitalize">
                    {event.event_type}
                  </span>
                  <span className="text-[13px] text-muted-foreground text-right">
                    {format(new Date(event.occurred_at), "MMM d, h:mm a")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
