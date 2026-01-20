import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  status: string;
  scheduled_date?: string;
  paid_at?: string;
  created_at: string;
  payout_method?: string;
}

interface PaymentTimelineProps {
  payments: Payment[];
  compact?: boolean;
}

export function PaymentTimeline({ payments, compact = false }: PaymentTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'scheduled':
      case 'processing':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      scheduled: { variant: "outline", label: "Scheduled" },
      processing: { variant: "outline", label: "Processing" },
      paid: { variant: "default", label: "Paid" },
      failed: { variant: "destructive", label: "Failed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {payments.slice(0, 3).map((payment) => (
          <div key={payment.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(payment.status)}
              <span className="font-medium">${payment.amount.toLocaleString()}</span>
            </div>
            {getStatusBadge(payment.status)}
          </div>
        ))}
        {payments.length > 3 && (
          <p className="text-sm text-muted-foreground text-center">
            +{payments.length - 3} more payments
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {payments.map((payment) => (
          <div key={payment.id} className="relative pl-10">
            <div className="absolute left-0 p-2 bg-background border rounded-full">
              {getStatusIcon(payment.status)}
            </div>
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">${payment.amount.toLocaleString()}</span>
                  {getStatusBadge(payment.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {payment.payout_method === 'stripe_connect' ? 'Stripe Connect' : 
                   payment.payout_method === 'bank_transfer' ? 'Bank Transfer' : 
                   payment.payout_method || 'Direct Deposit'}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {payment.paid_at ? (
                  <p>Paid {format(new Date(payment.paid_at), 'MMM d, yyyy')}</p>
                ) : payment.scheduled_date ? (
                  <p>Scheduled {format(new Date(payment.scheduled_date), 'MMM d, yyyy')}</p>
                ) : (
                  <p>Created {format(new Date(payment.created_at), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
