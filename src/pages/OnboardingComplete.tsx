import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Upload, Scissors, Sparkles, CheckCircle, ArrowLeft } from "lucide-react";

export default function OnboardingComplete() {
  const navigate = useNavigate();

  const quickActions = [
    {
      label: "Create Your First Studio",
      description: "Start recording video or audio",
      icon: Video,
      path: "/studio",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      label: "Upload Media",
      description: "Add existing content to your library",
      icon: Upload,
      path: "/media/library",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Generate Clips",
      description: "Turn a video into social clips",
      icon: Scissors,
      path: "/studio/clips",
      gradient: "from-pink-500 to-rose-500",
    },
  ];

  const handleActionClick = (path: string) => {
    navigate(path, { state: { fromOnboarding: true } });
  };

  const handleBackToDashboard = () => {
    sessionStorage.removeItem("tourMode");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Minimal Tour Header */}
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Seeksy
          </span>
        </div>
        
        <div className="w-[140px]" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-border/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
              >
                <CheckCircle className="h-10 w-10 text-primary" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-3"
              >
                You're All Set! 🎉
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg"
              >
                Your workspace is ready. What would you like to do first?
              </motion.p>
            </div>

            <CardContent className="p-6 sm:p-8">
              <div className="grid gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <button
                      onClick={() => handleActionClick(action.path)}
                      className="w-full p-5 rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all text-left group bg-card hover:bg-accent/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                          <action.icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{action.label}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        <Sparkles className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-6 pt-6 border-t text-center"
              >
                <Button
                  variant="ghost"
                  onClick={handleBackToDashboard}
                  className="text-muted-foreground"
                >
                  Skip and go to Dashboard
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
