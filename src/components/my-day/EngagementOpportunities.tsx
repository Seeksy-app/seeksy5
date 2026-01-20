import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkIcon } from "@/components/spark/SparkIcon";

export function EngagementOpportunities() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(270,80%,95%)]">
            <TrendingUp className="h-5 w-5 text-[hsl(270,70%,50%)]" />
          </div>
          Top Engagement Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Spark suggestion card with yellow glow */}
          <div className="flex items-center gap-3 p-4 bg-[hsl(45,100%,96%)] rounded-lg border border-[hsl(45,90%,80%)] shadow-[0_0_12px_hsl(45,100%,85%)]">
            <SparkIcon size={32} />
            <div className="flex-1">
              <p className="text-sm font-medium">Let Spark analyze your contacts</p>
              <p className="text-xs text-muted-foreground">Find who to reach out to today</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full hover:bg-[hsl(45,100%,97%)] hover:border-[hsl(45,90%,70%)] transition-all">
            <SparkIcon size={16} className="mr-2" />
            Ask Spark for Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}