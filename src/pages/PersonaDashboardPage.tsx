import { usePersonaType } from "@/hooks/usePersonaType";
import { PersonaDashboard } from "@/components/dashboard/persona";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function PersonaDashboardPage() {
  const { personaType, isLoading, userId } = usePersonaType();
  const navigate = useNavigate();

  useEffect(() => {
    // If no persona type is set, redirect to onboarding
    if (!isLoading && !personaType) {
      navigate("/onboarding");
    }
  }, [isLoading, personaType, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!personaType || !userId) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <PersonaDashboard personaType={personaType} userId={userId} />
    </div>
  );
}
