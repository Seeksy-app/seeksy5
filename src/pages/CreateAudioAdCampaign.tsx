import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle, Phone } from "lucide-react";
import { AudioWaveform } from "@/components/AudioWaveform";

const CreateAudioAdCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Campaign details
  const [campaignName, setcampaignName] = useState("");
  const [advertiserName, setAdvertiserName] = useState("");
  const [payoutType, setPayoutType] = useState<"ppi" | "ppc">("ppi");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Ad creation
  const [adScript, setAdScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioAdId, setAudioAdId] = useState<string | null>(null);

  // Greeting creation
  const [greetingScript, setGreetingScript] = useState("");
  const [greetingAudioUrl, setGreetingAudioUrl] = useState<string | null>(null);

  // Fetch advertiser
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
      if (data) setAdvertiserName(data.company_name);
      return data;
    },
  });

  // Fetch voices
  const { data: voicesData, isLoading: voicesLoading } = useQuery({
    queryKey: ['elevenlabs-voices'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-voices');
      if (error) throw error;
      return data;
    },
  });

  // Generate tracking number
  const generateTrackingNumber = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-tracking-number');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setTrackingNumber(data.trackingNumber);
      toast({
        title: "Tracking number generated!",
        description: data.note || "Your campaign tracking number is ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate audio ad
  const generateAudioAd = useMutation({
    mutationFn: async () => {
      if (!advertiser || !adScript.trim() || !selectedVoice) {
        throw new Error('Missing required fields');
      }

      const { data: audioAd, error: insertError } = await supabase
        .from('audio_ads')
        .insert({
          advertiser_id: advertiser.id,
          campaign_name: campaignName,
          promo_code: promoCode,
          payout_type: payoutType,
          payout_amount: parseFloat(payoutAmount),
          tracking_phone_number: trackingNumber,
          script: adScript.trim(),
          voice_id: selectedVoice.id,
          voice_name: selectedVoice.name,
          status: 'generating',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setAudioAdId(audioAd.id);

      const { data, error } = await supabase.functions.invoke('elevenlabs-generate-audio', {
        body: {
          audioAdId: audioAd.id,
          script: adScript.trim(),
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedAudioUrl(data.audioUrl);
      toast({
        title: "Audio ad generated!",
        description: "Your podcast ad is ready. Now create the call greeting.",
      });
      setStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate greeting
  const generateGreeting = useMutation({
    mutationFn: async () => {
      if (!audioAdId || !greetingScript.trim() || !selectedVoice) {
        throw new Error('Missing required fields');
      }

      const { data, error } = await supabase.functions.invoke('elevenlabs-generate-greeting', {
        body: {
          audioAdId,
          greetingScript: greetingScript.trim(),
          voiceId: selectedVoice.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGreetingAudioUrl(data.greetingUrl);
      toast({
        title: "Call greeting generated!",
        description: "Your campaign is now complete and ready to go live.",
      });
      setTimeout(() => {
        navigate('/advertiser/ads');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canProceedStep1 = campaignName && advertiserName && payoutAmount && promoCode && trackingNumber;
  const canProceedStep2 = adScript.trim() && selectedVoice;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create AI Audio Ad Campaign</h1>
        <p className="text-muted-foreground">
          Generate podcast ads + call-in greetings with tracking
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Campaign Setup */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Campaign Setup</CardTitle>
            <CardDescription>Configure your campaign details and tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                placeholder="Summer 2024 Podcast Campaign"
                value={campaignName}
                onChange={(e) => setcampaignName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="advertiserName">Advertiser Name</Label>
              <Input
                id="advertiserName"
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payout Type</Label>
                <Select value={payoutType} onValueChange={(v: "ppi" | "ppc") => setPayoutType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ppi">PPI (Per Inquiry)</SelectItem>
                    <SelectItem value="ppc">PPC (Per Qualified Call)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payoutAmount">Payout Amount ($)</Label>
                <Input
                  id="payoutAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="promoCode">Promo Code</Label>
              <Input
                id="promoCode"
                placeholder="POD123"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Listeners will use this code to track attribution
              </p>
            </div>

            <div>
              <Label>Tracking Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="+1 XXX XXX XXXX"
                  disabled={generateTrackingNumber.isPending}
                />
                <Button
                  onClick={() => generateTrackingNumber.mutate()}
                  disabled={generateTrackingNumber.isPending}
                  variant="outline"
                >
                  {generateTrackingNumber.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Generate a unique tracking number for this campaign
              </p>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full"
            >
              Continue to Ad Creation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create Audio Ad */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Create Podcast Audio Ad</CardTitle>
            <CardDescription>Write your ad script and generate the audio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adScript">Ad Script</Label>
              <Textarea
                id="adScript"
                placeholder={`Looking for the perfect gift? Try our premium coffee subscription! Use promo code ${promoCode || 'YOURCODE'} at checkout. Call ${trackingNumber || 'XXX-XXX-XXXX'} to learn more.`}
                value={adScript}
                onChange={(e) => setAdScript(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include your promo code and phone number in the script
              </p>
            </div>

            <div>
              <Label>Select Voice</Label>
              {voicesLoading ? (
                <div className="flex items-center gap-2 p-4 border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading voices...</span>
                </div>
              ) : (
                <Select
                  value={selectedVoice?.id}
                  onValueChange={(id) => {
                    const voice = voicesData?.voices?.find((v: any) => v.voice_id === id);
                    if (voice) setSelectedVoice({ id: voice.voice_id, name: voice.name });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voicesData?.voices?.map((voice: any) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {generatedAudioUrl && (
              <div>
                <Label>Preview Audio Ad</Label>
                <AudioWaveform audioUrl={generatedAudioUrl} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => generateAudioAd.mutate()}
                disabled={!canProceedStep2 || generateAudioAd.isPending}
                className="flex-1"
              >
                {generateAudioAd.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Audio Ad"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Create Call Greeting */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Create Call-In Greeting</CardTitle>
            <CardDescription>
              This greeting plays when someone calls {trackingNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="greetingScript">Greeting Script</Label>
              <Textarea
                id="greetingScript"
                placeholder={`Thank you for calling ${advertiserName}! A representative will be with you shortly. Please remember to mention promo code ${promoCode} to receive your special offer.`}
                value={greetingScript}
                onChange={(e) => setGreetingScript(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This message greets callers before connecting to your team
              </p>
            </div>

            {greetingAudioUrl && (
              <div>
                <Label>Preview Call Greeting</Label>
                <AudioWaveform audioUrl={greetingAudioUrl} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => generateGreeting.mutate()}
                disabled={!greetingScript.trim() || generateGreeting.isPending}
                className="flex-1"
              >
                {generateGreeting.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Greeting & Complete"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateAudioAdCampaign;
