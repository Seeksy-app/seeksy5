import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, Copy, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Forms() {
  const navigate = useNavigate();

  const { data: forms, isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const copyFormLink = (formSlug: string, trackingCode?: string) => {
    const baseUrl = window.location.origin;
    const url = trackingCode 
      ? `${baseUrl}/f/${formSlug}?agent=${trackingCode}`
      : `${baseUrl}/f/${formSlug}`;
    
    navigator.clipboard.writeText(url);
    toast.success("Form link copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Forms</h1>
            <p className="text-muted-foreground mt-1">
              Create custom forms to capture leads and track submissions
            </p>
          </div>
          <Button onClick={() => navigate("/forms/create")} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Form
          </Button>
        </div>

        {/* Forms Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading forms...</p>
          </div>
        ) : forms && forms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{form.form_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {form.description || "No description"}
                      </CardDescription>
                    </div>
                    {!form.is_active && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">{form.form_type.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/forms/${form.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormLink(form.form_slug)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/f/${form.form_slug}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/forms/${form.id}/submissions`)}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No forms yet</h3>
                <p className="text-muted-foreground">
                  Create your first form to start capturing leads and tracking submissions with custom URLs
                </p>
                <Button onClick={() => navigate("/forms/create")} size="lg" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Form
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
