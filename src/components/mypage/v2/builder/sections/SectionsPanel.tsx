import { Label } from "@/components/ui/label";
import { MyPageTheme } from "@/config/myPageThemes";
import { SectionsManager } from "@/components/mypage-v2/SectionsManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SectionsPanelProps {
  theme: MyPageTheme;
  onUpdate: (theme: MyPageTheme) => void;
}

export function SectionsPanel({ theme, onUpdate }: SectionsPanelProps) {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Sections</h2>
        <p className="text-sm text-muted-foreground">
          Add, reorder, and configure your page sections
        </p>
      </div>

      <SectionsManager userId={user.id} />
    </div>
  );
}
