import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Grid3x3,
  Calendar,
  CalendarDays,
  Users,
  Mic,
  Trophy,
  Clapperboard,
  Building2,
  Target,
  MessageSquare,
  ClipboardList,
  BarChart3,
  QrCode,
  Mail,
  Smartphone,
  User,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModuleLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Module {
  key: string;
  label: string;
  icon: any;
  route: string;
  enabledKey: string;
}

const ALL_MODULES: Module[] = [
  { key: "my_page", label: "My Page", icon: User, route: "/profile", enabledKey: "my_page" },
  { key: "ai_assistant", label: "AI Assistant", icon: Sparkles, route: "/ai-assistant", enabledKey: "ai_assistant" },
  { key: "meetings", label: "Meetings", icon: Calendar, route: "/meetings", enabledKey: "meetings" },
  { key: "events", label: "Events", icon: CalendarDays, route: "/events", enabledKey: "module_events_enabled" },
  { key: "signup_sheets", label: "Sign-up Sheets", icon: ClipboardList, route: "/signup-sheets", enabledKey: "module_signup_sheets_enabled" },
  { key: "polls", label: "Polls", icon: BarChart3, route: "/polls", enabledKey: "module_polls_enabled" },
  { key: "qr_codes", label: "QR Codes", icon: QrCode, route: "/qr-codes", enabledKey: "module_qr_codes_enabled" },
  { key: "contacts", label: "Contacts", icon: Users, route: "/contacts", enabledKey: "contacts" },
  { key: "podcasts", label: "Podcasts", icon: Mic, route: "/podcasts", enabledKey: "podcasts" },
  { key: "awards", label: "Awards", icon: Trophy, route: "/awards", enabledKey: "module_awards_enabled" },
  { key: "media", label: "Media", icon: Clapperboard, route: "/studio", enabledKey: "module_media_enabled" },
  { key: "civic", label: "Civic Tools", icon: Building2, route: "/civic-blog", enabledKey: "module_civic_enabled" },
  { key: "advertiser", label: "Advertiser", icon: Target, route: "/advertiser/dashboard", enabledKey: "module_advertiser_enabled" },
  { key: "team_chat", label: "Team Chat", icon: MessageSquare, route: "/team-chat", enabledKey: "module_team_chat_enabled" },
  { key: "marketing", label: "Email", icon: Mail, route: "/communication-history", enabledKey: "module_marketing_enabled" },
  { key: "sms", label: "SMS", icon: Smartphone, route: "/sms", enabledKey: "module_sms_enabled" },
];

export const ModuleLauncher = ({ open, onOpenChange }: ModuleLauncherProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadModulePreferences();
    }
  }, [open]);

  const loadModulePreferences = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const enabled: string[] = [];
      
      // Core apps - check if explicitly enabled (or enabled by default for meetings)
      if ((data as any).my_page_enabled === true) enabled.push("my_page");
      if ((data as any).ai_assistant_enabled === true) enabled.push("ai_assistant");
      if ((data as any).meetings_enabled !== false) enabled.push("meetings"); // Meetings is always enabled unless explicitly disabled
      if ((data as any).contacts_enabled === true) enabled.push("contacts");
      if ((data as any).podcasts_enabled === true) enabled.push("podcasts");
      
      // Optional apps
      if (data.module_events_enabled) enabled.push("events");
      if (data.module_signup_sheets_enabled) enabled.push("signup_sheets");
      if (data.module_polls_enabled) enabled.push("polls");
      if (data.module_qr_codes_enabled) enabled.push("qr_codes");
      if (data.module_awards_enabled) enabled.push("awards");
      if (data.module_media_enabled) enabled.push("media");
      if (data.module_civic_enabled) enabled.push("civic");
      if (data.module_advertiser_enabled) enabled.push("advertiser");
      if (data.module_team_chat_enabled) enabled.push("team_chat");
      if (data.module_marketing_enabled) enabled.push("marketing");
      if (data.module_sms_enabled) enabled.push("sms");

      setEnabledModules(enabled);
    }
    setIsLoading(false);
  };

  const handleModuleClick = (route: string) => {
    navigate(route);
    onOpenChange(false);
  };

  const availableModules = ALL_MODULES.filter(m => enabledModules.includes(m.key));

  const moduleColors = [
    "from-blue-500 via-blue-400 to-cyan-400",
    "from-purple-500 via-purple-400 to-pink-400",
    "from-orange-500 via-orange-400 to-red-400",
    "from-green-500 via-green-400 to-emerald-400",
    "from-yellow-500 via-yellow-400 to-amber-400",
    "from-indigo-500 via-indigo-400 to-blue-400",
    "from-pink-500 via-pink-400 to-rose-400",
    "from-teal-500 via-teal-400 to-cyan-400",
    "from-violet-500 via-violet-400 to-purple-400",
    "from-amber-500 via-amber-400 to-orange-400",
    "from-lime-500 via-lime-400 to-green-400",
    "from-sky-500 via-sky-400 to-blue-400",
    "from-fuchsia-500 via-fuchsia-400 to-pink-400",
    "from-rose-500 via-rose-400 to-red-400",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Active Apps
          </DialogTitle>
          <DialogDescription className="text-base">
            Select an app to open. Manage pins from the sidebar.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Seekies...</p>
            </div>
          </div>
        ) : availableModules.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Grid3x3 className="h-12 w-12 text-primary/50" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Add your first Seeky</h3>
              <p className="text-muted-foreground max-w-md">
                Visit Seekies in Account Settings to enable Seekies, then come back here to pin them to your sidebar (see All Seekies).
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-6">
              {availableModules.map((module, index) => {
                const Icon = module.icon;
                const gradientClass = moduleColors[index % moduleColors.length];

                return (
                  <Card
                    key={module.key}
                    className={cn(
                      "relative cursor-pointer transition-all hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 border-0 overflow-hidden group"
                    )}
                    onClick={() => handleModuleClick(module.route)}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-15", gradientClass)} />
                    <CardContent className="relative p-6 flex flex-col items-center gap-3">
                      <div className={cn("p-4 rounded-xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110", gradientClass)}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <span className="font-semibold text-center text-base">{module.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Button
                variant="link"
                className="w-full justify-center text-primary hover:text-primary/80"
                onClick={() => {
                  navigate("/integrations");
                  onOpenChange(false);
                }}
              >
                See all Seekies and Tools →
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};