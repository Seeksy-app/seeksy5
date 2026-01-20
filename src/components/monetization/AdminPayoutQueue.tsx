import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AdminPayoutQueueProps {
  payments: any[];
  loading?: boolean;
}

export function AdminPayoutQueue({ payments, loading }: AdminPayoutQueueProps) {
  const queryClient = useQueryClient();

  const processPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('creator_payments')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      toast.success('Payment processed successfully!');
    },
    onError: (error) => {
      toast.error('Failed to process payment');
      console.error(error);
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      scheduled: { variant: "outline", label: "Scheduled" },
      processing: { variant: "outline", label: "Processing" },
      paid: { variant: "default", label: "Paid" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalPending = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Payout Queue
            </CardTitle>
            <CardDescription>
              {payments.length} payments pending • ${totalPending.toLocaleString()} total
            </CardDescription>
          </div>
          <Button variant="outline" disabled={payments.length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Process All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{payment.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">${payment.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="capitalize">
                    {payment.payout_method?.replace('_', ' ') || 'Stripe Connect'}
                  </TableCell>
                  <TableCell>
                    {payment.scheduled_date 
                      ? format(new Date(payment.scheduled_date), 'MMM d, yyyy')
                      : 'Not scheduled'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm"
                      onClick={() => processPayment.mutate(payment.id)}
                      disabled={processPayment.isPending}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending payouts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
