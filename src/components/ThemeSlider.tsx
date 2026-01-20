import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function ThemeSlider() {
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [value, setValue] = useState(getValueFromTheme(theme));

  function getValueFromTheme(t: string | undefined): number {
    switch (t) {
      case "light": return 0;
      case "dark": return 50;
      case "midnight": return 100;
      default: return 0;
    }
  }

  function getThemeFromValue(v: number): string {
    if (v <= 25) return "light";
    if (v <= 75) return "dark";
    return "midnight";
  }

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    setValue(getValueFromTheme(theme));
  }, [theme]);

  const handleValueChange = async (newValue: number[]) => {
    const v = newValue[0];
    setValue(v);
    const newTheme = getThemeFromValue(v);
    
    if (newTheme !== theme) {
      setTheme(newTheme);

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
    }
  };

  return (
    <div className="flex items-center gap-2 px-2">
      <Sun className={cn(
        "h-4 w-4 transition-colors",
        value <= 25 ? "text-yellow-500" : "text-muted-foreground"
      )} />
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        max={100}
        step={1}
        className="w-20"
      />
      <Moon className={cn(
        "h-4 w-4 transition-colors",
        value >= 50 ? "text-primary" : "text-muted-foreground"
      )} />
    </div>
  );
}
