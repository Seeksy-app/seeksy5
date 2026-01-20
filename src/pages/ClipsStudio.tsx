import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClipsStudioWorkspace } from "@/components/clips-studio/ClipsStudioWorkspace";
import { ClipsSourceSelector } from "@/components/clips-studio/ClipsSourceSelector";
import { useSidebar } from "@/components/ui/sidebar";
import { Loader2, Sparkles, Zap, TrendingUp, Film } from "lucide-react";
import { motion } from "framer-motion";

export interface ClipData {
  id: string;
  title: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  virality_score: number;
  hook_score?: number;
  flow_score?: number;
  value_score?: number;
  trend_score?: number;
  suggested_caption?: string;
  transcript_snippet?: string;
  storage_path?: string;
  thumbnail_url?: string;
  vertical_url?: string;
  status: string;
  aspect_ratio: string;
  template_id: string;
  platforms?: string[];
  scenes?: ClipScene[];
}

export interface ClipScene {
  timestamp: number;
  description: string;
  type: 'hook' | 'key_point' | 'cta' | 'transition';
}

export interface SourceMedia {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  duration_seconds: number | null;
  cloudflare_uid?: string;
  cloudflare_download_url?: string;
  created_at?: string;
  source?: string;
  edit_transcript?: any;
  thumbnail_url?: string;
}

export default function ClipsStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Try to get sidebar context safely
  let sidebar: ReturnType<typeof useSidebar> | null = null;
  try {
    sidebar = useSidebar();
  } catch {
    // Sidebar context not available
  }
  
  const [step, setStep] = useState<'select' | 'analyze' | 'edit'>('select');
  const [sourceMedia, setSourceMedia] = useState<SourceMedia | null>(null);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');

  // Auto-collapse sidebar when entering clips studio
  useEffect(() => {
    if (sidebar && !sidebar.isMobile) {
      sidebar.setOpen(false);
    }
    return () => {
      // Restore sidebar when leaving
      if (sidebar && !sidebar.isMobile) {
        sidebar.setOpen(true);
      }
    };
  }, [sidebar]);

  // Check for mediaId in URL params (from AI Post-Production flow)
  useEffect(() => {
    const mediaId = searchParams.get('mediaId');
    if (mediaId) {
      loadMediaAndAnalyze(mediaId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const loadMediaAndAnalyze = async (mediaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: media, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", mediaId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (media) {
        const mappedMedia: SourceMedia = {
          id: media.id,
          file_url: media.cloudflare_download_url || media.file_url,
          file_name: media.file_name,
          file_type: media.file_type,
          duration_seconds: media.duration_seconds,
          cloudflare_uid: media.cloudflare_uid || undefined,
          cloudflare_download_url: media.cloudflare_download_url || undefined,
          created_at: media.created_at,
          source: (media as any).source,
          edit_transcript: media.edit_transcript,
          thumbnail_url: media.thumbnail_url,
        };
        setSourceMedia(mappedMedia);
        
        // Check if clips already exist for this media
        const { data: existingClips } = await supabase
          .from("clips")
          .select("*")
          .eq("source_media_id", mediaId)
          .is("deleted_at", null)
          .order("virality_score", { ascending: false });

        if (existingClips && existingClips.length > 0) {
          // Add mock platforms and scenes for demo
          const enhancedClips = existingClips.map(clip => ({
            ...clip,
            platforms: ['tiktok', 'reels', 'shorts'],
            scenes: generateMockScenes(clip.start_seconds, clip.end_seconds),
          })) as ClipData[];
          setClips(enhancedClips);
          setStep('edit');
        } else {
          setStep('analyze');
          analyzeVideo(mappedMedia);
        }
      }
    } catch (error) {
      console.error("Error loading media:", error);
      toast({
        title: "Error",
        description: "Failed to load media file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockScenes = (start: number, end: number): ClipScene[] => {
    const duration = end - start;
    return [
      { timestamp: start, description: 'Hook - Attention grabber', type: 'hook' },
      { timestamp: start + duration * 0.3, description: 'Key insight delivered', type: 'key_point' },
      { timestamp: start + duration * 0.6, description: 'Supporting example', type: 'key_point' },
      { timestamp: start + duration * 0.9, description: 'Call to action', type: 'cta' },
    ];
  };

  const handleMediaSelect = async (media: SourceMedia) => {
    setSourceMedia(media);
    setStep('analyze');
    
    // Check for existing clips first
    const { data: existingClips } = await supabase
      .from("clips")
      .select("*")
      .eq("source_media_id", media.id)
      .is("deleted_at", null)
      .order("virality_score", { ascending: false });

    if (existingClips && existingClips.length > 0) {
      const enhancedClips = existingClips.map(clip => ({
        ...clip,
        platforms: ['tiktok', 'reels', 'shorts'],
        scenes: generateMockScenes(clip.start_seconds, clip.end_seconds),
      })) as ClipData[];
      setClips(enhancedClips);
      setStep('edit');
      toast({
        title: "Clips found",
        description: `Found ${existingClips.length} existing clips for this video`,
      });
    } else {
      analyzeVideo(media);
    }
  };

  const analyzeVideo = async (media: SourceMedia) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulate analysis stages
    const stages = [
      { label: 'Transcribing audio...', progress: 20 },
      { label: 'Detecting key moments...', progress: 40 },
      { label: 'Scoring virality potential...', progress: 60 },
      { label: 'Generating captions...', progress: 80 },
      { label: 'Finalizing clips...', progress: 95 },
    ];

    let stageIndex = 0;
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisStage(stages[stageIndex].label);
        setAnalysisProgress(stages[stageIndex].progress);
        stageIndex++;
      }
    }, 1500);
    
    try {
      const transcript = media.edit_transcript?.transcript || null;
      
      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId: media.id,
          fileUrl: media.file_url,
          duration: media.duration_seconds,
          transcript,
        },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      // Fetch the created clips from database
      const { data: createdClips, error: fetchError } = await supabase
        .from("clips")
        .select("*")
        .eq("source_media_id", media.id)
        .is("deleted_at", null)
        .order("virality_score", { ascending: false });

      if (fetchError) throw fetchError;

      const enhancedClips = (createdClips || []).map(clip => ({
        ...clip,
        platforms: ['tiktok', 'reels', 'shorts'],
        scenes: generateMockScenes(clip.start_seconds, clip.end_seconds),
      })) as ClipData[];

      setClips(enhancedClips);
      setAnalysisProgress(100);
      setStep('edit');
      
      toast({
        title: "Analysis complete!",
        description: `Found ${createdClips?.length || 0} viral-worthy moments`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze video for clips",
        variant: "destructive",
      });
      setStep('select');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyze = () => {
    if (sourceMedia) {
      setStep('analyze');
      analyzeVideo(sourceMedia);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'select') {
    return (
      <ClipsSourceSelector 
        onMediaSelect={handleMediaSelect}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (step === 'analyze' && isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-6">
        {/* Animated AI Brain */}
        <motion.div 
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2C6BED]/30 to-[#DDA3FF]/30 blur-3xl rounded-full" />
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
            <Sparkles className="h-16 w-16 text-white animate-pulse" />
          </div>
          
          {/* Orbiting icons */}
          <motion.div 
            className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-[#F5C242] flex items-center justify-center shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="h-6 w-6 text-[#053877]" />
          </motion.div>
          <motion.div 
            className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-[#DDA3FF] flex items-center justify-center shadow-lg"
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <TrendingUp className="h-6 w-6 text-[#053877]" />
          </motion.div>
          <motion.div 
            className="absolute top-1/2 -right-8 w-10 h-10 rounded-full bg-[#A7C7FF] flex items-center justify-center shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <Film className="h-5 w-5 text-[#053877]" />
          </motion.div>
        </motion.div>

        {/* Progress info */}
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">AI is analyzing your video</h2>
          <p className="text-muted-foreground">{analysisStage || 'Initializing...'}</p>
          
          {/* Progress bar */}
          <div className="w-full max-w-sm mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#053877] to-[#2C6BED]"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{analysisProgress}% complete</p>
          </div>
        </div>

        {/* Feature indicators */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <motion.span 
            className="flex items-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Hook Detection
          </motion.span>
          <motion.span 
            className="flex items-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          >
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            Virality Scoring
          </motion.span>
          <motion.span 
            className="flex items-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Caption AI
          </motion.span>
        </div>
      </div>
    );
  }

  return (
    <ClipsStudioWorkspace
      sourceMedia={sourceMedia!}
      clips={clips}
      setClips={setClips}
      onReanalyze={handleReanalyze}
      onBack={() => setStep('select')}
    />
  );
}
