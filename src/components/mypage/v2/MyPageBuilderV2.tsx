import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { MyPageTheme, defaultTheme } from "@/config/myPageThemes";
import { BuilderSidebar } from "./builder/BuilderSidebar";
import { PreviewPane } from "./builder/PreviewPane";

export default function MyPageBuilderV2() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<MyPageTheme>(defaultTheme);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    loadThemeData();
  }, []);

  const loadThemeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const p = profile as any;
        // Load theme from my_page_v2_theme or construct from existing fields
        if (p.my_page_v2_theme) {
          setTheme(p.my_page_v2_theme as unknown as MyPageTheme);
        } else {
          setTheme(prev => ({
            ...prev,
            displayName: p.account_full_name || p.full_name || "",
            username: p.username || "",
            bio: p.bio || "",
            profileImage: p.account_avatar_url || p.avatar_url || null,
            backgroundColor: p.page_background_color || "#ffffff",
            themeColor: p.theme_color || "#3b82f6",
          }));
        }
      }
    } catch (error) {
      console.error("Error loading theme data:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save changes");
        return;
      }

      // Save full theme configuration to my_page_v2_theme
      await supabase
        .from("profiles")
        .update({
          my_page_v2_theme: theme as any,
          // Also update legacy fields for backward compatibility
          account_full_name: theme.displayName,
          username: theme.username,
          bio: theme.bio,
          account_avatar_url: theme.profileImage,
          page_background_color: theme.backgroundColor,
          theme_color: theme.themeColor,
        })
        .eq("id", user.id);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("My Page saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card shrink-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Page Builder</h1>
              <p className="text-muted-foreground text-sm">Create your perfect profile</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <BuilderSidebar theme={theme} onThemeChange={setTheme} />
        <PreviewPane
          theme={theme}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          mode={previewMode}
          onModeChange={setPreviewMode}
        />
      </div>
    </div>
  );
}
