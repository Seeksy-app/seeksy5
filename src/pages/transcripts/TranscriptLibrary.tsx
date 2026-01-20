import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Clock, Filter, ExternalLink, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transcript {
  id: string;
  source_type: string;
  asset_id: string;
  raw_text: string;
  ai_model: string;
  language: string;
  created_at: string;
  metadata: any;
  word_timestamps: any;
}

export default function TranscriptLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [credentials, setCredentials] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTranscripts(data || []);

      // Fetch credentials for all transcripts
      if (data && data.length > 0) {
        const { data: credData } = await supabase
          .from("content_credentials")
          .select("*")
          .in("transcript_id", data.map(t => t.id));

        const credMap: Record<string, any> = {};
        credData?.forEach(c => {
          if (c.transcript_id) {
            credMap[c.transcript_id] = c;
          }
        });
        setCredentials(credMap);
      }
    } catch (error) {
      console.error("Error fetching transcripts:", error);
      toast({
        title: "Error loading transcripts",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (transcript: Transcript) => {
    if (transcript.raw_text && transcript.raw_text.length > 0) {
      return <Badge variant="default">Complete</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getDuration = (transcript: Transcript) => {
    const duration = transcript.metadata?.duration_seconds;
    if (!duration) return "-";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const filteredTranscripts = transcripts.filter((t) => {
    if (filter === "all") return true;
    return t.source_type === filter;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Transcript Library
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your transcripts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "podcast_episode" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("podcast_episode")}
          >
            Podcasts
          </Button>
          <Button
            variant={filter === "studio_recording" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("studio_recording")}
          >
            Studio
          </Button>
          <Button
            variant={filter === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("upload")}
          >
            Uploads
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Transcripts</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTranscripts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transcripts yet</h3>
              <p className="text-muted-foreground">
                Transcripts from your recordings will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTranscripts.map((transcript) => (
                  <TableRow key={transcript.id}>
                    <TableCell className="font-medium">
                      {transcript.metadata?.title || "Untitled"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSourceTypeLabel(transcript.source_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{transcript.language || "en"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getDuration(transcript)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transcript)}</TableCell>
                    <TableCell>
                      {credentials[transcript.id] ? (
                        <Badge variant="default" className="bg-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(transcript.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/transcripts/${transcript.id}`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
