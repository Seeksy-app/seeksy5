import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Volume2, CheckCircle, Play, Pause } from "lucide-react";
import { AudioWaveform } from "@/components/AudioWaveform";

const CreateAudioAd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adDuration, setAdDuration] = useState("30");
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [aiMode, setAiMode] = useState<"generate" | "refine">("generate");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [callToAction, setCallToAction] = useState<"phone" | "cta">("phone");
  const [ctaText, setCtaText] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+1 202 952 1925");
  const [showScriptApproval, setShowScriptApproval] = useState(false);
  const [fullScriptForApproval, setFullScriptForApproval] = useState("");
  const [aiInputs, setAiInputs] = useState({
    productDetails: "",
    targetAudience: "",
    keyMessage: "",
    existingScript: "",
  });

  // Fetch current user's advertiser profile
  const { data: advertiser } = useQuery({
    queryKey: ['current-advertiser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .eq('owner_profile_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch available voices from ElevenLabs
  const { data: voicesData, isLoading: voicesLoading, error: voicesError } = useQuery({
    queryKey: ['elevenlabs-voices'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-voices');
      if (error) {
        console.error('ElevenLabs voices error:', error);
        throw error;
      }
      return data;
    },
    retry: 2,
  });

  useEffect(() => {
    if (voicesError) {
      toast({
        title: "Failed to load voices",
        description: "Please check your ElevenLabs API key configuration.",
        variant: "destructive",
      });
    }
  }, [voicesError, toast]);

  // Generate audio mutation
  const generateAudio = useMutation({
    mutationFn: async ({ fullScript }: { fullScript: string }) => {
      if (!fullScript.trim() || !selectedVoice || !advertiser) {
        throw new Error('Missing required fields');
      }

      // Create audio_ads record
      const { data: audioAd, error: insertError } = await supabase
        .from('audio_ads')
        .insert({
          advertiser_id: advertiser.id,
          script: fullScript.trim(),
          voice_id: selectedVoice.id,
          voice_name: selectedVoice.name,
          status: 'generating',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to generate audio
      const { data, error } = await supabase.functions.invoke('elevenlabs-generate-audio', {
        body: {
          audioAdId: audioAd.id,
          script: fullScript.trim(),
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
        },
      });

      if (error) {
        // Update status to failed if edge function errors
        await supabase
          .from('audio_ads')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', audioAd.id);
        throw error;
      }
      
      return { ...data, audioAdId: audioAd.id };
    },
    onSuccess: (data) => {
      toast({
        title: "Audio ad generated!",
        description: "Preview your ad and approve it to add to your library.",
      });
      setGeneratedAudioUrl(data.audioUrl);
      queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
      // Don't navigate away - let user preview and approve
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes('payment_issue') || errorMessage?.includes('401')) {
        toast({
          title: "ElevenLabs Payment Required",
          description: "Please complete your ElevenLabs subscription payment at elevenlabs.io to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Generation failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setIsGenerating(false);
    },
  });

  const handlePrepareScript = () => {
    if (!script.trim()) {
      toast({
        title: "Script required",
        description: "Please enter a script for your audio ad.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: "Voice required",
        description: "Please select a voice for your audio ad.",
        variant: "destructive",
      });
      return;
    }

    if (callToAction === "cta" && !ctaText.trim()) {
      toast({
        title: "CTA text required",
        description: "Please enter your call-to-action text.",
        variant: "destructive",
      });
      return;
    }

    // Append phone number or CTA to script
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const digitsSpoken = digitsOnly.split('').join(' ');
    const ctaAppend = callToAction === "phone" 
      ? ` Call us now at ${digitsSpoken}. That's ${digitsSpoken}.`
      : ` ${ctaText}`;
    
    const fullScript = script.trim() + ctaAppend;
    setFullScriptForApproval(fullScript);
    setShowScriptApproval(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowScriptApproval(false);
    try {
      await generateAudio.mutateAsync({ fullScript: fullScriptForApproval });
    } catch (error: any) {
      if (error.message?.includes('payment_issue') || error.message?.includes('401')) {
        toast({
          title: "ElevenLabs Payment Required",
          description: "Please complete your ElevenLabs subscription payment at elevenlabs.io to generate audio ads.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateScript = async () => {
    if (aiMode === "refine" && !aiInputs.existingScript.trim()) {
      toast({
        title: "Script required",
        description: "Please paste your existing script to refine.",
        variant: "destructive",
      });
      return;
    }

    if (aiMode === "generate" && (!aiInputs.productDetails || !aiInputs.targetAudience || !aiInputs.keyMessage)) {
      toast({
        title: "Missing information",
        description: "Please fill in all AI generation fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScript(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-script', {
        body: { ...aiInputs, duration: adDuration, mode: aiMode },
      });

      if (error) throw error;

      setScript(data.script);
      setShowAIGenerator(false);
      toast({
        title: aiMode === "refine" ? "Script refined!" : "Script generated!",
        description: "Your ad script has been created. You can edit it before generating audio.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);
  const targetWords = Math.floor((parseInt(adDuration) * 150) / 60);
  const isDurationMismatch = Math.abs(estimatedDuration - parseInt(adDuration)) > 5;

  const handlePlayPreview = (voiceId: string, previewUrl: string) => {
    if (playingVoiceId === voiceId) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(previewUrl);
      audioRef.current.play();
      setPlayingVoiceId(voiceId);
      audioRef.current.onended = () => setPlayingVoiceId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/advertiser/create-ad-wizard")}
            className="mb-4"
          >
            ← Back to Ad Types
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20">
              <Volume2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Standard Audio Ad</h1>
              <p className="text-muted-foreground">
                Generate professional audio ads using AI text-to-speech
              </p>
            </div>
          </div>
          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="bg-background">Step 1 of 3</Badge>
            <span>Configure your audio advertisement</span>
          </div>
        </div>

        <div className="grid gap-6">
        <Card className="border-2">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                1
              </div>
              <CardTitle>Ad Length</CardTitle>
            </div>
            <CardDescription>
              Choose the target duration for your audio ad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={adDuration} onValueChange={setAdDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="45">45 seconds</SelectItem>
                <SelectItem value="60">60 seconds</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                2
              </div>
              <CardTitle>Create Your Ad Script</CardTitle>
            </div>
            <CardDescription>
              Write your ad script or use AI to generate one. Average speaking rate: ~150 words/minute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {!showAIGenerator && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiMode("generate");
                      setShowAIGenerator(true);
                    }}
                    className="flex-1"
                  >
                    ✨ Generate with AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiMode("refine");
                      setAiInputs({ ...aiInputs, existingScript: script });
                      setShowAIGenerator(true);
                    }}
                    className="flex-1"
                  >
                    🔧 Refine with AI
                  </Button>
                </>
              )}
            </div>

            {showAIGenerator && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {aiMode === "generate" ? "AI Script Generator" : "AI Script Refiner"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIGenerator(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="space-y-3">
                  {aiMode === "refine" ? (
                    <div>
                      <Label>Your Existing Script</Label>
                      <Textarea
                        placeholder="Paste your existing ad script here..."
                        value={aiInputs.existingScript}
                        onChange={(e) => setAiInputs({ ...aiInputs, existingScript: e.target.value })}
                        rows={6}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>Product/Service Details</Label>
                        <Textarea
                          placeholder="What are you advertising? (e.g., New eco-friendly water bottles, durable and stylish)"
                          value={aiInputs.productDetails}
                          onChange={(e) => setAiInputs({ ...aiInputs, productDetails: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Target Audience</Label>
                        <Textarea
                          placeholder="Who is this ad for? (e.g., Environmentally conscious millennials, fitness enthusiasts)"
                          value={aiInputs.targetAudience}
                          onChange={(e) => setAiInputs({ ...aiInputs, targetAudience: e.target.value })}
                          rows={2}
                        />
                      </div>
                       <div>
                         <Label>Key Message</Label>
                         <Textarea
                           placeholder="What's your main message? (e.g., Save the planet one sip at a time, 50% off launch special)"
                           value={aiInputs.keyMessage}
                           onChange={(e) => setAiInputs({ ...aiInputs, keyMessage: e.target.value })}
                           rows={2}
                         />
                       </div>
                    </>
                  )}
                  <Button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="w-full"
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {aiMode === "refine" ? "Refining Script..." : "Generating Script..."}
                      </>
                    ) : (
                      aiMode === "refine" ? "Refine Script" : "Generate Script"
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="script">Ad Script (For Host to Read)</Label>
                <Badge variant="outline" className="text-xs">
                  Will be provided to podcast hosts
                </Badge>
              </div>
              <Textarea
                id="script"
                placeholder="Enter your ad script here... This script will be provided to podcast hosts to read during their shows."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={8}
                className="mt-2"
              />
              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{wordCount} words (target: ~{targetWords})</span>
                  <span>Target: {adDuration}s</span>
                  <span className={isDurationMismatch ? "text-destructive font-medium" : ""}>
                    Estimated: {estimatedDuration}s
                  </span>
                </div>
                {isDurationMismatch && (
                  <span className="text-xs text-destructive">
                    ⚠ Script length doesn't match target duration
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                3
              </div>
              <CardTitle>Choose Call-to-Action</CardTitle>
            </div>
            <CardDescription>
              Select how listeners should respond - we'll automatically add this to your audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  callToAction === "phone"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setCallToAction("phone")}
              >
                <h3 className="font-medium mb-2">📞 Phone Number</h3>
                <p className="text-sm text-muted-foreground">Speak the phone number for listeners to call</p>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  callToAction === "cta"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setCallToAction("cta")}
              >
                <h3 className="font-medium mb-2">🔗 Custom CTA</h3>
                <p className="text-sm text-muted-foreground">Speak a custom call-to-action message</p>
              </div>
            </div>

            {callToAction === "phone" ? (
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  disabled
                  className="mt-2 opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be spoken digit-by-digit at the end of the ad
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="ctaText">Call-to-Action Text</Label>
                <Input
                  id="ctaText"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Visit our website at example dot com"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: "Visit our website at example dot com" or "Text START to five five five twelve thirty four"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                4
              </div>
              <CardTitle>Select Voice</CardTitle>
            </div>
            <CardDescription>
              Choose from our library of professional voices powered by ElevenLabs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {voicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading voices...</span>
              </div>
            ) : voicesError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load voices. Please check your ElevenLabs API configuration.</p>
              </div>
            ) : !voicesData?.voices?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No voices available. Please configure your ElevenLabs API key.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedVoice && (
                  <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{selectedVoice.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVoice(null);
                          if (audioRef.current) {
                            audioRef.current.pause();
                            setPlayingVoiceId(null);
                          }
                        }}
                      >
                        Change Voice
                      </Button>
                    </div>
                  </div>
                )}
                {!selectedVoice && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    <p className="text-sm text-muted-foreground mb-3">Click a voice to preview and select</p>
                    {voicesData.voices.map((voice: any) => (
                      <div
                        key={voice.voice_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => setSelectedVoice({ id: voice.voice_id, name: voice.name })}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{voice.name}</p>
                            {voice.labels && (
                              <p className="text-xs text-muted-foreground">
                                {voice.labels.accent && `${voice.labels.accent} • `}
                                {voice.labels.description || voice.labels.use_case}
                              </p>
                            )}
                          </div>
                        </div>
                        {voice.preview_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(voice.voice_id, voice.preview_url);
                            }}
                          >
                            {playingVoiceId === voice.voice_id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isGenerating && (
          <Card className="border-primary">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Generating Your Audio Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    This may take a moment... Please don't close this page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {generatedAudioUrl && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Audio Generated Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AudioWaveform audioUrl={generatedAudioUrl} />
                <audio controls className="w-full" src={generatedAudioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => navigate('/advertiser/campaigns')}>
                  Use in Campaign
                </Button>
                <Button variant="outline" onClick={() => {
                  setGeneratedAudioUrl(null);
                  setScript("");
                  setSelectedVoice(null);
                }}>
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!showScriptApproval ? (
          <Card className="border-2 border-primary/50">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  5
                </div>
                <CardTitle>Generate Your Ad</CardTitle>
              </div>
              <CardDescription>
                Review and generate your audio advertisement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  onClick={handlePrepareScript}
                  disabled={isGenerating || !script.trim() || !selectedVoice}
                  className="flex-1"
                  size="lg"
                >
                  Preview & Generate Audio
                </Button>
                <Button variant="outline" onClick={() => navigate('/advertiser/create-ad-wizard')} size="lg">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Review Final Script</CardTitle>
              <CardDescription>
                This is the complete script that will be spoken in your ad, including the call-to-action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{fullScriptForApproval}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowScriptApproval(false)}
                  disabled={isGenerating}
                >
                  Edit Script
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Audio Ad...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Generate Audio
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Audio Preview and Approval */}
        {generatedAudioUrl && (
          <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle>Audio Generated Successfully!</CardTitle>
              </div>
              <CardDescription>
                Listen to your ad and approve it to add to your library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background rounded-lg border">
                <audio controls src={generatedAudioUrl} className="w-full" />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={async () => {
                    // Approve the ad by updating status to 'ready'
                    const { error } = await supabase
                      .from('audio_ads')
                      .update({ status: 'ready' })
                      .eq('audio_url', generatedAudioUrl);
                    
                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to approve ad",
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Ad Approved! 🎉",
                        description: "Your ad has been added to your library and is ready to use.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
                      setTimeout(() => navigate('/advertiser/ads'), 1500);
                    }
                  }}
                  className="flex-1"
                  size="lg"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Add to Library
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedAudioUrl(null);
                    setScript("");
                    setShowScriptApproval(false);
                  }}
                >
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateAudioAd;
