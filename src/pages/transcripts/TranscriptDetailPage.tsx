import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Copy,
  Send,
  Search,
  Clock,
  Globe,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transcript {
  id: string;
  source_type: string;
  asset_id: string;
  raw_text: string;
  ai_model: string;
  language: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  word_timestamps: any;
}

export default function TranscriptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [credential, setCredential] = useState<any>(null);
  const [certifying, setCertifying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTranscript();
    }
  }, [id]);

  const fetchTranscript = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setTranscript(data);

      // Check for existing credential
      const { data: credData } = await supabase
        .from("content_credentials")
        .select("*")
        .eq("transcript_id", id)
        .maybeSingle();

      setCredential(credData);
    } catch (error) {
      console.error("Error fetching transcript:", error);
      toast({
        title: "Error loading transcript",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      navigate("/transcripts");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (transcript?.raw_text) {
      navigator.clipboard.writeText(transcript.raw_text);
      toast({
        title: "Copied to clipboard",
        description: "Transcript text copied successfully",
      });
    }
  };

  const handleSendToBlog = async () => {
    if (!transcript) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a new blog post draft
      const { data: blogPost, error } = await supabase
        .from("blog_posts")
        .insert({
          user_id: user.id,
          source_type: "transcript",
          transcript_id: transcript.id,
          title: transcript.metadata?.title || "Untitled Blog Post",
          slug: generateSlug(transcript.metadata?.title || "untitled"),
          excerpt: transcript.raw_text.substring(0, 200) + "...",
          content: transcript.raw_text,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Blog draft created",
        description: "Redirecting to blog editor...",
      });

      navigate(`/blog/${blogPost.id}/edit`);
    } catch (error) {
      console.error("Error creating blog from transcript:", error);
      toast({
        title: "Error creating blog",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCertifyTranscript = async () => {
    if (!transcript) return;

    setCertifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-content-credential', {
        body: {
          content_type: 'transcript',
          transcript_id: transcript.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Transcript certified",
        description: "Your transcript has been certified on-chain.",
      });

      // Refresh credential
      const { data: credData } = await supabase
        .from("content_credentials")
        .select("*")
        .eq("transcript_id", transcript.id)
        .single();

      setCredential(credData);
    } catch (error) {
      console.error("Error certifying transcript:", error);
      toast({
        title: "Error certifying transcript",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCertifying(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "studio_recording":
        return "Studio Recording";
      case "podcast_episode":
        return "Podcast Episode";
      case "upload":
        return "Upload";
      default:
        return type;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Transcript not found</h3>
          <Button onClick={() => navigate("/transcripts")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/transcripts")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transcript View */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {transcript.metadata?.title || "Transcript"}
                  </CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {getSourceTypeLabel(transcript.source_type)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyAll}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button size="sm" onClick={handleSendToBlog}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Blog Studio
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in transcript..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              {/* Transcript Text */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {highlightText(transcript.raw_text, searchQuery)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Globe className="h-4 w-4" />
                  Language
                </div>
                <p className="text-sm font-medium">
                  {transcript.language || "English"}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Duration
                </div>
                <p className="text-sm font-medium">
                  {transcript.metadata?.duration_seconds
                    ? `${Math.floor(transcript.metadata.duration_seconds / 60)}:${(
                        transcript.metadata.duration_seconds % 60
                      )
                        .toString()
                        .padStart(2, "0")}`
                    : "-"}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Created
                </div>
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(transcript.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  AI Model
                </div>
                <p className="text-sm font-medium">
                  {transcript.ai_model || "Unknown"}
                </p>
              </div>

              {transcript.asset_id && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <ExternalLink className="h-4 w-4" />
                    Source
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Navigate to source based on type
                      if (transcript.source_type === "podcast_episode") {
                        navigate(`/podcasts/${transcript.asset_id}`);
                      } else if (transcript.source_type === "studio_recording") {
                        navigate(`/media-library`);
                      }
                    }}
                  >
                    View Source
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {credential ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Content Credential
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Badge variant="default" className="bg-green-600">
                    Certified ✓
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  This transcript is certified on-chain
                </div>
                {credential.tx_hash && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://amoy.polygonscan.com/tx/${credential.tx_hash}`, '_blank')}
                  >
                    View on Polygonscan
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/c/${credential.id}`)}
                >
                  View Public Credential
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Certification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Certify this transcript on-chain to prove authorship and creation date
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleCertifyTranscript}
                  disabled={certifying}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {certifying ? "Certifying..." : "Certify Transcript"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleCopyAll}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Transcript
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleSendToBlog}
              >
                <Send className="h-4 w-4 mr-2" />
                Create Blog Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
