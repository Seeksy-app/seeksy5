import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Link as LinkIcon,
  FileText,
  Tag,
  Layers,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

type InventoryStatus = 'available' | 'active' | 'lost' | 'reserved';

interface AdInventoryItem {
  id: string;
  name: string;
  type: string;
  channel: string;
  owner_type: string;
  owner_id: string | null;
  status: string;
  inventory_date: string | null;
  capacity: number | null;
  list_price: number;
  expected_cost: number;
  expected_profit: number;
  currency: string;
  linked_campaign_id: string | null;
  linked_creator_id: string | null;
  linked_ad_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AdInventoryDetailDrawerProps {
  item: AdInventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<InventoryStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  active: 'bg-blue-100 text-blue-800',
  lost: 'bg-red-100 text-red-800',
  reserved: 'bg-amber-100 text-amber-800',
};

const typeLabels: Record<string, string> = {
  blog_banner: 'Blog Banner',
  newsletter: 'Newsletter',
  creator_ig: 'Creator Instagram',
  creator_tt: 'Creator TikTok',
  creator_youtube: 'Creator YouTube',
  podcast_midroll: 'Podcast Midroll/Pre-roll',
  event_sponsorship: 'Event Sponsorship',
  awards_sponsorship: 'Awards Sponsorship',
  other: 'Other',
};

export function AdInventoryDetailDrawer({
  item,
  open,
  onOpenChange,
}: AdInventoryDetailDrawerProps) {
  if (!item) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const profitMargin =
    Number(item.list_price) > 0
      ? ((Number(item.expected_profit) / Number(item.list_price)) * 100).toFixed(1)
      : '0';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-xl leading-tight">{item.name}</SheetTitle>
            </div>
            <Badge className={statusColors[item.status as InventoryStatus]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Type & Channel Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{typeLabels[item.type] || item.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Channel:</span>
              <span className="font-medium">{item.channel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-medium capitalize">{item.owner_type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {item.inventory_date
                  ? format(new Date(item.inventory_date), 'MMM d, yyyy')
                  : 'Not set'}
              </span>
            </div>
            {item.capacity && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-medium">{item.capacity} unit(s)</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(Number(item.list_price))}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Cost</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(Number(item.expected_cost))}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-xs text-muted-foreground mb-1">Profit</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(Number(item.expected_profit))}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Profit Margin:</span>
                <span className="font-bold text-emerald-600">{profitMargin}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Linked Objects */}
          {(item.linked_campaign_id || item.linked_creator_id || item.linked_ad_id) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Linked Objects
                </h4>
                <div className="space-y-2">
                  {item.linked_campaign_id && (
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Campaign
                    </Button>
                  )}
                  {item.linked_creator_id && (
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      View Creator Profile
                    </Button>
                  )}
                  {item.linked_ad_id && (
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      View Ad
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {item.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {item.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Demo Action Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Demo Actions (Non-functional)</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="default" size="sm" disabled className="w-full">
                Assign to Campaign
              </Button>
              <Button variant="destructive" size="sm" disabled className="w-full gap-1">
                <XCircle className="h-4 w-4" />
                Mark as Lost
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Created: {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}</p>
            <p>Updated: {format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')}</p>
            <p className="font-mono text-[10px] opacity-50">ID: {item.id}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
