import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["creator-payouts", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("creator_payouts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const totalPaid = payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.payout_amount), 0) || 0;
  const pending = payouts?.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.payout_amount), 0) || 0;
  const failed = payouts?.filter(p => p.status === "failed").length || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "paid":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Creator Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            Track creator payouts and earnings
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${totalPaid.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">${pending.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{failed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : payouts && payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Creator</th>
                    <th className="text-left py-3 px-4">Period</th>
                    <th className="text-right py-3 px-4">Gross Earnings</th>
                    <th className="text-right py-3 px-4">Fees</th>
                    <th className="text-right py-3 px-4">Net Payout</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Creator {payout.creator_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {format(new Date(payout.payout_period_start), "MMM d")} - {format(new Date(payout.payout_period_end), "MMM d, yyyy")}
                      </td>
                      <td className="text-right py-3 px-4">${Number(payout.total_revenue).toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-red-500">${Number(payout.platform_fee).toLocaleString()}</td>
                      <td className="text-right py-3 px-4 font-semibold">${Number(payout.payout_amount).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(payout.status)} className="gap-1">
                          {getStatusIcon(payout.status)}
                          {payout.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{payout.payment_method || "N/A"}</td>
                      <td className="text-right py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayout(payout)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No payouts yet. Creator earnings will appear here once monetization is active.
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Payout Details</SheetTitle>
            <SheetDescription>
              Payout ID: {selectedPayout?.id.slice(0, 8)}
            </SheetDescription>
          </SheetHeader>
          {selectedPayout && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-base">
                  {format(new Date(selectedPayout.payout_period_start), "MMM d, yyyy")} - {format(new Date(selectedPayout.payout_period_end), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(selectedPayout.status)} className="mt-1">
                  {selectedPayout.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Gross Earnings</p>
                  <p className="text-lg font-semibold">${Number(selectedPayout.total_revenue).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform Fees</p>
                  <p className="text-lg font-semibold text-red-500">${Number(selectedPayout.platform_fee).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Payout</p>
                <p className="text-2xl font-bold">${Number(selectedPayout.payout_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="text-base">{selectedPayout.payment_method || "Not specified"}</p>
              </div>
              {selectedPayout.payment_reference && (
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="text-base font-mono text-sm">{selectedPayout.payment_reference}</p>
                </div>
              )}
              {selectedPayout.processed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Processed At</p>
                  <p className="text-base">{format(new Date(selectedPayout.processed_at), "PPP p")}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}