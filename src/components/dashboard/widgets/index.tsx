import { TrendingUp, MousePointerClick, Mail, Calendar, Users, Vote, Mic, DollarSign, Film, Zap, ArrowRight } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WidgetData {
  profileViews?: number;
  profileViewsThisWeek?: number;
  linkClicks?: number;
  linkClicksThisWeek?: number;
  totalEmailsSent?: number;
  totalEvents?: number;
  publishedEvents?: number;
  upcomingMeetings?: number;
  publishedPolls?: number;
  totalPodcasts?: number;
  totalEpisodes?: number;
  totalRevenue?: number;
  totalImpressions?: number;
  mediaFiles?: number;
  engagementRate?: number;
}

export const ProfileViewsWidget = ({ data }: { data: WidgetData }) => (
  <DashboardWidget title="My Page - Profile Views" icon={<TrendingUp className="h-5 w-5" />} brandColor="blue">
    <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
      {data.profileViews?.toLocaleString() || 0}
    </div>
    <p className="text-sm text-muted-foreground mb-3 font-medium">
      +{data.profileViewsThisWeek?.toLocaleString() || 0} this week
    </p>
    <Progress 
      value={data.profileViewsThisWeek && data.profileViews ? Math.min((data.profileViewsThisWeek / data.profileViews) * 100, 100) : 0} 
      className="h-2.5" 
    />
  </DashboardWidget>
);

export const LinkClicksWidget = ({ data }: { data: WidgetData }) => (
  <DashboardWidget title="My Page - Link Clicks" icon={<MousePointerClick className="h-5 w-5" />} brandColor="navy">
    <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
      {data.linkClicks?.toLocaleString() || 0}
    </div>
    <p className="text-sm text-muted-foreground mb-3 font-medium">
      +{data.linkClicksThisWeek?.toLocaleString() || 0} this week
    </p>
    <Progress 
      value={data.linkClicksThisWeek && data.linkClicks ? Math.min((data.linkClicksThisWeek / data.linkClicks) * 100, 100) : 0}
      className="h-2.5" 
    />
  </DashboardWidget>
);

export const EmailsWidget = ({ data }: { data: WidgetData }) => (
  <DashboardWidget title="Emails Sent" icon={<Mail className="h-5 w-5" />} brandColor="red">
    <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
      {data.totalEmailsSent?.toLocaleString() || 0}
    </div>
    <p className="text-sm text-muted-foreground font-medium">Total messages delivered</p>
  </DashboardWidget>
);

export const EngagementWidget = ({ data }: { data: WidgetData }) => (
  <DashboardWidget 
    title={
      <div className="flex items-center gap-2">
        <span>My Page - Engagement Rate</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-muted text-muted-foreground border-border">
              <p>Link clicks divided by profile views</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    }
    icon={<TrendingUp className="h-5 w-5" />}
    brandColor="gold"
  >
    <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
      {data.engagementRate?.toFixed(1) || 0}%
    </div>
    <p className="text-sm text-muted-foreground font-medium">Click-through rate</p>
  </DashboardWidget>
);

export const EventsWidget = ({ data }: { data: WidgetData }) => {
  const navigate = useNavigate();
  
  return (
    <div onClick={() => navigate("/events")} className="cursor-pointer">
      <DashboardWidget title="Events" icon={<Calendar className="h-5 w-5" />} brandColor="gold">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {data.totalEvents?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground font-medium">{data.publishedEvents || 0} published</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </DashboardWidget>
    </div>
  );
};

export const MeetingsWidget = ({ data }: { data: WidgetData }) => {
  const navigate = useNavigate();
  
  return (
    <div onClick={() => navigate("/meetings")} className="cursor-pointer">
      <DashboardWidget title="Meetings" icon={<Users className="h-5 w-5" />} brandColor="blue">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {data.upcomingMeetings?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Scheduled sessions</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </DashboardWidget>
    </div>
  );
};

export const PollsWidget = ({ data }: { data: WidgetData }) => {
  const navigate = useNavigate();
  
  return (
    <div onClick={() => navigate("/polls")} className="cursor-pointer">
      <DashboardWidget title="Polls" icon={<Vote className="h-5 w-5" />} brandColor="navy">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {data.publishedPolls?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Currently live</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </DashboardWidget>
    </div>
  );
};

export const PodcastsWidget = ({ data }: { data: WidgetData }) => {
  const navigate = useNavigate();
  
  return (
    <div onClick={() => navigate("/podcasts")} className="cursor-pointer">
      <DashboardWidget title="Podcasts" icon={<Mic className="h-5 w-5" />} brandColor="red">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {data.totalPodcasts?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground font-medium">{data.totalEpisodes || 0} episodes</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </DashboardWidget>
    </div>
  );
};

export const RevenueWidget = ({ data }: { data: WidgetData }) => (
  <DashboardWidget title="Ad Revenue" icon={<DollarSign className="h-5 w-5" />} brandColor="gold">
    <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
      ${(data.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </div>
    <p className="text-sm text-muted-foreground font-medium">{data.totalImpressions?.toLocaleString() || 0} impressions</p>
  </DashboardWidget>
);

export const MediaWidget = ({ data }: { data: WidgetData }) => {
  const navigate = useNavigate();
  
  return (
    <div onClick={() => navigate("/media-library")} className="cursor-pointer">
      <DashboardWidget title="Media Library" icon={<Film className="h-5 w-5" />} brandColor="navy">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {data.mediaFiles?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Files uploaded</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </DashboardWidget>
    </div>
  );
};

export const QuickStatsWidget = ({ data }: { data: WidgetData }) => (
  <DashboardWidget title="Quick Stats" icon={<Zap className="h-5 w-5" />} brandColor="blue">
    <div className="space-y-3">
      <div className="flex justify-between items-center py-2 border-b border-border/50">
        <span className="text-sm font-medium text-muted-foreground">Events</span>
        <span className="text-lg font-bold">{data.totalEvents || 0}</span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-border/50">
        <span className="text-sm font-medium text-muted-foreground">Meetings</span>
        <span className="text-lg font-bold">{data.upcomingMeetings || 0}</span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-sm font-medium text-muted-foreground">Polls</span>
        <span className="text-lg font-bold">{data.publishedPolls || 0}</span>
      </div>
    </div>
  </DashboardWidget>
);

// Export email analytics widgets
export { EmailsSentWidget } from "./EmailsSentWidget";
export { EmailsOpenedWidget } from "./EmailsOpenedWidget";
export { EmailClicksWidget } from "./EmailClicksWidget";

// Export new widgets
export { SignupSheetsWidget } from "./SignupSheetsWidget";
export { ClicksByTypeWidget } from "./ClicksByTypeWidget";
export { TopLinksWidget } from "./TopLinksWidget";
export { QuickActionsWidget } from "./QuickActionsWidget";
export { StreamAnalyticsWidget } from "./StreamAnalyticsWidget";
