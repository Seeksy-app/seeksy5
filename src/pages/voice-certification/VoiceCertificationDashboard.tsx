import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Shield, Check, Sparkles, Lock, Mic2, ScanFace } from "lucide-react";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";
import { FaceCertificationCard } from "@/components/identity/FaceCertificationCard";
import { supabase } from "@/integrations/supabase/client";

const VoiceCertificationDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [faceIdentity, setFaceIdentity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("voice");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchFaceIdentity(user.id);
      }
    });
  }, []);

  const fetchFaceIdentity = async (userId: string) => {
    const { data } = await supabase
      .from("face_identity")
      .select("*")
      .eq("user_id", userId)
      .single();
    setFaceIdentity(data);
  };

  const voiceBenefits = [
    {
      icon: Shield,
      title: "Cryptographic Voice Fingerprint",
      description: "We generate a unique, tamper-proof digital signature of your voice using AI audio embedding."
    },
    {
      icon: Check,
      title: "Trusted Verification",
      description: "Your voice sample is compared to your recorded fingerprint to confirm it's truly you."
    },
    {
      icon: Sparkles,
      title: "Protect Your Voice Everywhere",
      description: "Certification helps protect your identity across podcasts, videos, and AI systems."
    },
    {
      icon: Lock,
      title: "Permanent Voice Credential",
      description: "Receive a verified voice certificate stored on-chain for maximum trust and transparency."
    }
  ];

  const faceBenefits = [
    {
      icon: ScanFace,
      title: "AI Face Fingerprint",
      description: "We analyze your unique facial features to create a digital fingerprint for matching."
    },
    {
      icon: Check,
      title: "Video Appearance Detection",
      description: "Find videos on YouTube, Instagram, and TikTok where your face appears."
    },
    {
      icon: Sparkles,
      title: "Automated Discovery",
      description: "Our AI scans video content to automatically find your guest appearances."
    },
    {
      icon: Lock,
      title: "Identity Protection",
      description: "Detect unauthorized use of your likeness in video content."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <CertificationStepper 
          currentStep={1} 
          totalSteps={7} 
          stepLabel="Get Started"
        />

        <div className="text-center space-y-6 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Identity Certification</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Certify Your Identity
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create blockchain-verified credentials for your voice and face to prove authenticity and track your appearances.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic2 className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="face" className="flex items-center gap-2">
              <ScanFace className="h-4 w-4" />
              Face
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {voiceBenefits.map((benefit) => (
                <Card key={benefit.title} className="p-6 border-2 hover:border-primary/30 transition-colors">
                  <benefit.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/voice-certification/upload")}
                className="text-lg px-12 py-6 h-auto"
              >
                <Mic2 className="mr-2 h-5 w-5" />
                Start Voice Certification
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="face" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {faceBenefits.map((benefit) => (
                <Card key={benefit.title} className="p-6 border-2 hover:border-primary/30 transition-colors">
                  <benefit.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>

            {user && (
              <div className="max-w-xl mx-auto">
                <FaceCertificationCard
                  userId={user.id}
                  faceIdentity={faceIdentity}
                  onCertified={() => fetchFaceIdentity(user.id)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VoiceCertificationDashboard;
