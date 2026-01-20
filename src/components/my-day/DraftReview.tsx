import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function DraftReview() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(45,100%,92%)]">
            <FileText className="h-5 w-5 text-[hsl(45,90%,40%)]" />
          </div>
          Email Draft Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Empty state with colored icon */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-[hsl(217,90%,97%)]">
            <div className="p-3 rounded-full bg-[hsl(217,90%,92%)]">
              <Mail className="h-8 w-8 text-[hsl(217,90%,60%)] opacity-60" />
            </div>
            <p className="text-sm text-muted-foreground">No draft emails to review</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/email/drafts">View All Drafts</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}