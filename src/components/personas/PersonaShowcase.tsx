import { PersonaCard } from "./PersonaCard";
import { PersonaModal } from "./PersonaModal";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Persona {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags?: { icon: string; label: string }[];
}

export const PersonaShowcase = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const { data: personas, isLoading } = useQuery({
    queryKey: ["ai-personas-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_personas")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading personas:", error);
        toast.error("Failed to load AI personas");
        throw error;
      }

      // Transform database personas to component format
      return data.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        tagline: p.tagline,
        description: p.description,
        videoUrl: p.video_url,
        thumbnailUrl: p.thumbnail_url || undefined,
        tags: [], // Can be populated from metadata if needed
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="w-full py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Your AI Assistants
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interactive AI personas designed to guide you through Seeksy's
              powerful features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <div className="w-full py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Your AI Assistants
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interactive AI personas designed to guide you through Seeksy's
              powerful features
            </p>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">AI personas coming soon! Check back tomorrow.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Your AI Assistants
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive AI personas designed to guide you through Seeksy's
            powerful features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {personas.map((persona) => (
            <PersonaCard 
              key={persona.id} 
              {...persona} 
              onSelect={() => setSelectedPersona(persona)}
            />
          ))}
        </div>

        <PersonaModal
          open={!!selectedPersona}
          onClose={() => setSelectedPersona(null)}
          persona={selectedPersona}
        />
      </div>
    </div>
  );
};
