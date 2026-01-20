import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Grid3X3 } from "lucide-react";

interface AppsViewToggleProps {
  value: "bundles" | "individual";
  onValueChange: (value: "bundles" | "individual") => void;
  className?: string;
}

/**
 * Toggle between App Bundles view and Individual Seekies (All Modules) view.
 * Default is Individual Seekies (All Modules).
 */
export function AppsViewToggle({ value, onValueChange, className }: AppsViewToggleProps) {
  return (
    <Tabs 
      value={value} 
      onValueChange={(v) => onValueChange(v as "bundles" | "individual")} 
      className={className}
    >
      <TabsList className="grid grid-cols-2 w-[280px] h-10">
        <TabsTrigger 
          value="individual" 
          className="flex items-center gap-2 text-sm"
        >
          <Grid3X3 className="h-4 w-4" />
          All Modules
        </TabsTrigger>
        <TabsTrigger 
          value="bundles" 
          className="flex items-center gap-2 text-sm"
        >
          <Layers className="h-4 w-4" />
          App Bundles
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
