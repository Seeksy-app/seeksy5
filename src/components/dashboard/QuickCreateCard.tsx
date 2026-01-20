import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Upload, Shield, Mic, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const quickActions = [
  {
    icon: Scissors,
    label: "Create Clip",
    route: "/media/create-clips",
    gradient: "from-pink-500 to-rose-500",
    bgLight: "hsl(330, 80%, 96%)",
  },
  {
    icon: Upload,
    label: "Upload Media",
    route: "/media/library",
    gradient: "from-purple-500 to-violet-500",
    bgLight: "hsl(270, 80%, 96%)",
  },
  {
    icon: Shield,
    label: "Verify Face",
    route: "/identity",
    gradient: "from-green-500 to-emerald-500",
    bgLight: "hsl(142, 70%, 96%)",
  },
  {
    icon: Mic,
    label: "Verify Voice",
    route: "/my-voice-identity",
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "hsl(200, 90%, 96%)",
  },
];

export const QuickCreateCard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card border-dashed border-2">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white shadow-md">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-lg">Quick Create</span>
          </CardTitle>
          <CardDescription>Start creating instantly</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Button 
                    onClick={() => navigate(action.route)}
                    variant="outline"
                    className="h-auto w-full flex-col gap-2 py-4 border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 bg-card group/btn"
                  >
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-105 transition-all duration-200`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                </motion.div>
              );
            })}
            
            {/* Book with Mia - Full width */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="col-span-2"
            >
              <Button 
                onClick={() => navigate("/meetings")}
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-4 border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 bg-card group/btn"
              >
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-105 transition-all duration-200">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Book with Mia</span>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};