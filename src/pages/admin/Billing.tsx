import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
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

export default function Billing() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["billing-invoices", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("billing_invoices")
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

  const totalIssued = invoices?.length || 0;
  const totalDue = invoices?.reduce((sum, inv) => sum + Number(inv.amount_due), 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0;
  const outstanding = totalDue - totalPaid;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Receipt className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
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
            <Receipt className="h-8 w-8 text-primary" />
            Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage invoices and billing activity
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
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoices Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{totalIssued}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">${totalDue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount Paid</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">${outstanding.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Invoice ID</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Amount Due</th>
                    <th className="text-right py-3 px-4">Amount Paid</th>
                    <th className="text-left py-3 px-4">Issue Date</th>
                    <th className="text-left py-3 px-4">Due Date</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{invoice.external_id || invoice.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{invoice.customer_name || "N/A"}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(invoice.status)} className="gap-1">
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">${Number(invoice.amount_due).toLocaleString()}</td>
                      <td className="text-right py-3 px-4">${Number(invoice.amount_paid).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {invoice.issued_at ? format(new Date(invoice.issued_at), "MMM d, yyyy") : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "N/A"}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found. Invoices will appear here as they are generated.
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>
              {selectedInvoice?.external_id || selectedInvoice?.id}
            </SheetDescription>
          </SheetHeader>
          {selectedInvoice && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="text-lg font-semibold">{selectedInvoice.customer_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(selectedInvoice.status)} className="mt-1">
                  {selectedInvoice.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="text-lg font-semibold">${Number(selectedInvoice.amount_due).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-semibold">${Number(selectedInvoice.amount_paid).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issued</p>
                  <p className="text-base">{selectedInvoice.issued_at ? format(new Date(selectedInvoice.issued_at), "PPP") : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due</p>
                  <p className="text-base">{selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), "PPP") : "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}