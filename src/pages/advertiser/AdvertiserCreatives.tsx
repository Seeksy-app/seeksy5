import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdvertiserCreatives = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ad Library</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your created ads
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/advertiser/campaigns/create-type")}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Ad
          </Button>
          <Button onClick={() => navigate("/advertiser/upload-ad")} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Video/Audio
          </Button>
        </div>
      </div>

      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">No ads created yet</p>
        <p className="text-sm text-muted-foreground mb-6">Create your first audio or video ad to get started</p>
        <Button onClick={() => navigate("/advertiser/campaigns/create-type")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Ad
        </Button>
      </Card>
    </div>
  );
};

export default AdvertiserCreatives;
