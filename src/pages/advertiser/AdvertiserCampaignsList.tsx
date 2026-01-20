import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ExternalLink } from "lucide-react";
import { demoCampaignsV2 } from "@/data/advertiserDemoDataV2";
import { motion } from "framer-motion";

const AdvertiserCampaignsList = () => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Running</Badge>;
      case "paused":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Paused</Badge>;
      case "completed":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Completed</Badge>;
      case "draft":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Campaigns</h1>
            <p className="text-white/70 mt-1">
              View and manage all your advertising campaigns
            </p>
          </div>
          <Button
            onClick={() => navigate("/advertiser/campaign-builder-v2")}
            className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Campaigns Table */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Primary Channel</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoCampaignsV2.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    Brand Awareness
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Social
                  </TableCell>
                  <TableCell className="text-right">
                    ${campaign.budget.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${campaign.spent.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{campaign.ctr}%</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/advertiser/campaigns/${campaign.id}`);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdvertiserCampaignsList;
