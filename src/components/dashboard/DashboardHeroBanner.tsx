import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeroBannerProps {
  firstName: string;
  avatarUrl: string | null;
  fullName: string;
  onCustomize?: () => void;
}

export const DashboardHeroBanner = ({
  firstName,
  avatarUrl,
  fullName,
  onCustomize,
}: DashboardHeroBannerProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl mb-8">
      {/* Gradient Background with animated orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
      
      {/* Animated decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl translate-y-1/2" />
      
      {/* Decorative illustrations (SVG pattern) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block">
        <svg width="300" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Abstract shapes */}
          <circle cx="50" cy="75" r="30" className="fill-primary/40" />
          <rect x="100" y="45" width="60" height="60" rx="12" className="fill-purple-500/40" transform="rotate(15 130 75)" />
          <polygon points="220,30 250,90 190,90" className="fill-pink-500/40" />
          <circle cx="270" cy="120" r="20" className="fill-orange-500/40" />
        </svg>
      </div>
      
      <div className="relative z-10 px-8 py-10 flex items-center gap-6">
        {/* Avatar with ring effect */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-md opacity-40 scale-110" />
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg relative">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-purple-500 text-white">
                {fullName?.charAt(0) || firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Greeting text */}
        <div className="flex-1">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-3 mb-1"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold">
              <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {getGreeting()}, {firstName || "there"}!
              </span>
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Here's what's happening across your shows, campaigns, and events today.
          </motion.p>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="hidden md:flex items-center gap-3"
        >
          <Button variant="outline" size="sm" className="gap-2 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
            <CalendarDays className="h-4 w-4" />
            Daily Brief
          </Button>
          {onCustomize && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
              onClick={onCustomize}
            >
              <Settings className="h-4 w-4" />
              Customize
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
