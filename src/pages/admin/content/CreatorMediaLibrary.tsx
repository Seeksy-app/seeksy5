import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Plus } from "lucide-react";

export default function CreatorMediaLibrary() {
  return (
    <div className="px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Folder className="h-8 w-8 text-primary" />
            Creator Media Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all creator media assets across the platform
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Overview</CardTitle>
          <CardDescription>Browse and manage creator media assets</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Folder className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Advanced media browser coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
