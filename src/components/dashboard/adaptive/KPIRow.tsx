import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, TrendingUp, Globe, DollarSign, Download, MapPin, 
  Clock, BarChart3, UserCheck, Briefcase 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KPIConfig } from "@/config/dashboardConfig";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  TrendingUp,
  Globe,
  DollarSign,
  Download,
  MapPin,
  Clock,
  BarChart3,
  UserCheck,
  Briefcase,
};

interface KPIRowProps {
  kpis: KPIConfig[];
  data: Record<string, number | string>;
}

export function KPIRow({ kpis, data }: KPIRowProps) {
  const formatValue = (value: number | string, format: KPIConfig["format"]) => {
    if (typeof value === "string") return value;
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(value);
      case "percent":
        return `${value.toFixed(1)}%`;
      case "number":
      default:
        return new Intl.NumberFormat("en-US", {
          notation: value >= 10000 ? "compact" : "standard",
          maximumFractionDigits: 1,
        }).format(value);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = iconMap[kpi.icon] || TrendingUp;
        const value = data[kpi.dataKey] ?? 0;
        
        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold">
                      {formatValue(value, kpi.format)}
                    </p>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg",
                    kpi.format === "currency" ? "bg-emerald-500/10" : "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      kpi.format === "currency" ? "text-emerald-600" : "text-primary"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
