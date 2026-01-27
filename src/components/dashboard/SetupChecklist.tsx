import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  route: string;
  checkFn: (userId: string) => Promise<boolean>;
}

interface SetupChecklistProps {
  userId: string;
  accountType: string;
}

const baseChecklist: ChecklistItem[] = [
  {
    id: "social",
    label: "Connect social accounts",
    description: "Link Instagram, YouTube, or TikTok",
    route: "/integrations",
    checkFn: async (userId) => {
      const result = await (supabase as any)
        .from("social_media_profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return (result.count || 0) > 0;
    },
  },
  {
    id: "profile",
    label: "Complete your profile",
    description: "Add name, bio, and photo",
    route: "/profile/edit",
    checkFn: async (userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("account_full_name, bio, account_avatar_url")
        .eq("id", userId)
        .single();
      return !!(data?.account_full_name && data?.bio);
    },
  },
  {
    id: "landing",
    label: "Publish your landing page",
    description: "Make your page live",
    route: "/profile/edit",
    checkFn: async (userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      // Consider landing page "published" if they have a username set
      return !!(data?.username && data.username.length > 0);
    },
  },
];

const typeSpecificChecklist: Record<string, ChecklistItem[]> = {
  podcaster: [
    {
      id: "podcast",
      label: "Create your first podcast",
      description: "Set up your show",
      route: "/podcasts/create",
      checkFn: async (userId) => {
        const { count } = await supabase
          .from("podcasts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        return (count || 0) > 0;
      },
    },
    {
      id: "episode",
      label: "Record your first episode",
      description: "Use the studio to record",
      route: "/studio",
      checkFn: async (userId) => {
        const { data: podcasts } = await supabase
          .from("podcasts")
          .select("id")
          .eq("user_id", userId);
        if (!podcasts?.length) return false;
        const { count } = await supabase
          .from("episodes")
          .select("*", { count: "exact", head: true })
          .in("podcast_id", podcasts.map(p => p.id));
        return (count || 0) > 0;
      },
    },
  ],
  creator: [
    {
      id: "clip",
      label: "Create your first clip",
      description: "Generate a shareable clip",
      route: "/clips",
      checkFn: async (userId) => {
        const { count } = await supabase
          .from("clips")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        return (count || 0) > 0;
      },
    },
    {
      id: "media",
      label: "Upload media",
      description: "Add to your library",
      route: "/media/library",
      checkFn: async (userId) => {
        const { count } = await supabase
          .from("media_files")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        return (count || 0) > 0;
      },
    },
  ],
  event_planner: [
    {
      id: "event",
      label: "Create your first event",
      description: "Set up an event page",
      route: "/events/create",
      checkFn: async (userId) => {
        const { count } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        return (count || 0) > 0;
      },
    },
    {
      id: "booking",
      label: "Set up booking",
      description: "Create a booking link",
      route: "/meetings/types/create",
      checkFn: async (userId) => {
        const result = await (supabase as any)
          .from("meeting_types")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        return (result.count || 0) > 0;
      },
    },
  ],
  advertiser: [
    {
      id: "campaign",
      label: "Launch your first campaign",
      description: "Create an ad campaign",
      route: "/advertiser/campaigns/create",
      checkFn: async (userId) => {
        const { data: advertiser } = await supabase
          .from("advertisers")
          .select("id")
          .eq("owner_profile_id", userId)
          .single();
        if (!advertiser) return false;
        const { count } = await supabase
          .from("ad_campaigns")
          .select("*", { count: "exact", head: true })
          .eq("advertiser_id", advertiser.id);
        return (count || 0) > 0;
      },
    },
  ],
  agency: [
    {
      id: "contacts",
      label: "Import contacts",
      description: "Add your creator network",
      route: "/audience",
      checkFn: async (userId) => {
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        return (count || 0) > 5;
      },
    },
  ],
};

export function SetupChecklist({ userId, accountType }: SetupChecklistProps) {
  const navigate = useNavigate();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const checklist = [
    ...baseChecklist,
    ...(typeSpecificChecklist[accountType] || typeSpecificChecklist.creator || []),
  ];

  useEffect(() => {
    async function checkItems() {
      setLoading(true);
      const completed = new Set<string>();
      
      for (const item of checklist) {
        try {
          const isComplete = await item.checkFn(userId);
          if (isComplete) completed.add(item.id);
        } catch (e) {
          console.error(`Error checking ${item.id}:`, e);
        }
      }
      
      setCompletedItems(completed);
      setLoading(false);
    }
    
    checkItems();
  }, [userId, accountType]);

  const progress = (completedItems.size / checklist.length) * 100;
  const isAllComplete = completedItems.size === checklist.length;

  if (isAllComplete && !loading) {
    return null; // Hide when complete
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Complete your setup</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {completedItems.size} of {checklist.length} tasks complete
          </p>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {Math.round(progress)}%
        </div>
      </div>
      
      <Progress value={progress} className="h-1.5 mb-5" />
      
      <div className="space-y-1">
        {checklist.map((item) => {
          const isComplete = completedItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => !isComplete && navigate(item.route)}
              disabled={isComplete}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                isComplete 
                  ? "bg-muted/30 cursor-default" 
                  : "hover:bg-muted/50 cursor-pointer"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                isComplete 
                  ? "bg-emerald-500 text-white" 
                  : "border-2 border-muted-foreground/30"
              )}>
                {isComplete && <Check className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  isComplete ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              {!isComplete && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
