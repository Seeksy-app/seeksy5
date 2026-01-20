import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function EmailScheduled() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Emails
            </CardTitle>
            <CardDescription>
              View and manage your scheduled email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scheduled Emails</h3>
              <p className="text-muted-foreground max-w-md">
                Schedule campaigns to send at specific times. They'll appear here until they're sent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
