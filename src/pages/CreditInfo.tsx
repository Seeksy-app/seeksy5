import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreditCostList } from "@/components/credits/CreditCostList";

export default function CreditInfo() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Credit System</h1>
          <p className="text-muted-foreground">
            Understanding how credits work on Seeksy
          </p>
        </div>
      </div>

      <CreditCostList />
    </div>
  );
}
