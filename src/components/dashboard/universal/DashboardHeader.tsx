import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getGreetingByTime, 
  getTimeOfDay, 
  getMoodGradient, 
  getCurrentSeason,
  getPersonalizedInsights,
  type TimeOfDay 
} from "@/utils/greetingHelpers";
import { useWeather } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";
import { getDashboardTitle, getDashboardSubtitle } from "@/utils/dashboardTitles";
import { PersonaType } from "@/config/personaConfig";

interface DashboardHeaderProps {
  firstName: string;
  onAddWidgets: () => void;
  personaType?: PersonaType | null;
}

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
        {weather.temp}°F in {weather.location}
      </span>
    </motion.div>
  );
}

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
  return null;
}

export function DashboardHeader({ firstName, onAddWidgets, personaType }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState(getGreetingByTime());
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [moodGradient, setMoodGradient] = useState(getMoodGradient());
  const season = getCurrentSeason();

  const dashboardTitle = useMemo(() => getDashboardTitle(personaType), [personaType]);
  const dashboardSubtitle = useMemo(() => getDashboardSubtitle(personaType), [personaType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreetingByTime());
      setTimeOfDay(getTimeOfDay());
      setMoodGradient(getMoodGradient());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const insight = useMemo(() => {
    const insights = getPersonalizedInsights({});
    return insights[0];
  }, []);

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
      className="relative overflow-hidden rounded-2xl mb-6"
      style={gradientStyle}
    >
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

      <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Dynamic Dashboard Title */}
            <p className={cn(
              "text-xs font-medium uppercase tracking-wide opacity-80",
              timeOfDay === 'night' ? 'text-white/70' : 'text-foreground/70'
            )}>
              {dashboardTitle}
            </p>
            
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
            <WeatherDisplay />
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
          </div>

          <Button
            onClick={onAddWidgets}
            data-tooltip="add-widgets"
            className={cn(
              "gap-2 shrink-0",
              timeOfDay === 'night' 
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                : ''
            )}
          >
            <Plus className="h-4 w-4" />
            Add Widgets
          </Button>
        </div>
      </div>

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
