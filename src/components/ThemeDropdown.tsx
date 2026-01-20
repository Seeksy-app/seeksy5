import { useEffect, useState } from "react";
import { Sun, Moon, SunMoon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const handleThemeChange = async (newTheme: string) => {
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
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case "dark":
        return <SunMoon className="h-4 w-4" />;
      case "midnight":
        return <Moon className="h-4 w-4 text-indigo-400" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
        <DropdownMenuItem 
          onClick={() => handleThemeChange("light")}
          className={cn("gap-2 cursor-pointer", theme === "light" && "bg-accent")}
        >
          <Sun className="h-4 w-4 text-yellow-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("dark")}
          className={cn("gap-2 cursor-pointer", theme === "dark" && "bg-accent")}
        >
          <SunMoon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("midnight")}
          className={cn("gap-2 cursor-pointer", theme === "midnight" && "bg-accent")}
        >
          <Moon className="h-4 w-4 text-indigo-400" />
          <span>Midnight</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("system")}
          className={cn("gap-2 cursor-pointer", theme === "system" && "bg-accent")}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
