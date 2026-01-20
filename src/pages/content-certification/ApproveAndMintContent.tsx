import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const ApproveAndMintContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticityData = location.state?.authenticityData || {
    overallScore: 88,
    tamperDetected: true,
    aiProbability: 35
  };
  const voiceData = location.state?.voiceData?.selectedVoice || {
    voiceName: "Christy Louis",
    confidence: 97
  };

  const handleMintCertificate = () => {
    navigate("/content-certification/minting-progress", {
      state: { ...location.state }
    });
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Approve & Mint Content Certificate
        </h1>

        <p className="text-white/80 text-lg">
          Your content will be certified on the Polygon network and minted as an authenticity NFT.
        </p>

        <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Primary Voice:</span>
            <span className="font-bold text-xl">{voiceData.voiceName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Voice Match:</span>
            <span className="font-bold text-xl text-primary">{voiceData.confidence}%</span>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4">
            <span className="text-muted-foreground">Authenticity Score:</span>
            <span className={`font-bold text-xl ${
              authenticityData.overallScore >= 80 ? "text-green-500" : 
              authenticityData.overallScore >= 60 ? "text-yellow-500" : "text-red-500"
            }`}>
              {authenticityData.overallScore}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tamper Detection:</span>
            <span className={`font-medium ${authenticityData.tamperDetected ? "text-yellow-500" : "text-green-500"}`}>
              {authenticityData.tamperDetected ? "Minor Issues Detected" : "Clean"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">AI Content:</span>
            <span className={`font-medium ${
              authenticityData.aiProbability < 20 ? "text-green-500" : 
              authenticityData.aiProbability < 50 ? "text-yellow-500" : "text-red-500"
            }`}>
              {authenticityData.aiProbability}% AI-Generated
            </span>
          </div>
        </Card>

        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Note:</span> This certificate provides proof of content authenticity 
            at the time of certification. It includes voice verification, tamper detection results, 
            and AI content analysis.
          </p>
        </div>

        <div className="flex justify-center pt-6">
          <Button
            size="lg"
            onClick={handleMintCertificate}
            className="bg-primary hover:bg-primary/90 text-xl px-16 py-7"
          >
            Mint Content Certificate
          </Button>
        </div>

        <div className="text-center pt-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/content-certification/authenticity")}
            className="text-white hover:text-white/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="text-center pt-12">
          <p className="text-white font-bold text-2xl">seeksy</p>
          <p className="text-white/60 text-xs mt-2">Gasless blockchain certification</p>
        </div>
      </div>
    </div>
  );
};

export default ApproveAndMintContent;
