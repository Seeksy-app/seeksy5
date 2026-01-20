import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  featureName: string;
  description?: string;
  backRoute?: string;
  backLabel?: string;
}

export function ComingSoon({ 
  featureName, 
  description = "This feature is currently under development.", 
  backRoute = "/content",
  backLabel = "Back to Content & Media"
}: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{featureName}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We're working hard to bring you this feature. Check back soon for updates!
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(backRoute)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate("/my-day")}
            >
              Go to My Day
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
