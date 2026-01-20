import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Pause, Play, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface AdminCampaignTableProps {
  campaigns: any[];
  compact?: boolean;
}

export function AdminCampaignTable({ campaigns, compact = false }: AdminCampaignTableProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      pending_review: { variant: "outline", label: "Pending" },
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "Paused" },
      completed: { variant: "outline", label: "Completed" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead>Advertiser</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Budget</TableHead>
          <TableHead className="text-right">Spent</TableHead>
          {!compact && <TableHead className="text-right">Impressions</TableHead>}
          {!compact && <TableHead>Duration</TableHead>}
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id}>
            <TableCell className="font-medium">{campaign.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {campaign.advertisers?.company_name || 'Unknown'}
            </TableCell>
            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
            <TableCell className="text-right">
              ${campaign.total_budget?.toLocaleString() || 0}
            </TableCell>
            <TableCell className="text-right">
              ${campaign.total_spent?.toLocaleString() || 0}
            </TableCell>
            {!compact && (
              <TableCell className="text-right">
                {campaign.total_impressions?.toLocaleString() || 0}
              </TableCell>
            )}
            {!compact && (
              <TableCell>
                {campaign.start_date && campaign.end_date
                  ? `${format(new Date(campaign.start_date), 'MMM d')} - ${format(new Date(campaign.end_date), 'MMM d')}`
                  : 'Not set'}
              </TableCell>
            )}
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/admin/ads/campaigns/${campaign.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/admin/ads/campaigns/${campaign.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {campaign.status === 'active' ? (
                    <DropdownMenuItem>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  ) : campaign.status === 'paused' ? (
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
