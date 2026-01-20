import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTourMode } from "@/contexts/TourModeContext";

export function TourModeHeader() {
  const navigate = useNavigate();
  const { exitTourMode } = useTourMode();

  const handleBackToDashboard = () => {
    exitTourMode();
    navigate("/dashboard");
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToDashboard}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Seeksy
        </span>
      </div>
      
      <div className="w-[140px]" /> {/* Spacer for centering */}
    </header>
  );
}
