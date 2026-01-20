import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Mail, Trash2 } from "lucide-react";

interface Creator {
  id: string;
  creator_name: string;
  creator_email: string | null;
  creator_bio: string | null;
  is_managed: boolean;
  created_at: string;
}

export default function InfluenceHubCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    creator_name: "",
    creator_email: "",
    creator_bio: "",
  });

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("influencehub_creators")
        .select("*")
        .eq("agency_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("influencehub_creators").insert({
        agency_user_id: user.id,
        creator_name: formData.creator_name,
        creator_email: formData.creator_email || null,
        creator_bio: formData.creator_bio || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Creator added successfully",
      });

      setFormData({ creator_name: "", creator_email: "", creator_bio: "" });
      setDialogOpen(false);
      fetchCreators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCreator = async (creatorId: string) => {
    try {
      const { error } = await supabase
        .from("influencehub_creators")
        .delete()
        .eq("id", creatorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Creator removed",
      });
      fetchCreators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manage Creators</h1>
          <p className="text-muted-foreground">
            Manage multiple creator accounts from your agency
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Creator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Creator</DialogTitle>
              <DialogDescription>
                Add a creator to manage their social media accounts
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCreator} className="space-y-4">
              <div>
                <Label htmlFor="creator_name">Creator Name *</Label>
                <Input
                  id="creator_name"
                  value={formData.creator_name}
                  onChange={(e) =>
                    setFormData({ ...formData, creator_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="creator_email">Email</Label>
                <Input
                  id="creator_email"
                  type="email"
                  value={formData.creator_email}
                  onChange={(e) =>
                    setFormData({ ...formData, creator_email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="creator_bio">Bio</Label>
                <Textarea
                  id="creator_bio"
                  value={formData.creator_bio}
                  onChange={(e) =>
                    setFormData({ ...formData, creator_bio: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Add Creator
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Creators Grid */}
      {creators.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No creators yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Creator
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <Card key={creator.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{creator.creator_name}</CardTitle>
                    {creator.creator_email && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {creator.creator_email}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {creator.creator_bio && (
                <p className="text-sm text-muted-foreground mb-4">
                  {creator.creator_bio}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "Creator management features are being built",
                  })}
                >
                  Manage
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteCreator(creator.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
