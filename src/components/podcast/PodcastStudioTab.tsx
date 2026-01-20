import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Mic, 
  Upload, 
  Music,
  FileAudio,
  Sparkles,
  PlayCircle,
  Radio,
  ArrowRight,
  Wand2,
  Save,
  Volume2,
  Scissors,
  Zap,
  Bookmark,
  DollarSign,
  Trash2,
  Edit,
  Play,
  Pause,
  Square,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RecordingWaveform } from "@/components/studio/audio/RecordingWaveform";
import { MultiSegmentRecorder } from "@/components/studio/audio/MultiSegmentRecorder";

interface PodcastStudioTabProps {
  podcastId: string;
  userId: string;
}

export const PodcastStudioTab = ({ podcastId, userId }: PodcastStudioTabProps) => {
  const navigate = useNavigate();
  
  // Script Panel State
  const [script, setScript] = useState("");
  const [scriptSections, setScriptSections] = useState({
    intro: "",
    segments: "",
    sponsor: "",
    outro: ""
  });
  
  // Recording Panel State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Editing Panel State
  const [editingOptions, setEditingOptions] = useState({
    removeFillerWords: false,
    noiseReduction: false,
    trimSilence: false,
    autoLeveling: false,
    enhanceVoice: false,
    autoMixLevels: false,
  });
  
  // Marker Panel State
  const [markers, setMarkers] = useState<Array<{
    id: string;
    type: 'clip' | 'ad';
    timestamp: number;
    label: string;
  }>>([]);
  const [markerTimestamp, setMarkerTimestamp] = useState(0);
  
  // Episode Info
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDescription, setEpisodeDescription] = useState("");
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");

  const { data: podcast } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();
      if (error) throw error;
      return data;
    },
  });
  
  const { data: episodes } = useQuery({
    queryKey: ["podcast-episodes", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file);
        toast.success("Audio file selected");
      } else {
        toast.error("Please upload an audio file");
      }
    }
  };

  const handleGenerateScript = async () => {
    toast.info("AI script generation coming soon");
  };
  
  const handleSaveScript = () => {
    toast.success("Script saved");
  };
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    toast.info("Recording started (placeholder)");
  };
  
  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    toast.success("Recording stopped");
  };
  
  const handleSendToAICleanup = () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }
    toast.info("Sending to AI cleanup...");
  };
  
  const handleAddClipMarker = () => {
    const newMarker = {
      id: `clip-${Date.now()}`,
      type: 'clip' as const,
      timestamp: markerTimestamp,
      label: `Clip at ${Math.floor(markerTimestamp / 60)}:${(markerTimestamp % 60).toString().padStart(2, '0')}`
    };
    setMarkers([...markers, newMarker]);
    toast.success("Clip marker added");
  };
  
  const handleAddAdMarker = () => {
    const newMarker = {
      id: `ad-${Date.now()}`,
      type: 'ad' as const,
      timestamp: markerTimestamp,
      label: `Ad Read at ${Math.floor(markerTimestamp / 60)}:${(markerTimestamp % 60).toString().padStart(2, '0')}`
    };
    setMarkers([...markers, newMarker]);
    toast.success("Ad marker added");
  };
  
  const handleRemoveMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
    toast.success("Marker removed");
  };
  
  const handleSaveDraft = () => {
    toast.success("Saved as draft");
  };
  
  const handlePublishEpisode = () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }
    
    navigate(`/podcasts/${podcastId}/episodes/new-from-studio`, {
      state: {
        audioFile: uploadedFile,
        title: episodeTitle,
        description: episodeDescription,
        script,
        markers,
        editingOptions
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative p-8">
          <div className="flex items-start gap-6">
            {podcast?.cover_image_url && (
              <div className="shrink-0">
                <img 
                  src={podcast.cover_image_url} 
                  alt={podcast.title}
                  className="w-24 h-24 rounded-xl object-cover shadow-lg ring-2 ring-primary/20"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-5 h-5 text-primary animate-pulse" />
                <Badge variant="outline" className="text-primary border-primary/40">Podcast Audio Studio</Badge>
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{podcast?.title}</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Record, edit, and publish new episodes with AI-powered tools.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="gap-2">
                  <PlayCircle className="w-5 h-5" />
                  View Tutorials
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Panel Workflow Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* A) SCRIPT PANEL */}
        <Card className="shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm bg-card/95">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-primary" />
                  Script Editor
                </CardTitle>
                <CardDescription>Write or generate your episode script with AI</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerateScript} className="gap-2">
                <Wand2 className="w-4 h-4" />
                Generate with AI
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Intro</Label>
              <Textarea
                value={scriptSections.intro}
                onChange={(e) => setScriptSections({...scriptSections, intro: e.target.value})}
                placeholder="Episode introduction..."
                rows={2}
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Main Content</Label>
              <Textarea
                value={scriptSections.segments}
                onChange={(e) => setScriptSections({...scriptSections, segments: e.target.value})}
                placeholder="Main episode segments..."
                rows={4}
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Sponsor Read</Label>
              <Textarea
                value={scriptSections.sponsor}
                onChange={(e) => setScriptSections({...scriptSections, sponsor: e.target.value})}
                placeholder="Sponsor message (optional)..."
                rows={2}
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Outro</Label>
              <Textarea
                value={scriptSections.outro}
                onChange={(e) => setScriptSections({...scriptSections, outro: e.target.value})}
                placeholder="Episode outro..."
                rows={2}
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-muted-foreground">
                {Object.values(scriptSections).join(' ').split(/\s+/).filter(w => w).length} words total
              </p>
              <Button variant="default" size="sm" onClick={handleSaveScript} className="gap-2">
                <Save className="w-4 h-4" />
                Save Script
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* B) RECORDING PANEL */}
        <Card className="shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Recording
            </CardTitle>
            <CardDescription>Record audio or upload pre-recorded files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recording Controls */}
            <div className="border-2 border-dashed rounded-xl p-6 bg-muted/30">
              <div className="flex flex-col items-center gap-4">
                {!isRecording ? (
                  <>
                    <Mic className="w-12 h-12 text-muted-foreground" />
                    <Button onClick={handleStartRecording} size="lg" className="w-full gap-2">
                      <Play className="w-4 h-4" />
                      Start Recording
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-2xl font-mono">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button onClick={() => setIsPaused(!isPaused)} variant="outline" className="flex-1 gap-2">
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button onClick={handleStopRecording} variant="destructive" className="flex-1 gap-2">
                        <Square className="w-4 h-4" />
                        Stop
                      </Button>
                    </div>
                    {/* Waveform Placeholder */}
                    <div className="w-full h-12 bg-primary/10 rounded-lg flex items-center justify-center gap-1 px-4">
                      {[...Array(20)].map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary/40 rounded-full animate-pulse" 
                          style={{ 
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 50}ms` 
                          }} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or Upload</span>
              </div>
            </div>
            
            {/* File Upload */}
            <div>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="audio-upload"
                className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="text-center">
                  {uploadedFile ? (
                    <>
                      <FileAudio className="w-10 h-10 mx-auto mb-2 text-primary" />
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium text-sm">Click to upload audio</p>
                      <p className="text-xs text-muted-foreground">MP3, WAV, M4A up to 500MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
            
            {/* Playback Controls (when file uploaded) */}
            {uploadedFile && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Play
                </Button>
                <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recording Waveform Preview */}
        {isRecording && <RecordingWaveform isRecording={isRecording} />}
        
        {/* Multi-Segment Recorder */}
        <MultiSegmentRecorder />

        {/* C) EDITING PANEL */}
        <Card className="shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              AI Editing
            </CardTitle>
            <CardDescription>Enhance your audio with AI-powered tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Remove Filler Words</Label>
                  <p className="text-xs text-muted-foreground">Remove "um", "uh", "like"</p>
                </div>
              </div>
              <Switch 
                checked={editingOptions.removeFillerWords}
                onCheckedChange={(checked) => setEditingOptions({...editingOptions, removeFillerWords: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Noise Reduction</Label>
                  <p className="text-xs text-muted-foreground">Clean background noise</p>
                </div>
              </div>
              <Switch 
                checked={editingOptions.noiseReduction}
                onCheckedChange={(checked) => setEditingOptions({...editingOptions, noiseReduction: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Trim Silence</Label>
                  <p className="text-xs text-muted-foreground">Remove long pauses</p>
                </div>
              </div>
              <Switch 
                checked={editingOptions.trimSilence}
                onCheckedChange={(checked) => setEditingOptions({...editingOptions, trimSilence: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Auto-Leveling</Label>
                  <p className="text-xs text-muted-foreground">Normalize audio levels</p>
                </div>
              </div>
              <Switch 
                checked={editingOptions.autoLeveling}
                onCheckedChange={(checked) => setEditingOptions({...editingOptions, autoLeveling: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Enhance Voice (AI)</Label>
                  <p className="text-xs text-muted-foreground">AI voice enhancement</p>
                </div>
              </div>
              <Switch 
                checked={editingOptions.enhanceVoice || false}
                onCheckedChange={(checked) => setEditingOptions({...editingOptions, enhanceVoice: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Music className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Auto-Mix Levels</Label>
                  <p className="text-xs text-muted-foreground">Automatic mixing</p>
                </div>
              </div>
              <Switch 
                checked={editingOptions.autoMixLevels || false}
                onCheckedChange={(checked) => setEditingOptions({...editingOptions, autoMixLevels: checked})}
              />
            </div>
            
            <Separator />
            
            <Button onClick={handleSendToAICleanup} className="w-full gap-2" disabled={!uploadedFile}>
              <Sparkles className="w-4 h-4" />
              Send to AI Cleanup
            </Button>
          </CardContent>
        </Card>

        {/* D) MARKER PANEL */}
        <Card className="shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Markers
            </CardTitle>
            <CardDescription>Add clip highlights and ad markers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Marker Creation */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label>Timestamp (seconds)</Label>
              <Input 
                type="number" 
                value={markerTimestamp}
                onChange={(e) => setMarkerTimestamp(Number(e.target.value))}
                placeholder="0"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddClipMarker} variant="outline" className="flex-1 gap-2">
                  <Bookmark className="w-4 h-4" />
                  Add Clip
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddAdMarker} variant="outline" className="flex-1 gap-2">
                      <DollarSign className="w-4 h-4" />
                      Add Ad
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Host Ad Read</DialogTitle>
                      <DialogDescription>
                        Select an advertiser script to read at this timestamp
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm font-medium mb-2">Available Scripts</p>
                        <p className="text-xs text-muted-foreground">
                          Advertiser integration coming soon. You'll be able to select from available sponsor scripts here.
                        </p>
                      </div>
                      <Button className="w-full">Confirm Ad Marker</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Marker List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Markers List</Label>
              {markers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No markers added yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {markers.map((marker) => (
                    <div key={marker.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {marker.type === 'clip' ? (
                          <Bookmark className="w-4 h-4 text-blue-500" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{marker.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(marker.timestamp / 60)}:{(marker.timestamp % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMarker(marker.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Episode Funnel Integration */}
      {uploadedFile && (
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <Label htmlFor="episode-title">Episode Title</Label>
                  <Input
                    id="episode-title"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="Enter episode title"
                  />
                  
                  <Label htmlFor="episode-description">Episode Description</Label>
                  <Textarea
                    id="episode-description"
                    value={episodeDescription}
                    onChange={(e) => setEpisodeDescription(e.target.value)}
                    placeholder="Describe your episode..."
                    rows={3}
                  />
                  
                  <Label htmlFor="attach-episode">Attach to Existing Episode (Optional)</Label>
                  <Select value={selectedEpisodeId} onValueChange={setSelectedEpisodeId}>
                    <SelectTrigger id="attach-episode">
                      <SelectValue placeholder="Create as new episode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Create New Episode</SelectItem>
                      {episodes?.map((ep) => (
                        <SelectItem key={ep.id} value={ep.id}>
                          {ep.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Ready to publish?</h4>
                  <p className="text-sm text-muted-foreground">
                    Save as draft or publish your episode
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save as Draft
                  </Button>
                  <Button onClick={handlePublishEpisode} className="gap-2">
                    Publish Episode
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};