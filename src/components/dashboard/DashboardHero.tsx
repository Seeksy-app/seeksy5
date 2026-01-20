import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getGreetingByTime, 
  getTimeOfDay, 
  getMoodGradient, 
  getCurrentSeason,
  getPersonalizedInsights,
  getAttentionItems,
  type TimeOfDay 
} from "@/utils/greetingHelpers";
import { useWeather } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  firstName: string;
  onCustomizeDashboard: () => void;
  onCustomizeNav: () => void;
  stats?: {
    drafts?: number;
    newSubscribers?: number;
    pendingMeetings?: number;
    clipsReady?: number;
    lastEpisodePerformance?: 'good' | 'average' | 'poor';
    peakActivityTime?: string;
    identityCompletion?: number;
    unreadMessages?: number;
  };
}

// Seasonal decorations component
function SeasonalAccent({ season }: { season: string }) {
  if (season === 'holiday') {
    return (
      <motion.span 
        className="inline-block ml-2"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        ✨
      </motion.span>
    );
  }
  
  if (season === 'autumn') {
    return (
      <motion.span 
        className="inline-block ml-2 opacity-60"
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🍂
      </motion.span>
    );
  }
  
  return null;
}

// Animated mascot star
function MascotStar({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const starColors: Record<TimeOfDay, string> = {
    morning: 'text-amber-400',
    afternoon: 'text-blue-400',
    evening: 'text-purple-400',
    night: 'text-indigo-300',
  };

  return (
    <motion.div
      className={cn("inline-flex items-center justify-center", starColors[timeOfDay])}
      animate={{ 
        scale: [1, 1.05, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Sparkles className="h-6 w-6" />
    </motion.div>
  );
}

// Weather display component
function WeatherDisplay() {
  const { weather, loading, error } = useWeather();

  if (loading || error || !weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <motion.span
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {weather.icon}
      </motion.span>
      <span>
        {weather.temp}°F and {weather.condition.toLowerCase()} in {weather.location}
      </span>
    </motion.div>
  );
}

// Attention pill component
function AttentionPill({ label, type }: { label: string; type: string }) {
  const typeStyles = {
    task: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    notification: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
    reminder: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        typeStyles[type as keyof typeof typeStyles] || typeStyles.task
      )}
    >
      {label}
    </motion.span>
  );
}

export function DashboardHero({ 
  firstName, 
  onCustomizeDashboard, 
  onCustomizeNav,
  stats 
}: DashboardHeroProps) {
  const [greeting, setGreeting] = useState(getGreetingByTime());
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [moodGradient, setMoodGradient] = useState(getMoodGradient());
  const season = getCurrentSeason();

  // Update greeting periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreetingByTime());
      setTimeOfDay(getTimeOfDay());
      setMoodGradient(getMoodGradient());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Get personalized content
  const insight = useMemo(() => {
    const insights = getPersonalizedInsights(stats);
    return insights[0];
  }, [stats]);

  const attentionItems = useMemo(() => {
    return getAttentionItems(stats);
  }, [stats]);

  // Dynamic gradient style for the mood background
  const gradientStyle = useMemo(() => {
    const isNight = timeOfDay === 'night';
    return {
      background: `linear-gradient(135deg, ${moodGradient.from} 0%, ${moodGradient.to} 100%)`,
      color: isNight ? 'hsl(210, 40%, 98%)' : undefined,
    };
  }, [moodGradient, timeOfDay]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl mb-8"
      style={gradientStyle}
    >
      {/* Subtle animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            `radial-gradient(circle at 20% 50%, ${moodGradient.accent}20 0%, transparent 50%)`,
            `radial-gradient(circle at 80% 50%, ${moodGradient.accent}20 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 50%, ${moodGradient.accent}20 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left: Greeting section */}
          <div className="space-y-3">
            {/* Main greeting */}
            <div className="flex items-center gap-3">
              <MascotStar timeOfDay={timeOfDay} />
              <h1 className={cn(
                "text-2xl sm:text-3xl font-semibold tracking-tight",
                timeOfDay === 'night' ? 'text-white' : 'text-foreground'
              )}>
                {greeting}{firstName ? `, ${firstName}` : ""}
                <SeasonalAccent season={season} />
              </h1>
            </div>

            {/* Weather display */}
            <WeatherDisplay />

            {/* Personalized insight */}
            <AnimatePresence mode="wait">
              <motion.p
                key={insight}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "text-sm",
                  timeOfDay === 'night' ? 'text-white/70' : 'text-muted-foreground'
                )}
              >
                {insight}
              </motion.p>
            </AnimatePresence>

            {/* Attention pills */}
            {attentionItems.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attentionItems.map((item) => (
                  <AttentionPill key={item.id} label={item.label} type={item.type} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Action button - icon only */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCustomizeDashboard}
              title="Customize Dashboard"
              className={cn(
                "h-8 w-8",
                timeOfDay === 'night' 
                  ? 'text-white/70 hover:text-white hover:bg-white/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Holiday snow effect (very subtle) */}
      {season === 'holiday' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{ left: `${15 + i * 15}%` }}
              animate={{
                y: ['-10%', '110%'],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
