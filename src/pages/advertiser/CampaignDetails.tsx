import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { getCampaignById, listAdScriptsForCampaign, type Campaign, type AdScript } from "@/lib/api/advertiserAPI";

const CampaignDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [scripts, setScripts] = useState<AdScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      getCampaignById(id),
      listAdScriptsForCampaign(id),
    ]).then(([campaignRes, scriptsRes]) => {
      setCampaign(campaignRes.campaign);
      setScripts(scriptsRes.scripts);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
        <Card className="max-w-4xl mx-auto p-8 bg-white/95 backdrop-blur">
          <p className="text-center text-muted-foreground">Loading campaign...</p>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
        <Card className="max-w-4xl mx-auto p-8 bg-white/95 backdrop-blur text-center">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => navigate("/advertiser")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/advertiser")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 bg-white/95 backdrop-blur space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#053877]">{campaign.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">Campaign ID: {campaign.id}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                {campaign.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {campaign.budget && (
                <div>
                  <span className="font-medium text-foreground">Budget:</span>{" "}
                  <span className="text-muted-foreground">${campaign.budget.toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-foreground">Targeting:</span>{" "}
                <span className="text-muted-foreground">{campaign.targeting.join(", ")}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#053877]">Ad Scripts</h2>
              <Button
                onClick={() => navigate(`/advertiser/scripts/new?campaignId=${campaign.id}`)}
                className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Script
              </Button>
            </div>

            {scripts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No ad scripts yet</p>
                <Button
                  onClick={() => navigate(`/advertiser/scripts/new?campaignId=${campaign.id}`)}
                  variant="outline"
                >
                  Create Your First Script
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <Card key={script.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-[#053877]">
                            {script.brandName} — {script.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {script.scriptText.substring(0, 150)}
                            {script.scriptText.length > 150 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Read time: {script.readLengthSeconds}s</span>
                        <div className="flex gap-1">
                          {script.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-[#2C6BED]/10 text-[#2C6BED] rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CampaignDetails;
