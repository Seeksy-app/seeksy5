import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TourModeHeader } from "./TourModeHeader";

interface TourModeWrapperProps {
  children: ReactNode;
}

export function TourModeWrapper({ children }: TourModeWrapperProps) {
  const location = useLocation();
  const [isTourMode, setIsTourMode] = useState(false);

  useEffect(() => {
    const state = location.state as { fromOnboarding?: boolean } | null;
    const storedTourMode = sessionStorage.getItem("tourMode");
    
    if (state?.fromOnboarding) {
      setIsTourMode(true);
      sessionStorage.setItem("tourMode", "true");
    } else if (storedTourMode === "true") {
      setIsTourMode(true);
    } else {
      setIsTourMode(false);
    }
  }, [location.pathname, location.state]);

  if (!isTourMode) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TourModeHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
