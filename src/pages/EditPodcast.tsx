import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";

const EditPodcast = () => {
  const { podcastId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Podcast not found");
      return data;
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isExplicit, setIsExplicit] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationEmailPermanent, setVerificationEmailPermanent] = useState(false);
  const [verificationEmailExpiresAt, setVerificationEmailExpiresAt] = useState<string | null>(null);

  // Initialize form when podcast data loads
  useEffect(() => {
    if (podcast) {
      setTitle(podcast.title || "");
      setDescription(podcast.description || "");
      setCoverImageUrl(podcast.cover_image_url || "");
      setAuthorName(podcast.author_name || "");
      setAuthorEmail(podcast.author_email || "");
      setWebsiteUrl(podcast.website_url || "");
      setCategory(podcast.category || "");
      setIsExplicit(podcast.is_explicit || false);
      setIsPublished(podcast.is_published || false);
      setShowOnProfile(podcast.show_on_profile !== false);
      setVerificationEmail(podcast.verification_email || "");
      setVerificationEmailPermanent(podcast.verification_email_permanent || false);
      setVerificationEmailExpiresAt(podcast.verification_email_expires_at || null);
    }
  }, [podcast]);

  const updatePodcast = useMutation({
    mutationFn: async () => {
      // Calculate expiration if adding temporary verification email
      let expiresAt = null;
      if (verificationEmail && !verificationEmailPermanent && !verificationEmailExpiresAt) {
        // Set expiration to 48 hours from now if not already set
        const fortyEightHours = new Date();
        fortyEightHours.setHours(fortyEightHours.getHours() + 48);
        expiresAt = fortyEightHours.toISOString();
      } else if (verificationEmailPermanent) {
        expiresAt = null; // Clear expiration if permanent
      } else {
        expiresAt = verificationEmailExpiresAt; // Keep existing expiration
      }

      const { error } = await supabase
        .from("podcasts")
        .update({
          title,
          description,
          cover_image_url: coverImageUrl,
          author_name: authorName,
          author_email: authorEmail,
          website_url: websiteUrl,
          category,
          is_explicit: isExplicit,
          is_published: isPublished,
          show_on_profile: showOnProfile,
          verification_email: verificationEmail || null,
          verification_email_permanent: verificationEmailPermanent,
          verification_email_expires_at: expiresAt,
        })
        .eq("id", podcastId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast", podcastId] });
      queryClient.invalidateQueries({ queryKey: ["podcasts"] });
      toast.success("Podcast updated!");
      navigate(`/podcasts/${podcastId}`);
    },
    onError: () => {
      toast.error("Failed to update podcast");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please enter a title");
      return;
    }
    updatePodcast.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Podcast not found</p>
          <Button onClick={() => navigate("/podcasts")} className="mt-4">
            Back to Podcasts
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/podcasts/${podcastId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Podcast
        </Button>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">Edit Podcast</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Podcast Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tuesday's Tech"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your podcast..."
                rows={4}
              />
            </div>

            <ImageUpload
              label="Cover Image (1400x1400 recommended)"
              onImageUploaded={setCoverImageUrl}
              currentImage={coverImageUrl}
              bucket="podcast-covers"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorName">Author Name</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Johnny Rocket"
                />
              </div>

              <div>
                <Label htmlFor="authorEmail">Author Email</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="hello@seeksy.io"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://www.seeksy.io"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Technology"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="explicit">Explicit Content</Label>
                <p className="text-sm text-muted-foreground">
                  Does this podcast contain explicit content?
                </p>
              </div>
              <Switch
                id="explicit"
                checked={isExplicit}
                onCheckedChange={setIsExplicit}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="published">Published</Label>
                <p className="text-sm text-muted-foreground">
                  Make this podcast publicly available
                </p>
              </div>
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="showOnProfile">Show on Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Display this podcast on your public profile
                </p>
              </div>
              <Switch
                id="showOnProfile"
                checked={showOnProfile}
                onCheckedChange={setShowOnProfile}
              />
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label className="text-base font-semibold">RSS Feed Email Verification</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Some directories (like Spotify) require an email in your RSS feed for verification.
                  Add a temporary email here - we'll automatically remove it after 48 hours to protect your inbox.
                </p>
              </div>
              
              <div>
                <Label htmlFor="verificationEmail">Verification Email</Label>
                <Input
                  id="verificationEmail"
                  type="email"
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                  placeholder="podcast@example.com"
                />
                {verificationEmailExpiresAt && !verificationEmailPermanent && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {new Date(verificationEmailExpiresAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="permanentEmail">Keep Email in Feed Indefinitely</Label>
                  <p className="text-sm text-muted-foreground">
                    Leave email in RSS feed permanently instead of removing after 48 hours
                  </p>
                </div>
                <Switch
                  id="permanentEmail"
                  checked={verificationEmailPermanent}
                  onCheckedChange={setVerificationEmailPermanent}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updatePodcast.isPending}
                className="flex-1"
              >
                {updatePodcast.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Podcast"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/podcasts/${podcastId}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditPodcast;
