import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft, Upload, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PublicNomination() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category_id: "",
    nominee_name: "",
    nominee_email: "",
    nominee_description: "",
    rss_feed_url: "",
  });

  const { data: program, isLoading } = useQuery({
    queryKey: ["public-awards-program", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards_programs")
        .select(`
          *,
          award_categories (*)
        `)
        .eq("id", programId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("award_nominees").insert({
        program_id: programId,
        category_id: formData.category_id,
        nominee_name: formData.nominee_name,
        nominee_email: formData.nominee_email || null,
        nominee_description: formData.nominee_description || null,
        rss_feed_url: formData.rss_feed_url || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Nomination Submitted!",
        description: "Your nomination has been submitted for review. Thank you!",
      });

      setFormData({
        category_id: "",
        nominee_name: "",
        nominee_email: "",
        nominee_description: "",
        rss_feed_url: "",
      });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Awards Program Not Found</h2>
          <p className="text-muted-foreground">This awards program may not exist or is no longer accepting nominations.</p>
        </Card>
      </div>
    );
  }

  if (!program.allow_public_nominations || program.status !== "nominations_open") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-brand-gold" />
          <h2 className="text-2xl font-bold mb-2">{program.title}</h2>
          <p className="text-muted-foreground mb-4">
            {program.status === "nominations_open" 
              ? "This awards program is not accepting public nominations."
              : "Nominations are currently closed for this awards program."}
          </p>
        </Card>
      </div>
    );
  }

  // Check if this is a podcast awards program
  const isPodcastProgram = program.award_categories?.some((cat: any) => 
    cat.name.toLowerCase().includes('podcast')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy/5 to-brand-gold/5 py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-12 w-12 text-brand-gold" />
            <h1 className="text-4xl font-bold">{program.title}</h1>
          </div>
          {program.description && (
            <p className="text-lg text-muted-foreground">{program.description}</p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 rounded-full">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">Nominations Open</span>
          </div>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Submit a Nomination</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {program.award_categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nominee_name">Nominee Name *</Label>
              <Input
                id="nominee_name"
                value={formData.nominee_name}
                onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
                placeholder="Who are you nominating?"
                required
              />
            </div>

            <div>
              <Label htmlFor="nominee_email">Nominee Email (optional)</Label>
              <Input
                id="nominee_email"
                type="email"
                value={formData.nominee_email}
                onChange={(e) => setFormData({ ...formData, nominee_email: e.target.value })}
                placeholder="nominee@example.com"
              />
            </div>

            <div>
              <Label htmlFor="nominee_description">Why should they win? *</Label>
              <Textarea
                id="nominee_description"
                value={formData.nominee_description}
                onChange={(e) => setFormData({ ...formData, nominee_description: e.target.value })}
                placeholder="Tell us why this nominee deserves to win..."
                rows={4}
                required
              />
            </div>

            {isPodcastProgram && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="rss_feed_url">RSS Feed URL (optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          <strong>How to find your RSS feed:</strong><br />
                          • Spotify: Go to your show settings → Availability → Copy RSS feed<br />
                          • Apple Podcasts: Find it in Podcasts Connect<br />
                          • Most podcast hosts (Buzzsprout, Anchor, Libsyn, etc.) provide it in your dashboard
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="rss_feed_url"
                  type="url"
                  value={formData.rss_feed_url}
                  onChange={(e) => setFormData({ ...formData, rss_feed_url: e.target.value })}
                  placeholder="https://media.rss.com/your-show/feed.xml"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Provide the RSS feed to display latest episodes
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !formData.category_id || !formData.nominee_name || !formData.nominee_description}
              className="w-full bg-brand-gold hover:bg-brand-darkGold text-lg py-6"
            >
              {loading ? "Submitting..." : "Submit Nomination"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
