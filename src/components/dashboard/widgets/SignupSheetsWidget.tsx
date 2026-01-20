import { CalendarDays, ArrowRight } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { useNavigate } from "react-router-dom";

interface WidgetData {
  totalSignupSheets?: number;
}

export const SignupSheetsWidget = ({ data }: { data: WidgetData }) => {
  const navigate = useNavigate();
  
  return (
    <div onClick={() => navigate("/signup-sheets")} className="cursor-pointer">
      <DashboardWidget title="Sign-Up Sheets" icon={<CalendarDays className="h-5 w-5" />} brandColor="navy">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {data.totalSignupSheets?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Total sheets</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </DashboardWidget>
    </div>
  );
};
