import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function EmailDrafts() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Draft Emails
            </CardTitle>
            <CardDescription>
              Continue working on your unfinished email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Drafts</h3>
              <p className="text-muted-foreground max-w-md">
                Save incomplete campaigns as drafts to finish them later. They'll appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
