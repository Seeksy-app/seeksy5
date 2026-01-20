import { useState } from "react";
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
import {
  CreditCard,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  Wallet,
  Building2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { demoBillingV2 } from "@/data/advertiserDemoDataV2";

const AdvertiserBilling = () => {
  const billing = demoBillingV2;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Budgets & Billing</h1>
            <p className="text-white/70 mt-1">
              Manage your account balance, payment methods, and billing history
            </p>
          </div>
          <Button className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                <p className="text-3xl font-bold text-[#053877] mt-1">
                  ${billing.balance.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Credit limit: ${billing.creditLimit.toLocaleString()}
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Invoice</p>
                <p className="text-3xl font-bold text-[#053877] mt-1">
                  {new Date(billing.nextInvoiceDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Estimated: ${billing.invoices.find((i) => i.status === "pending")?.amount.toLocaleString() || 0}
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Payment</p>
                <p className="text-3xl font-bold text-[#053877] mt-1">
                  ${billing.lastPaymentAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {new Date(billing.lastPaymentDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#053877]">Payment Methods</h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
          <div className="space-y-3">
            {billing.paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Invoice History */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#053877]">Invoice History</h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing.invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id.toUpperCase()}</TableCell>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
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

export default AdvertiserBilling;
