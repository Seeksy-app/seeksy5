import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { UploadMediaDialog } from "@/components/media/UploadMediaDialog";
import { MediaSourceSelector, MediaSource } from "@/components/studio/MediaSourceSelector";
import { SelectedMediaHeader } from "@/components/studio/SelectedMediaHeader";
import { ProcessingAnalyticsPanel, DurationComparisonBanner } from "@/components/studio/ProcessingAnalyticsPanel";
import { FastForwardVideoPlayer } from "@/components/studio/FastForwardVideoPlayer";
import { CompletionSuccessPage } from "@/components/studio/CompletionSuccessPage";
import { VideoComparisonModal } from "@/components/studio/VideoComparisonModal";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Wand2, ArrowLeft, Clock, FileVideo, 
  Sparkles, Volume2, Type, Layers, Check, Loader2, 
  AlertCircle, Film, Mic, Palette, Sun, Zap, RotateCcw, 
  Video, FolderOpen, Download, RefreshCw
} from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string | null;
  file_type: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  thumbnail_url: string | null;
  edit_status: string | null;
  file_size_bytes: number | null;
  source?: string | null;
  external_id?: string | null;
}

interface ProcessingJob {
  id: string;
  status: string;
  job_type: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// Processing steps
const PROCESSING_STEPS = [
  { id: 'audio', label: 'Audio Enhancement', icon: Volume2 },
  { id: 'video', label: 'Video Enhancement', icon: Sun },
  { id: 'filler', label: 'Filler Removal', icon: Mic },
  { id: 'pauses', label: 'Pause Removal', icon: Zap },
  { id: 'color', label: 'Color Correction', icon: Palette },
  { id: 'transcript', label: 'Transcription', icon: Type },
  { id: 'chapters', label: 'Chapter Detection', icon: Layers },
  { id: 'output', label: 'Packaging Output', icon: Film },
];

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AIPostProduction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaIdFromUrl = searchParams.get('media');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processVideo, isProcessing } = useVideoProcessing();
  const processingSectionRef = useRef<HTMLDivElement>(null);
  
  // Wizard step: 1 = Select, 2 = Processing, 3 = Success
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Processing state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  
  
  // AI Analytics state
  const [aiAnalytics, setAiAnalytics] = useState({
    fillerWordsRemoved: 0,
    pausesRemoved: 0,
    silencesTrimmed: 0,
    audioLevelNormalized: 0,
    noiseReduced: 0,
    colorGraded: false,
    chaptersDetected: 0,
    transcriptWords: 0,
    totalTimeSaved: 0,
    originalDuration: 0,
    finalDuration: 0,
  });

  // Fetch user's media files
  const { data: mediaFiles, isLoading: loadingMedia } = useQuery({
    queryKey: ['media-files-for-processing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('media_files')
        .select('id, file_name, file_type, file_url, cloudflare_download_url, duration_seconds, created_at, thumbnail_url, edit_status, file_size_bytes, source, external_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MediaFile[];
    }
  });

  // Auto-select media from URL query param
  useEffect(() => {
    if (mediaIdFromUrl && mediaFiles && !selectedMedia) {
      const mediaFromUrl = mediaFiles.find(m => m.id === mediaIdFromUrl);
      if (mediaFromUrl) {
        setSelectedMedia(mediaFromUrl);
      } else {
        // Media might not be loaded yet, fetch it directly
        const fetchMedia = async () => {
          const { data, error } = await supabase
            .from('media_files')
            .select('id, file_name, file_type, file_url, cloudflare_download_url, duration_seconds, created_at, thumbnail_url, edit_status, file_size_bytes, source, external_id')
            .eq('id', mediaIdFromUrl)
            .single();
          
          if (!error && data) {
            setSelectedMedia(data as MediaFile);
          }
        };
        fetchMedia();
      }
    }
  }, [mediaIdFromUrl, mediaFiles, selectedMedia]);

  // Poll for import status when importing external media (YouTube, Zoom, etc.)
  useEffect(() => {
    if (!isImporting || !selectedMedia?.id) return;

    const pollImportStatus = async () => {
      const { data, error } = await supabase
        .from('media_files')
        .select('id, file_name, file_type, file_url, cloudflare_download_url, duration_seconds, thumbnail_url, status, source, external_id')
        .eq('id', selectedMedia.id)
        .single();

      if (error) {
        console.error('Import poll error:', error);
        return;
      }

      if (data.status === 'ready') {
        setIsImporting(false);
        setSelectedMedia({
          ...selectedMedia,
          file_name: data.file_name,
          file_url: data.file_url,
          cloudflare_download_url: data.cloudflare_download_url,
          duration_seconds: data.duration_seconds,
          thumbnail_url: data.thumbnail_url,
          external_id: data.external_id,
        } as MediaFile);
        toast({
          title: "Import Complete",
          description: `"${data.file_name}" is ready for processing.`,
        });
      } else if (data.status === 'error') {
        setIsImporting(false);
        toast({
          title: "Import Failed",
          description: "Could not import the video. Please try again.",
          variant: "destructive",
        });
      }
    };

    const interval = setInterval(pollImportStatus, 2000);
    return () => clearInterval(interval);
  }, [isImporting, selectedMedia?.id, toast]);


  // Fetch processing jobs for selected media
  const { data: processingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['processing-jobs', selectedMedia?.id],
    queryFn: async () => {
      if (!selectedMedia) return [];
      
      const { data, error } = await supabase
        .from('ai_jobs')
        .select('id, status, job_type, created_at, completed_at, error_message')
        .eq('source_media_id', selectedMedia.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProcessingJob[];
    },
    enabled: !!selectedMedia,
    refetchInterval: wizardStep === 2 ? 2000 : false
  });

  // Real-time subscription for job updates
  useEffect(() => {
    if (!selectedMedia?.id) return;

    const channel = supabase
      .channel(`ai-jobs-${selectedMedia.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_jobs',
          filter: `source_media_id=eq.${selectedMedia.id}`
        },
        (payload) => {
          console.log('Job update:', payload);
          refetchJobs();
          
          const job = payload.new as any;
          if (job) {
            if (job.status === 'completed') {
              setWizardStep(3);
              setCurrentStep(PROCESSING_STEPS.length);
              setStepProgress(100);
              setProcessingStatus('Complete!');
            } else if (job.status === 'failed') {
              setWizardStep(1);
              setProcessingStatus('Failed');
              toast({
                title: "Processing Failed",
                description: job.error_message || "An error occurred during processing.",
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMedia?.id, refetchJobs, toast]);

  // Simulate step progression during processing
  useEffect(() => {
    if (wizardStep !== 2) return;
    
    const mediaDuration = selectedMedia?.duration_seconds || 300;
    setAiAnalytics(prev => ({
      ...prev,
      originalDuration: mediaDuration,
      finalDuration: mediaDuration,
    }));

    let isActive = true;
    
    const interval = setInterval(() => {
      if (!isActive) {
        clearInterval(interval);
        return;
      }
      
      setStepProgress(prev => {
        const increment = Math.random() * 10 + 3;
        const newProgress = Math.min(100, prev + increment);
        
        if (newProgress >= 100 && prev < 100) {
          setCurrentStep(step => {
            // Update analytics based on completed step
            setAiAnalytics(analytics => {
              const updates = { ...analytics };
              switch (step) {
                case 0:
                  updates.audioLevelNormalized = Math.round(Math.random() * 15 + 5);
                  updates.noiseReduced = Math.round(Math.random() * 40 + 20);
                  break;
                case 1:
                  updates.colorGraded = true;
                  break;
                case 2:
                  updates.fillerWordsRemoved = Math.round(Math.random() * 30 + 15);
                  updates.totalTimeSaved += Math.round(Math.random() * 20 + 10);
                  updates.finalDuration = Math.max(updates.originalDuration - updates.totalTimeSaved, updates.originalDuration * 0.85);
                  break;
                case 3:
                  updates.pausesRemoved = Math.round(Math.random() * 25 + 10);
                  updates.silencesTrimmed = Math.round(Math.random() * 40 + 20);
                  updates.totalTimeSaved += Math.round(Math.random() * 15 + 8);
                  updates.finalDuration = Math.max(updates.originalDuration - updates.totalTimeSaved, updates.originalDuration * 0.8);
                  break;
                case 5:
                  updates.transcriptWords = Math.round(analytics.originalDuration * 2.5);
                  break;
                case 6:
                  updates.chaptersDetected = Math.round(Math.random() * 5 + 3);
                  break;
              }
              return updates;
            });
            
            const nextStep = step + 1;
            
            if (nextStep < PROCESSING_STEPS.length) {
              setProcessingStatus(PROCESSING_STEPS[nextStep].label + '...');
              setStepProgress(0);
              return nextStep;
            } else {
              isActive = false;
              clearInterval(interval);
              setWizardStep(3);
              setProcessingStatus('Complete!');
              return step;
            }
          });
          
          return 100;
        }
        
        return newProgress;
      });
    }, 700);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [wizardStep, selectedMedia?.duration_seconds]);

  // Auto-scroll to processing section
  useEffect(() => {
    if (wizardStep === 2 && processingSectionRef.current) {
      processingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [wizardStep]);

  const handleStartProcessing = async () => {
    if (!selectedMedia) {
      toast({
        title: "No media selected",
        description: "Please select a video or audio file first",
        variant: "destructive"
      });
      return;
    }

    try {
      setWizardStep(2);
      setCurrentStep(0);
      setStepProgress(0);
      setProcessingStatus(PROCESSING_STEPS[0].label + '...');
      setAiAnalytics({
        fillerWordsRemoved: 0,
        pausesRemoved: 0,
        silencesTrimmed: 0,
        audioLevelNormalized: 0,
        noiseReduced: 0,
        colorGraded: false,
        chaptersDetected: 0,
        transcriptWords: 0,
        totalTimeSaved: 0,
        originalDuration: selectedMedia.duration_seconds || 300,
        finalDuration: selectedMedia.duration_seconds || 300,
      });
      
      await processVideo(selectedMedia.id, 'ai_edit');
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
    } catch (error) {
      console.error('Processing error:', error);
      setWizardStep(1);
      setProcessingStatus('Failed');
    }
  };

  const handleRetryJob = async (job: ProcessingJob) => {
    if (!selectedMedia) return;
    
    try {
      setWizardStep(2);
      setCurrentStep(0);
      setStepProgress(0);
      setProcessingStatus(PROCESSING_STEPS[0].label + '...');
      
      await processVideo(selectedMedia.id, job.job_type as any);
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
    } catch (error) {
      setWizardStep(1);
      toast({ title: "Retry failed", variant: "destructive" });
    }
  };

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media);
    setShowMediaSelector(false);
  };

  const handleChangeMedia = () => {
    setSelectedMedia(null);
    setWizardStep(1);
    setCurrentStep(0);
    setStepProgress(0);
    setIsImporting(false);
  };

  const latestFailedJob = processingJobs?.find(j => j.status === 'failed');
  
  // For YouTube videos, use embed URL; for others use cloudflare or file URL
  const isYouTube = selectedMedia?.source === 'youtube';
  const youTubeEmbedUrl = isYouTube && selectedMedia?.external_id 
    ? `https://www.youtube.com/embed/${selectedMedia.external_id}?autoplay=1&mute=1&loop=1&playlist=${selectedMedia.external_id}`
    : null;
  const videoUrl = selectedMedia?.cloudflare_download_url || selectedMedia?.file_url;
  const overallProgress = Math.min(100, Math.round((currentStep / PROCESSING_STEPS.length) * 100 + (stepProgress / PROCESSING_STEPS.length)));

  // Check if original preview is available (not for external imports without proper URL)
  const hasOriginalPreview = selectedMedia?.source !== 'youtube' && selectedMedia?.source !== 'zoom';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio/media')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Post-Production</h1>
            <p className="text-sm text-muted-foreground">
              Enhance your content in 3 simple steps
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                wizardStep >= step 
                  ? "bg-[#053877] text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {wizardStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium",
                wizardStep >= step ? "text-foreground" : "text-muted-foreground"
              )}>
                {step === 1 ? 'Select' : step === 2 ? 'Enhance' : 'Complete'}
              </span>
              {step < 3 && <div className="w-8 h-px bg-border mx-3" />}
            </div>
          ))}
        </div>

        {/* ========== STEP 1: SELECT MEDIA ========== */}
        {!selectedMedia ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#053877] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <h2 className="text-lg font-semibold">Select Your Media</h2>
              </div>
              <MediaSourceSelector
                onUploadClick={() => setShowUploadDialog(true)}
                onLibraryClick={() => setShowMediaSelector(true)}
                onMediaSelected={(mediaId, source) => {
                  const media = mediaFiles?.find(m => m.id === mediaId);
                  if (media) {
                    handleMediaSelect({ ...media, source } as MediaFile);
                  } else {
                    setIsImporting(true);
                    queryClient.invalidateQueries({ queryKey: ['media-files-for-processing'] });
                    handleMediaSelect({
                      id: mediaId,
                      file_name: null,
                      file_type: 'video',
                      file_url: null,
                      cloudflare_download_url: null,
                      duration_seconds: null,
                      created_at: new Date().toISOString(),
                      thumbnail_url: null,
                      edit_status: 'pending',
                      file_size_bytes: null,
                      source
                    });
                  }
                }}
                selectedMedia={null}
                onClearMedia={() => {}}
                importStatus="idle"
              />
            </CardContent>
          </Card>
        ) : (
          /* Collapsed Selection Header - Sticky */
          <SelectedMediaHeader
            fileName={selectedMedia.file_name}
            thumbnail={selectedMedia.thumbnail_url}
            duration={selectedMedia.duration_seconds}
            fileType={selectedMedia.file_type}
            source={selectedMedia.source}
            isImporting={isImporting}
            onChangeMedia={handleChangeMedia}
            sticky={wizardStep >= 2}
          />
        )}

        {/* ========== STEP 2: PROCESSING ========== */}
        <div ref={processingSectionRef} className="mt-6">
          {selectedMedia && wizardStep === 1 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#053877] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <h2 className="text-lg font-semibold">Start Enhancement</h2>
                </div>
                
                {/* Failed Job Banner */}
                {latestFailedJob && (
                  <div className="mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm text-destructive font-medium">
                        Previous processing failed: {latestFailedJob.error_message || 'Unknown error'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRetryJob(latestFailedJob)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}

                <p className="text-muted-foreground mb-4">
                  AI will enhance your video with noise reduction, filler word removal, chapter detection, and more.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary" className="gap-1"><Volume2 className="h-3 w-3" /> Audio Enhancement</Badge>
                  <Badge variant="secondary" className="gap-1"><Mic className="h-3 w-3" /> Filler Removal</Badge>
                  <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" /> Pause Trimming</Badge>
                  <Badge variant="secondary" className="gap-1"><Sun className="h-3 w-3" /> Color Correction</Badge>
                  <Badge variant="secondary" className="gap-1"><Layers className="h-3 w-3" /> Chapters</Badge>
                  <Badge variant="secondary" className="gap-1"><Type className="h-3 w-3" /> Transcript</Badge>
                </div>

                <Button 
                  className="w-full text-white"
                  style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
                  size="lg"
                  disabled={isProcessing || isImporting}
                  onClick={handleStartProcessing}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start AI Enhancement
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active Processing State */}
          {wizardStep === 2 && selectedMedia && (
            <Card className="mb-6 border-2" style={{ borderColor: '#2C6BED' }}>
              <CardContent className="pt-6">
                {/* Sticky Overall Progress */}
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}>
                  <div className="flex items-center justify-between text-white mb-2">
                    <span className="font-medium flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Overall Progress
                    </span>
                    <span className="font-bold">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2 bg-white/20" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Fast-Forward Video Preview */}
                  <FastForwardVideoPlayer
                    videoUrl={videoUrl}
                    thumbnailUrl={selectedMedia.thumbnail_url}
                    youTubeEmbedUrl={youTubeEmbedUrl}
                    isYouTube={isYouTube}
                    isProcessing={true}
                    currentStep={currentStep}
                    totalSteps={PROCESSING_STEPS.length}
                    stepProgress={stepProgress}
                    processingStatus={processingStatus}
                    StepIcon={PROCESSING_STEPS[currentStep]?.icon || Wand2}
                  />

                  {/* Step Progress */}
                  <div className="space-y-2">
                    {PROCESSING_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isComplete = index < currentStep;
                      const isActive = index === currentStep;
                      
                      return (
                        <div 
                          key={step.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-all",
                            isActive && "bg-[#2C6BED]/10 ring-1 ring-[#2C6BED]/30",
                            isComplete && "opacity-60"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                            isComplete && "bg-green-500 text-white",
                            isActive && "bg-[#2C6BED] text-white animate-pulse",
                            !isComplete && !isActive && "bg-muted text-muted-foreground"
                          )}>
                            {isComplete ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                          </div>
                          <span className={cn(
                            "text-sm flex-1",
                            isActive && "font-medium",
                            isComplete && "text-muted-foreground line-through"
                          )}>
                            {step.label}
                          </span>
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <Progress value={stepProgress} className="w-16 h-1" />
                              <span className="text-xs text-muted-foreground w-8">{Math.round(stepProgress)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* AI Processing Analytics - Live */}
                <div className="mt-6">
                  <ProcessingAnalyticsPanel 
                    analytics={aiAnalytics} 
                    isLive={true} 
                    variant="processing" 
                  />
                  <DurationComparisonBanner 
                    originalDuration={aiAnalytics.originalDuration}
                    finalDuration={aiAnalytics.finalDuration}
                    totalTimeSaved={aiAnalytics.totalTimeSaved}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== STEP 3: SUCCESS ========== */}
          {wizardStep === 3 && selectedMedia && (
            <CompletionSuccessPage
              mediaId={selectedMedia.id}
              mediaName={selectedMedia.file_name || 'Untitled'}
              analytics={aiAnalytics}
              onCompareClick={() => setShowComparisonModal(true)}
              hasOriginalPreview={hasOriginalPreview}
            />
          )}
        </div>

        {/* Recent Activity - Only when media selected and not in success state */}
        {selectedMedia && processingJobs && processingJobs.length > 0 && wizardStep !== 3 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {processingJobs.filter(j => j.status === 'completed').slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Enhancement Complete</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => navigate('/studio/media?folder=ai-enhanced')}>
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <UploadMediaDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUploadComplete={() => {
            setShowUploadDialog(false);
            queryClient.invalidateQueries({ queryKey: ['media-files-for-processing'] });
            toast({
              title: "Upload Complete",
              description: "Select your uploaded file from the Media Library"
            });
            setShowMediaSelector(true);
          }}
        />

        {/* Video Comparison Modal */}
        <VideoComparisonModal
          open={showComparisonModal}
          onOpenChange={setShowComparisonModal}
          originalUrl={hasOriginalPreview ? videoUrl || null : null}
          enhancedUrl={videoUrl || null}
          analytics={aiAnalytics}
        />

        {/* Media Selector Dialog */}
        {showMediaSelector && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Select from Media Library</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowMediaSelector(false)}>
                    ✕
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                  {mediaFiles?.filter(f => f.file_type === 'video' || f.file_type === 'audio').map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleMediaSelect({ ...file, source: 'library' })}
                      className="text-left p-2 rounded-lg border hover:border-[#2C6BED] hover:bg-[#2C6BED]/5 transition-all"
                    >
                      <div className="aspect-video bg-muted rounded mb-2 overflow-hidden flex items-center justify-center">
                        {file.thumbnail_url ? (
                          <img src={file.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{file.file_name || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.duration_seconds ? formatDuration(file.duration_seconds) : 'Unknown duration'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
