import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminProjects() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/admin/tasks" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Tasks
      </Link>
      
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FolderKanban className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Projects</CardTitle>
          <CardDescription className="text-base">
            Organize your work with projects and milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-medium">Coming Soon</span>
          </div>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            We're building a powerful project management system to help you organize tasks, 
            track milestones, and collaborate with your team more effectively.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">Project Boards</h4>
              <p className="text-sm text-muted-foreground">Kanban-style project views</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">Milestones</h4>
              <p className="text-sm text-muted-foreground">Track progress and deadlines</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">Team Collaboration</h4>
              <p className="text-sm text-muted-foreground">Work together seamlessly</p>
            </div>
          </div>
          
          <Button variant="outline" asChild className="mt-4">
            <Link to="/admin/tasks">
              Use Tasks for Now
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
