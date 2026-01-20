import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, MessageSquare, Check, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type AdType = "standard" | "conversational" | null;

const CreateAudioAdWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAdType, setSelectedAdType] = useState<AdType>(null);

  const steps = [
    { number: 1, title: "Choose Ad Type", description: "Select the type of audio ad" },
    { number: 2, title: "Create Your Ad", description: "Configure your ad details" },
  ];

  const handleAdTypeSelect = (type: AdType) => {
    setSelectedAdType(type);
    // Navigate to the appropriate page after short delay for visual feedback
    setTimeout(() => {
      if (type === "standard") {
        navigate("/advertiser/create-audio-ad");
      } else if (type === "conversational") {
        navigate("/advertiser/create-conversational-ad");
      }
    }, 300);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/advertiser/campaigns/create-type")}
          className="mb-6 text-foreground"
        >
          ← Back to Ad Types
        </Button>
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3 text-foreground">Create Your Audio Ad</h1>
          <p className="text-xl text-muted-foreground">
            Follow these simple steps to create your audio advertisement
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold transition-all ${
                      currentStep >= step.number
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground mx-4" />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="animate-in fade-in-50 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Your Ad Format</h2>
              <p className="text-muted-foreground">
                Select the type of audio ad that best fits your needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Standard Audio Ad */}
              <Card
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  selectedAdType === "standard" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleAdTypeSelect("standard")}
              >
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/20 mb-4 mx-auto">
                    <Volume2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl text-center">Standard Audio Ad</CardTitle>
                  <CardDescription className="text-center text-base">
                    Create a traditional audio advertisement with AI text-to-speech
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">AI-generated voice</p>
                        <p className="text-sm text-muted-foreground">Choose from multiple professional voices</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Custom script or AI-assisted</p>
                        <p className="text-sm text-muted-foreground">Write your own or use AI generation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Multiple voice options</p>
                        <p className="text-sm text-muted-foreground">Wide variety of AI voices to choose from</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">15-60 second durations</p>
                        <p className="text-sm text-muted-foreground">Perfect for podcast ad spots</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6" size="lg">
                    Create Standard Ad
                  </Button>
                </CardContent>
              </Card>

              {/* Conversational AI Ad */}
              <Card
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  selectedAdType === "conversational" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleAdTypeSelect("conversational")}
              >
                <div className="absolute top-4 right-4">
                  <Badge className="text-xs bg-purple-600 hover:bg-purple-700">Premium</Badge>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/20 mb-4 mx-auto">
                    <MessageSquare className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl text-center">Conversational AI Ad</CardTitle>
                  <CardDescription className="text-center text-base">
                    Interactive voice ads where listeners can ask questions (Pay per Query)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Interactive conversations</p>
                        <p className="text-sm text-muted-foreground">Real-time voice interactions with listeners</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Answer listener questions</p>
                        <p className="text-sm text-muted-foreground">AI responds naturally to inquiries</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Powered by ElevenLabs AI</p>
                        <p className="text-sm text-muted-foreground">Advanced conversational technology</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Higher engagement rates</p>
                        <p className="text-sm text-muted-foreground">More memorable and effective</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700" size="lg">
                    Create Conversational Ad
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate("/advertiser/campaigns/create-type")}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAudioAdWizard;
