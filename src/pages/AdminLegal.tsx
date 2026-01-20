import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLegal = () => {
  const [showOnProfile, setShowOnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("legal_on_profile")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setShowOnProfile(data?.legal_on_profile || false);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ legal_on_profile: checked })
        .eq("id", user.id);

      if (error) throw error;

      setShowOnProfile(checked);
      toast({
        title: "Settings Updated",
        description: checked 
          ? "Legal pages will now appear on your creator page" 
          : "Legal pages removed from your creator page",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const legalPages = [
    {
      title: "Privacy Policy",
      description: "Details how we collect, use, and protect user data",
      url: "/privacy",
    },
    {
      title: "Terms & Conditions",
      description: "Legal agreement between Seeksy and users",
      url: "/terms",
    },
    {
      title: "Cookie Policy",
      description: "Information about cookies and tracking technologies",
      url: "/cookies",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Legal Pages</h1>
        <p className="text-muted-foreground">
          Manage your legal documents and privacy policies
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Display on Creator Page</CardTitle>
          <CardDescription>
            Choose whether to show legal page links in the footer of your creator landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-legal"
              checked={showOnProfile}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
            <Label htmlFor="show-legal">
              Show legal pages on my creator page
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {legalPages.map((page) => (
          <Card key={page.url}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-1">{page.title}</CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={page.url} target="_blank" rel="noopener noreferrer">
                    View
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLegal;
