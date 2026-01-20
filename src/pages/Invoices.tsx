import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Receipt, DollarSign, AlertCircle, CheckCircle, X } from "lucide-react";
import { format } from "date-fns";

export default function Invoices() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          ),
          proposals (
            id,
            proposal_number,
            title
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusBadge = (invoice: any) => {
    const status = invoice.status;
    const isOverdue = status === 'sent' && invoice.due_date && new Date(invoice.due_date) < new Date();
    
    const config = {
      draft: { color: "bg-gray-500", icon: Receipt },
      sent: { color: isOverdue ? "bg-red-500" : "bg-blue-500", icon: isOverdue ? AlertCircle : DollarSign },
      viewed: { color: "bg-yellow-500", icon: AlertCircle },
      paid: { color: "bg-green-500", icon: CheckCircle },
      overdue: { color: "bg-red-500", icon: AlertCircle },
      cancelled: { color: "bg-gray-400", icon: X },
    };
    
    const actualStatus = isOverdue && status === 'sent' ? 'overdue' : status;
    const { color, icon: Icon } = config[actualStatus as keyof typeof config] || config.draft;
    
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {actualStatus}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-2">
              Manage client invoices and payments
            </p>
          </div>
          
          <Button onClick={() => navigate("/invoices/create")}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>Track invoices and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first invoice to bill clients
                </p>
                <Button onClick={() => navigate("/invoices/create")}>
                  Create Invoice
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell className="font-medium">{invoice.title}</TableCell>
                      <TableCell>
                        {invoice.contacts ? (
                          <div className="text-sm">
                            <div>{invoice.contacts.name}</div>
                            {invoice.contacts.company && (
                              <div className="text-xs text-muted-foreground">{invoice.contacts.company}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No client</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">${invoice.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        ${invoice.amount_paid.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice)}</TableCell>
                      <TableCell className="text-sm">
                        {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
