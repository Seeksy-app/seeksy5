import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  DollarSign, 
  Eye, 
  Calendar,
  ArrowRight,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CampaignCardProps {
  campaign: any;
  showDetails?: boolean;
}

export function CampaignCard({ campaign, showDetails = false }: CampaignCardProps) {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      pending_review: { variant: "outline", label: "Pending Review" },
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "Paused" },
      completed: { variant: "outline", label: "Completed" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const budgetProgress = campaign.total_budget > 0 
    ? ((campaign.total_spent || 0) / campaign.total_budget) * 100 
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{campaign.name}</h3>
              {getStatusBadge(campaign.status)}
            </div>
            {campaign.advertisers && (
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.advertisers.company_name}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/ads/campaigns/${campaign.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/ads/campaigns/${campaign.id}/edit`)}>
                Edit Campaign
              </DropdownMenuItem>
              <DropdownMenuItem>Pause Campaign</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <p className="text-muted-foreground">Budget</p>
            <p className="font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {campaign.total_budget?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Spent</p>
            <p className="font-medium">
              ${campaign.total_spent?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Impressions</p>
            <p className="font-medium flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {campaign.total_impressions?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {campaign.start_date && campaign.end_date 
                ? `${format(new Date(campaign.start_date), 'MMM d')} - ${format(new Date(campaign.end_date), 'MMM d')}`
                : 'Not set'}
            </p>
          </div>
        </div>

        {showDetails && (
          <>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget Used</span>
                <span>{budgetProgress.toFixed(1)}%</span>
              </div>
              <Progress value={budgetProgress} className="h-2" />
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/admin/ads/campaigns/${campaign.id}`)}
              >
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
