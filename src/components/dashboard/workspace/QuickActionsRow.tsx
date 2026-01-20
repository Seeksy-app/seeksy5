import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Upload, 
  Mic, 
  Video, 
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const quickActions = [
  { 
    id: "start-meeting", 
    label: "+ Start Meeting Now", 
    icon: Video, 
    path: "/studio",
    gradient: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50",
    hoverBg: "hover:bg-emerald-100",
    iconColor: "text-emerald-600"
  },
  { 
    id: "meeting", 
    label: "Create Meeting", 
    icon: Calendar, 
    path: "/meetings/create",
    gradient: "from-sky-500 to-blue-500",
    bgColor: "bg-sky-50",
    hoverBg: "hover:bg-sky-100",
    iconColor: "text-sky-600"
  },
  { 
    id: "upload", 
    label: "Upload → AI Edit", 
    icon: Upload, 
    path: "/media/library",
    gradient: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50",
    hoverBg: "hover:bg-violet-100",
    iconColor: "text-violet-600"
  },
  { 
    id: "podcast", 
    label: "Create Episode", 
    icon: Mic, 
    path: "/podcasts/create",
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50",
    hoverBg: "hover:bg-orange-100",
    iconColor: "text-orange-600"
  },
  { 
    id: "spark", 
    label: "Ask Spark", 
    icon: Sparkles, 
    path: "#spark",
    gradient: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50",
    hoverBg: "hover:bg-yellow-100",
    iconColor: "text-yellow-600"
  },
];

export function QuickActionsRow() {
  const navigate = useNavigate();

  const handleAction = (action: typeof quickActions[0]) => {
    if (action.id === "spark") {
      document.dispatchEvent(new CustomEvent("open-spark-assistant"));
    } else {
      navigate(action.path);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={() => handleAction(action)}
              className={cn(
                "group relative overflow-hidden border-2 transition-all duration-200",
                "h-12 px-5 rounded-xl shadow-sm hover:shadow-lg",
                action.bgColor,
                action.hoverBg,
                "border-transparent hover:border-primary/20"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg mr-2.5 bg-gradient-to-br text-white",
                action.gradient
              )}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
