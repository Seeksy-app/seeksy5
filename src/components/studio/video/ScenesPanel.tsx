import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3x3, Users, User, Eye, LayoutGrid } from "lucide-react";
import { useState } from "react";

type SceneLayout = "host-only" | "host-guest" | "side-by-side" | "grid" | "speaker";

export const ScenesPanel = () => {
  const [activeLayout, setActiveLayout] = useState<SceneLayout>("host-only");

  const layouts = [
    {
      id: "host-only" as const,
      name: "Host Only",
      icon: User,
      description: "Single host view",
    },
    {
      id: "host-guest" as const,
      name: "Host + Guest",
      icon: Users,
      description: "Host and one guest",
    },
    {
      id: "side-by-side" as const,
      name: "Side-by-Side",
      icon: LayoutGrid,
      description: "Equal split view",
    },
    {
      id: "grid" as const,
      name: "Grid",
      icon: Grid3x3,
      description: "Multiple participants",
    },
    {
      id: "speaker" as const,
      name: "Speaker View",
      icon: Eye,
      description: "Active speaker focus",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Scenes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {layouts.map((layout) => (
          <Button
            key={layout.id}
            variant={activeLayout === layout.id ? "default" : "outline"}
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => setActiveLayout(layout.id)}
          >
            <layout.icon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">{layout.name}</div>
              <div className="text-xs opacity-80">{layout.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
