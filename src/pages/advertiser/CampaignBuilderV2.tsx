import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  DollarSign,
  Users,
  Image,
  Check,
  Sparkles,
  Target,
  Eye,
  TrendingUp,
} from "lucide-react";
import { demoCreatorsV2, demoAdsV2 } from "@/data/advertiserDemoDataV2";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Campaign Details", icon: Target },
  { id: 2, title: "Choose Creators", icon: Users },
  { id: 3, title: "Choose Ads", icon: Image },
  { id: 4, title: "Review & Launch", icon: Check },
];

const CampaignBuilderV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCreator = searchParams.get("creator");

  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    budget: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [selectedCreators, setSelectedCreators] = useState<string[]>(
    preselectedCreator ? [preselectedCreator] : []
  );
  const [selectedAds, setSelectedAds] = useState<string[]>([]);

  const toggleCreator = (id: string) => {
    setSelectedCreators((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAd = (id: string) => {
    setSelectedAds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name && campaignData.budget && campaignData.startDate && campaignData.endDate;
      case 2:
        return selectedCreators.length > 0;
      case 3:
        return selectedAds.length > 0;
      default:
        return true;
    }
  };

  const handleLaunch = () => {
    toast.success("Campaign launched successfully!", {
      description: `${campaignData.name} is now live with ${selectedCreators.length} creators.`,
    });
    navigate("/advertiser/dashboard-v2");
  };

  // Estimated metrics
  const selectedCreatorData = demoCreatorsV2.filter((c) => selectedCreators.includes(c.id));
  const totalReach = selectedCreatorData.reduce((sum, c) => sum + c.followers, 0);
  const avgCTR = selectedCreatorData.length
    ? selectedCreatorData.reduce((sum, c) => sum + c.avgCTR, 0) / selectedCreatorData.length
    : 0;
  const avgCPM = selectedCreatorData.length
    ? selectedCreatorData.reduce((sum, c) => sum + c.avgCPM, 0) / selectedCreatorData.length
    : 0;
  const estimatedImpressions = campaignData.budget ? (parseFloat(campaignData.budget) / avgCPM) * 1000 : 0;

  // AI Recommended creators
  const recommendedCreators = demoCreatorsV2
    .filter((c) => !selectedCreators.includes(c.id))
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Campaign Builder</h1>
            <p className="text-white/70">Create a new advertising campaign</p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="p-4 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    currentStep === step.id
                      ? "bg-[#2C6BED] text-white"
                      : currentStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Campaign Details */}
            {currentStep === 1 && (
              <Card className="p-6 bg-white/95 backdrop-blur">
                <h2 className="text-lg font-semibold text-[#053877] mb-6">Campaign Details</h2>
                <div className="grid gap-6">
                  <div>
                    <Label>Campaign Name</Label>
                    <Input
                      placeholder="e.g., Q4 Holiday Push"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Budget</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="10000"
                        value={campaignData.budget}
                        onChange={(e) => setCampaignData({ ...campaignData, budget: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full mt-1 justify-start">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {campaignData.startDate ? format(campaignData.startDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={campaignData.startDate}
                            onSelect={(date) => setCampaignData({ ...campaignData, startDate: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full mt-1 justify-start">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {campaignData.endDate ? format(campaignData.endDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={campaignData.endDate}
                            onSelect={(date) => setCampaignData({ ...campaignData, endDate: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Choose Creators */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* AI Recommended */}
                <Card className="p-6 bg-white/95 backdrop-blur">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-[#053877]">Best Fit Creators</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {recommendedCreators.map((creator) => (
                      <Card
                        key={creator.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedCreators.includes(creator.id)
                            ? "ring-2 ring-[#2C6BED] bg-[#2C6BED]/5"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => toggleCreator(creator.id)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-12 w-12 mb-2">
                            <AvatarImage src={creator.avatarUrl} />
                            <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">{creator.niche}</p>
                          <Badge className="mt-2 bg-amber-100 text-amber-700">Score: {creator.performanceScore}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* All Creators */}
                <Card className="p-6 bg-white/95 backdrop-blur">
                  <h2 className="text-lg font-semibold text-[#053877] mb-4">
                    All Creators ({selectedCreators.length} selected)
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                    {demoCreatorsV2.map((creator) => (
                      <div
                        key={creator.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedCreators.includes(creator.id)
                            ? "border-[#2C6BED] bg-[#2C6BED]/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleCreator(creator.id)}
                      >
                        <Checkbox checked={selectedCreators.includes(creator.id)} />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={creator.avatarUrl} />
                          <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">{(creator.followers / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Step 3: Choose Ads */}
            {currentStep === 3 && (
              <Card className="p-6 bg-white/95 backdrop-blur">
                <h2 className="text-lg font-semibold text-[#053877] mb-4">
                  Choose Ads ({selectedAds.length} selected)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {demoAdsV2.filter((ad) => ad.status !== "draft").map((ad) => (
                    <Card
                      key={ad.id}
                      className={`overflow-hidden cursor-pointer transition-all ${
                        selectedAds.includes(ad.id)
                          ? "ring-2 ring-[#2C6BED]"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => toggleAd(ad.id)}
                    >
                      <div className="relative aspect-video">
                        <img src={ad.thumbnailUrl} alt={ad.title} className="w-full h-full object-cover" />
                        {selectedAds.includes(ad.id) && (
                          <div className="absolute inset-0 bg-[#2C6BED]/20 flex items-center justify-center">
                            <div className="bg-[#2C6BED] rounded-full p-2">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{ad.title}</p>
                        <p className="text-xs text-muted-foreground">{ad.type}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Step 4: Review & Launch */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card className="p-6 bg-white/95 backdrop-blur">
                  <h2 className="text-lg font-semibold text-[#053877] mb-6">Review Campaign</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Campaign Name</p>
                        <p className="font-semibold">{campaignData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">${parseFloat(campaignData.budget || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">
                          {campaignData.startDate && format(campaignData.startDate, "MMM d")} -{" "}
                          {campaignData.endDate && format(campaignData.endDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Creators</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedCreatorData.map((c) => (
                            <Badge key={c.id} variant="secondary">{c.name}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ads</p>
                        <p className="font-semibold">{selectedAds.length} ads selected</p>
                      </div>
                    </div>

                    {/* Estimated Metrics */}
                    <Card className="p-4 bg-[#053877]/5">
                      <h3 className="text-sm font-semibold text-[#053877] mb-4">Estimated Performance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Est. Impressions</span>
                          </div>
                          <span className="font-semibold">{Math.round(estimatedImpressions).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Total Reach</span>
                          </div>
                          <span className="font-semibold">{(totalReach / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Avg CTR</span>
                          </div>
                          <span className="font-semibold">{avgCTR.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-600" />
                            <span className="text-sm">Avg CPM</span>
                          </div>
                          <span className="font-semibold">${avgCPM.toFixed(2)}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep < 4 ? (
            <Button
              className="bg-[#2C6BED] hover:bg-[#2C6BED]/90"
              onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleLaunch}
            >
              Launch Campaign
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CampaignBuilderV2;
