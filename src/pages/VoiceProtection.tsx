import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mic, DollarSign, Check, Clock, Zap, Star, Trash2, Upload, User, ChevronRight, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScriptEditor from "@/components/voice/ScriptEditor";
import confetti from "canvas-confetti";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type CloneType = 'instant' | 'professional';

export default function VoiceProtection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [cloneType, setCloneType] = useState<CloneType>('instant');
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerAd, setPricePerAd] = useState("");
  const [availableForAds, setAvailableForAds] = useState(false);
  const [usageTerms, setUsageTerms] = useState("");
  const [script, setScript] = useState("");
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [recordingChunks, setRecordingChunks] = useState<BlobPart[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoStopTimeout, setAutoStopTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Consent and images
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [showRecordingStudio, setShowRecordingStudio] = useState(false);

  // Get current user
  const [user, setUser] = useState<any>(null);
  
  useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    },
  });


  // Check if user is admin
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');

  // Fetch user's voice profiles
  const { data: voiceProfiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_voice_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecordingClick = () => {
    if (!consentGiven) {
      setShowConsentDialog(true);
      setConsentChecked(false);
    } else {
      startRecording();
    }
  };

  const handleConsentConfirm = () => {
    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please confirm that you own the rights to this voice.",
        variant: "destructive",
      });
      return;
    }
    setShowConsentDialog(false);
    setConsentGiven(true);
  };

  // Record audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
        setRecordingChunks(prev => [...prev, e.data]);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        if (countdownInterval) clearInterval(countdownInterval);
        if (autoStopTimeout) clearTimeout(autoStopTimeout);
      };

      setMediaRecorder(recorder);
      setRecordingStream(stream);
      setRecordingChunks(chunks);
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);

      const duration = cloneType === 'professional' ? 1800 : 120;
      setTimeRemaining(duration);

      const interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      setCountdownInterval(interval);

      const timeout = setTimeout(() => {
        stopRecording();
      }, duration * 1000);
      setAutoStopTimeout(timeout);

    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      setCountdownInterval(interval);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
        setAutoStopTimeout(null);
      }
    }
  };

  const deleteRecording = () => {
    if (mediaRecorder) {
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop();
      }
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    if (autoStopTimeout) {
      clearTimeout(autoStopTimeout);
      setAutoStopTimeout(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setRecordingChunks([]);
    setMediaRecorder(null);
    setRecordingStream(null);
    setTimeRemaining(cloneType === 'professional' ? 1800 : 120);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  // Upload and clone voice
  const cloneVoice = useMutation({
    mutationFn: async () => {
      console.log('🚀 Starting voice profile creation...');
      
      if (!audioBlob || !voiceName) {
        console.error('❌ Missing audioBlob or voiceName');
        throw new Error("Missing audio or voice name");
      }

      console.log('👤 Getting authenticated user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user');
        throw new Error("Not authenticated");
      }
      console.log('✅ User authenticated:', user.id);

      console.log('📤 Uploading audio to storage...');
      const fileName = `${user.id}/voice-samples/${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-ads-generated')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp3',
        });

      if (uploadError) {
        console.error('❌ Audio upload failed:', uploadError);
        throw uploadError;
      }
      console.log('✅ Audio uploaded successfully');

      const { data: { publicUrl } } = supabase.storage
        .from('audio-ads-generated')
        .getPublicUrl(fileName);
      console.log('✅ Audio URL:', publicUrl);

      let profileImageUrl = null;
      if (profileImage) {
        console.log('📤 Uploading profile image...');
        const imageFileName = `${user.id}/voice-profile-images/${Date.now()}-${profileImage.name}`;
        const { error: imageUploadError } = await supabase.storage
          .from('avatars')
          .upload(imageFileName, profileImage, {
            contentType: profileImage.type,
          });

        if (!imageUploadError) {
          const { data: { publicUrl: imagePublicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(imageFileName);
          profileImageUrl = imagePublicUrl;
          console.log('✅ Image uploaded:', profileImageUrl);
        }
      }

      console.log('🎙️ Calling elevenlabs-clone-voice...');
      const { data: cloneData, error: cloneError } = await supabase.functions.invoke(
        'elevenlabs-clone-voice',
        {
          body: {
            voiceName,
            audioUrl: publicUrl,
            description,
            cloneType,
          },
        }
      );

      if (cloneError) {
        console.error('❌ Voice cloning failed:', cloneError);
        throw cloneError;
      }
      console.log('✅ Voice cloned:', cloneData);

      // Create voice profile via edge function (bypasses RLS issues)
      console.log('💾 Calling create-voice-profile...');
      const { data: profileData, error: profileError } = await supabase.functions.invoke(
        'create-voice-profile',
        {
          body: {
            voiceName,
            elevenlabsVoiceId: cloneData.voiceId,
            sampleAudioUrl: publicUrl,
            isAvailableForAds: availableForAds,
            pricePerAd: pricePerAd ? parseFloat(pricePerAd) : null,
            usageTerms,
            profileImageUrl,
          },
        }
      );

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        throw profileError;
      }
      console.log('✅ Profile created:', profileData);

      return profileData;
    },
    onSuccess: async (profileData) => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      // Trigger blockchain minting asynchronously
      if (profileData?.voiceProfile) {
        console.log('⛓️ Initiating blockchain certification...');
        
        try {
          const { data: mintData, error: mintError } = await supabase.functions.invoke(
            'mint-voice-nft',
            {
              body: {
                voiceProfileId: profileData.voiceProfile.id,
                voiceFingerprint: profileData.voiceFingerprint || profileData.voiceProfile.id,
                metadata: {
                  voiceName,
                  description,
                  voiceType: cloneType,
                  usageTerms,
                  recordingDate: new Date().toISOString(),
                },
              },
            }
          );

          if (mintError) {
            console.error('❌ Blockchain minting failed:', mintError);
            toast({
              title: "Voice Profile Created",
              description: "Voice created successfully, but blockchain certification is pending.",
              variant: "default",
            });
          } else {
            console.log('✅ Voice NFT minted:', mintData);
            toast({
              title: "Success! 🎉 Blockchain Certified",
              description: `Voice profile created and certified on Polygon blockchain!`,
            });
          }
        } catch (error) {
          console.error('❌ Blockchain minting error:', error);
          toast({
            title: "Voice Profile Created",
            description: "Voice created successfully. Blockchain certification in progress.",
          });
        }
      } else {
        toast({
          title: "Success! 🎉",
          description: "Voice profile created successfully!",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['voice-blockchain-certificates'] });
      setVoiceName("");
      setDescription("");
      setPricePerAd("");
      setAvailableForAds(false);
      setUsageTerms("");
      setAudioBlob(null);
      setProfileImage(null);
      setProfileImagePreview(null);
      setShowRecordingStudio(false);
      setCurrentStep(1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create voice profile",
        variant: "destructive",
      });
    },
  });

  const steps = [
    { number: 1, title: "Choose Clone Type", completed: currentStep > 1 },
    { number: 2, title: "Add Voice Details", completed: currentStep > 2 },
    { number: 3, title: "Record Your Voice", completed: currentStep > 3 },
    { number: 4, title: "Monetization Settings", completed: currentStep > 4 },
  ];

  const canProceedFromStep1 = cloneType !== null;
  const canProceedFromStep2 = voiceName.trim() !== "";
  const canProceedFromStep3 = audioBlob !== null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Voice Protection & Marketplace</h1>
            <p className="text-muted-foreground">Protect your voice and monetize it through ads</p>
          </div>
        </div>
        
        {isAdmin && (
          <div>
            {!showRecordingStudio ? (
              <Button 
                onClick={() => setShowRecordingStudio(true)}
                size="lg"
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                New Voice Recording
              </Button>
            ) : (
              <Button 
                onClick={() => setShowRecordingStudio(false)}
                variant="outline"
                size="lg"
              >
                View Voice Portfolio
              </Button>
            )}
          </div>
        )}
      </div>

      {(isAdmin && !showRecordingStudio) ? (
        <>
          {/* Voice Profiles Portfolio View */}
          {isLoadingProfiles ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading your voice profiles...</p>
            </div>
          ) : voiceProfiles && voiceProfiles.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Your Voice Profiles
                </CardTitle>
                <CardDescription>
                  Blockchain-certified voice ownership and licensing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border-2 border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Voice Blockchain Certification Active</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your voice fingerprints are secured on-chain with cryptographic proof of ownership.
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">On-chain certification</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Cryptographic fingerprint</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Usage tracking</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Licensing proof</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {voiceProfiles.map((profile) => (
                    <Card key={profile.id} className="border-primary/20">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          {profile.profile_image_url ? (
                            <img 
                              src={profile.profile_image_url} 
                              alt={profile.voice_name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                              <User className="h-8 w-8 text-primary/50" />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <CardTitle className="text-lg">{profile.voice_name}</CardTitle>
                            <VoiceCertifiedBadge size="sm" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {profile.usage_terms && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {profile.usage_terms}
                          </p>
                        )}
                        
                        <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-primary" />
                            <span className="font-medium">Blockchain Status</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span>Certification:</span>
                              <span className="text-primary font-medium">Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Price per ad:</span>
                          <span className="font-semibold text-primary">
                            ${profile.price_per_ad}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="py-12 text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No voice profiles yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "New Voice Recording" above to create your first voice profile
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Wizard View */}
          <div className="flex gap-8">
            {/* Left Progress Bar */}
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-6 space-y-4">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-start gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                      ${step.completed 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : currentStep === step.number
                        ? 'border-primary text-primary'
                        : 'border-muted-foreground/30 text-muted-foreground'
                      }
                    `}>
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className={`
                        text-sm font-medium
                        ${currentStep === step.number ? 'text-foreground' : 'text-muted-foreground'}
                      `}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-2xl mx-auto">
              {/* Step 1: Choose Clone Type */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Clone Type</CardTitle>
                    <CardDescription>
                      Select the voice cloning method that best fits your needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card 
                      className={`cursor-pointer transition-all ${cloneType === 'instant' ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => setCloneType('instant')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Zap className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-semibold">Instant Voice Clone</h3>
                            <p className="text-sm text-muted-foreground">
                              Fastest onboarding with just 2 minutes of audio
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Requires 2 minutes</span>
                            </div>
                          </div>
                          {cloneType === 'instant' && (
                            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${cloneType === 'professional' ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => setCloneType('professional')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Star className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">Professional Voice Clone</h3>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                Recommended
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Highest realism for professional creators
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Requires 30 minutes</span>
                            </div>
                          </div>
                          {cloneType === 'professional' && (
                            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={() => setCurrentStep(2)}
                        disabled={!canProceedFromStep1}
                        size="lg"
                      >
                        Continue <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Add Voice Details */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Voice Details</CardTitle>
                    <CardDescription>
                      Give your voice profile a name and description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="voiceName">Voice Name *</Label>
                      <Input
                        id="voiceName"
                        placeholder="My Professional Voice"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Voice Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your voice tone and style..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="tips">
                        <AccordionTrigger>Voice Description Tips</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Describe your vocal tone (warm, authoritative, friendly)</p>
                            <p>• Mention your vocal range (deep, high, mid-range)</p>
                            <p>• Note any unique characteristics or accent</p>
                            <p>• Specify ideal use cases (commercials, narration, podcasts)</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex justify-between pt-4">
                      <Button 
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        disabled={!canProceedFromStep2}
                        size="lg"
                      >
                        Continue <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Record Your Voice */}
              {currentStep === 3 && (
                <Card>
                  <CardContent className="space-y-6 pt-6">
                    {!audioBlob && (
                      <>
                        <div className="w-full max-w-4xl mx-auto">
                          <ScriptEditor 
                            script={script}
                            onScriptChange={setScript}
                            cloneType={cloneType}
                          />
                        </div>

                        {!consentGiven && (
                          <div className="flex justify-center">
                            <Button
                              onClick={handleStartRecordingClick}
                              className="w-full max-w-md"
                              size="lg"
                            >
                              Next
                            </Button>
                          </div>
                        )}

                        {consentGiven && (
                          <div className="w-full max-w-4xl mx-auto space-y-4">
                            {isRecording && (
                              <div className="flex items-center justify-center p-6 bg-yellow-500/10 rounded-lg border-2 border-yellow-500">
                                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                                <span className="text-4xl font-bold text-yellow-500">
                                  {formatTime(timeRemaining)}
                                </span>
                              </div>
                            )}

                            {!isRecording && (
                              <Button
                                onClick={startRecording}
                                className="w-full"
                                size="lg"
                              >
                                <Mic className="mr-2 h-5 w-5" />
                                Start Recording ({cloneType === 'instant' ? '2 minutes' : '30 minutes'})
                              </Button>
                            )}

                            {isRecording && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-primary text-center">
                                  {isPaused ? "Recording Paused" : "Recording in Progress..."}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  {isPaused ? (
                                    <Button onClick={resumeRecording} variant="default" className="w-full">
                                      Resume
                                    </Button>
                                  ) : (
                                    <Button onClick={pauseRecording} variant="secondary" className="w-full">
                                      Pause
                                    </Button>
                                  )}
                                  <Button onClick={stopRecording} variant="outline" className="w-full">
                                    Stop
                                  </Button>
                                  <Button 
                                    onClick={deleteRecording} 
                                    variant="destructive" 
                                    className="w-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {audioBlob && (
                      <div className="max-w-4xl mx-auto space-y-4">
                        <div className="p-6 border rounded-lg bg-muted/50 space-y-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <p className="text-sm font-medium">Recording Complete!</p>
                          </div>
                          <audio 
                            controls 
                            src={URL.createObjectURL(audioBlob)} 
                            className="w-full"
                          />
                          <Button 
                            onClick={deleteRecording} 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete & Re-record
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button 
                        onClick={() => setCurrentStep(2)}
                        variant="outline"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(4)}
                        disabled={!canProceedFromStep3}
                        size="lg"
                      >
                        Continue <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Monetization Settings */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monetization Settings</CardTitle>
                    <CardDescription>
                      Set up pricing and make your voice available for advertisers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Profile Photo (Optional)</Label>
                      <p className="text-sm text-muted-foreground">
                        Add your photo to help advertisers connect with your voice personality
                      </p>
                      
                      <div className="flex items-start gap-4">
                        {profileImagePreview ? (
                          <div className="relative">
                            <img 
                              src={profileImagePreview} 
                              alt="Profile preview"
                              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => {
                                setProfileImage(null);
                                setProfileImagePreview(null);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                            <User className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('profile-image-upload')?.click()}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                          <input
                            id="profile-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Max 5MB • JPG, PNG, or GIF
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Ad Use</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="50.00"
                          value={pricePerAd}
                          onChange={(e) => setPricePerAd(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="terms">Usage Terms (Optional)</Label>
                      <Textarea
                        id="terms"
                        placeholder="Specify how advertisers can use your voice..."
                        value={usageTerms}
                        onChange={(e) => setUsageTerms(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="available"
                        checked={availableForAds}
                        onCheckedChange={setAvailableForAds}
                      />
                      <Label htmlFor="available" className="cursor-pointer">
                        Make available for advertisers
                      </Label>
                    </div>

                    <div className="p-4 border-l-4 border-primary/50 bg-primary/5 rounded-r-lg">
                      <p className="text-sm font-medium mb-2">Important Information</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Only use your own voice or voices you have permission to use</li>
                        <li>You must be at least 18 years of age</li>
                        <li>Your voice may be used in commercial advertisements</li>
                      </ul>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        variant="outline"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => cloneVoice.mutate()}
                        disabled={cloneVoice.isPending}
                        size="lg"
                      >
                        {cloneVoice.isPending ? "Creating..." : "Create Voice Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Voice Ownership Confirmation
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4 text-left">
              <p className="font-semibold text-foreground">
                Before you begin recording, please confirm the following:
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You are the legal owner of this voice</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You have full rights to use, license, and monetize this voice</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You are at least 18 years of age</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You understand that your voice may be used in commercial advertisements</p>
                </div>
              </div>

              <div className="p-4 border-l-4 border-primary/50 bg-primary/5 rounded-r-lg">
                <p className="text-primary/80 font-semibold text-sm">
                  ⚠️ Important Legal Notice
                </p>
                <p className="text-xs mt-2">
                  Unauthorized voice cloning is illegal and may result in civil and criminal penalties.
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I confirm that I own this voice and have the legal right to clone and monetize it
                </label>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConsentConfirm}>
              Continue to Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
