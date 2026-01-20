import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

interface DashboardWidgetProps {
  title: string | ReactNode;
  icon: ReactNode;
  children: ReactNode;
  isDragging?: boolean;
  brandColor?: "gold" | "blue" | "navy" | "red";
}

export const DashboardWidget = ({ title, icon, children, isDragging, brandColor }: DashboardWidgetProps) => {
  const brandColorClasses = {
    gold: "hover:border-brand-gold/30 bg-gradient-to-br from-card via-card to-brand-gold/5 hover:shadow-soft",
    blue: "hover:border-brand-blue/30 bg-gradient-to-br from-card via-card to-brand-blue/5 hover:shadow-soft",
    navy: "hover:border-brand-navy/30 bg-gradient-to-br from-card via-card to-brand-navy/5 hover:shadow-soft",
    red: "hover:border-brand-red/30 bg-gradient-to-br from-card via-card to-brand-red/5 hover:shadow-soft",
  };

  const iconColorClasses = {
    gold: "text-brand-gold drop-shadow-sm",
    blue: "text-brand-blue drop-shadow-sm",
    navy: "text-brand-navy drop-shadow-sm",
    red: "text-brand-red drop-shadow-sm",
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg border-border/50 ${isDragging ? "opacity-50 scale-95" : ""} ${brandColor ? brandColorClasses[brandColor] : "hover:shadow-soft"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2.5">
          <span className={brandColor ? iconColorClasses[brandColor] : "text-muted-foreground"}>
            {icon}
          </span>
          {title}
        </CardTitle>
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing transition-colors hover:text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2">
        {children}
      </CardContent>
    </Card>
  );
};
