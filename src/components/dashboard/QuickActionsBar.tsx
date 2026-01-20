import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CalendarPlus, 
  Upload, 
  Mic, 
  Video, 
  Sparkles,
  ArrowRight
} from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  gradient?: string;
}

export const QuickActionsBar = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      icon: <CalendarPlus className="h-4 w-4" />,
      label: "Create Meeting",
      onClick: () => navigate("/meetings/create"),
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: <Upload className="h-4 w-4" />,
      label: "Upload → AI Edit",
      onClick: () => navigate("/media-library"),
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: <Mic className="h-4 w-4" />,
      label: "Create Episode",
      onClick: () => navigate("/podcasts"),
      gradient: "from-pink-500 to-pink-600",
    },
    {
      icon: <Video className="h-4 w-4" />,
      label: "Launch Studio",
      onClick: () => navigate("/studio"),
      gradient: "from-orange-500 to-orange-600",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: "Ask Spark",
      onClick: () => {
        const event = new CustomEvent("open-spark-chat");
        window.dispatchEvent(event);
      },
      gradient: "from-cyan-500 to-cyan-600",
    },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="group relative overflow-hidden gap-2 bg-card hover:bg-card hover:shadow-md transition-all duration-200 border-border/50"
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br ${action.gradient} text-white`}>
                {action.icon}
              </span>
              <span className="font-medium">{action.label}</span>
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
