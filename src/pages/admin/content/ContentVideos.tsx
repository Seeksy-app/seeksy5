import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Plus } from "lucide-react";

export default function ContentVideos() {
  return (
    <div className="px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            Videos
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all video content across the platform
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Management</CardTitle>
          <CardDescription>Browse and manage video content</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Video className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Video management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
