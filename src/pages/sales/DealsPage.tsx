import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, DollarSign, TrendingUp, Clock, CheckCircle2, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
}

const initialDeals: Deal[] = [
  { id: "1", name: "Enterprise Podcast Hosting", company: "TechCorp Inc", value: 25000, stage: "Proposal", probability: 60, closeDate: "2025-01-15", owner: "You" },
  { id: "2", name: "Creator Studio License", company: "MediaFlow", value: 12000, stage: "Negotiation", probability: 80, closeDate: "2025-01-08", owner: "You" },
  { id: "3", name: "Advertising Partnership", company: "BrandX", value: 50000, stage: "Discovery", probability: 30, closeDate: "2025-02-01", owner: "You" },
  { id: "4", name: "Event Platform Subscription", company: "EventPro", value: 8500, stage: "Closed Won", probability: 100, closeDate: "2024-12-01", owner: "You" },
];

const stageColors: Record<string, string> = {
  "Discovery": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Qualification": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Proposal": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Negotiation": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Closed Won": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Closed Lost": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  const activeDeals = deals.filter(d => d.stage !== "Closed Won" && d.stage !== "Closed Lost").length;
  const wonDeals = deals.filter(d => d.stage === "Closed Won").length;

  const filteredDeals = deals.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteDeal = () => {
    if (dealToDelete) {
      setDeals(prev => prev.filter(d => d.id !== dealToDelete.id));
      toast.success(`Deal "${dealToDelete.name}" deleted`);
      setDealToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleRowClick = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your sales opportunities</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold">${weightedValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{activeDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Won This Month</p>
                <p className="text-2xl font-bold">{wonDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Deals</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search deals..." 
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deal Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Probability</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Close Date</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr 
                    key={deal.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(deal)}
                  >
                    <td className="py-3 px-4 font-medium">{deal.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{deal.company}</td>
                    <td className="py-3 px-4">${deal.value.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge className={stageColors[deal.stage] || "bg-gray-100 text-gray-800"}>
                        {deal.stage}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{deal.probability}%</td>
                    <td className="py-3 px-4 text-muted-foreground">{deal.closeDate}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setDealToDelete(deal);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deal Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.name}</DialogTitle>
            <DialogDescription>Deal with {selectedDeal?.company}</DialogDescription>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="font-semibold">${selectedDeal.value.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stage</p>
                  <Badge className={stageColors[selectedDeal.stage]}>{selectedDeal.stage}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Probability</p>
                  <p className="font-semibold">{selectedDeal.probability}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Close Date</p>
                  <p className="font-semibold">{selectedDeal.closeDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-semibold">{selectedDeal.owner}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDeal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{dealToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDeal}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
