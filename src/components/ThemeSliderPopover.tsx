import { useEffect, useState } from "react";
import { Sun, SunMedium, Moon, CloudMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ThemeLevel = 'light' | 'dark' | 'midnight' | 'system';

const THEME_OPTIONS: { theme: ThemeLevel; icon: typeof Sun; label: string }[] = [
  { theme: 'light', icon: Sun, label: 'Light' },
  { theme: 'dark', icon: SunMedium, label: 'Dark' },
  { theme: 'midnight', icon: CloudMoon, label: 'Midnight' },
  { theme: 'system', icon: Moon, label: 'System' },
];

export function ThemeSliderPopover() {
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const handleThemeSelect = async (newTheme: ThemeLevel) => {
    setTheme(newTheme);
    setIsOpen(false);

    if (userId) {
      await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          theme_preference: newTheme,
        }, {
          onConflict: 'user_id'
        });
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case "dark":
        return <SunMedium className="h-4 w-4 text-orange-400" />;
      case "midnight":
        return <CloudMoon className="h-4 w-4 text-indigo-400" />;
      default:
        return <Moon className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-auto p-2 bg-popover border shadow-lg z-50"
        side="bottom"
      >
        <div className="flex flex-col gap-1">
          {THEME_OPTIONS.map(({ theme: themeOption, icon: Icon, label }) => (
            <button
              key={themeOption}
              onClick={() => handleThemeSelect(themeOption)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full text-left",
                theme === themeOption 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                theme === themeOption && themeOption === 'light' && "text-yellow-500",
                theme === themeOption && themeOption === 'dark' && "text-orange-400",
                theme === themeOption && themeOption === 'midnight' && "text-indigo-400",
                theme === themeOption && themeOption === 'system' && "text-slate-400",
                theme !== themeOption && "text-muted-foreground"
              )} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}