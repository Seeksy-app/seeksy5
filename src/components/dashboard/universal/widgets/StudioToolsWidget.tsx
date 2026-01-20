import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Upload, Scissors, FolderOpen } from "lucide-react";

export function StudioToolsWidget() {
  const navigate = useNavigate();

  const tools = [
    { label: "Create New Studio", icon: Video, path: "/studio", primary: true },
    { label: "Upload Media", icon: Upload, path: "/media/library" },
    { label: "Generate Clips", icon: Scissors, path: "/clips-studio" },
    { label: "Media Library", icon: FolderOpen, path: "/media/library" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tools.map((tool) => (
        <Button
          key={tool.label}
          variant={tool.primary ? "default" : "outline"}
          className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-center"
          onClick={() => navigate(tool.path)}
        >
          <tool.icon className="h-5 w-5" />
          <span className="text-xs font-medium">{tool.label}</span>
        </Button>
      ))}
    </div>
  );
}
