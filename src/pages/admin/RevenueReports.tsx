import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Download, Calendar, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function RevenueReports() {
  const [granularity, setGranularity] = useState("monthly");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-revenue-reports", granularity, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_revenue_reports")
        .select("*")
        .order("period_start", { ascending: false });
      
      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const totalRevenue = reports?.reduce((sum, r) => sum + Number(r.gross_revenue), 0) || 0;
  const totalRefunds = reports?.reduce((sum, r) => sum + Number(r.refunds), 0) || 0;
  const netRevenue = reports?.reduce((sum, r) => sum + Number(r.net_revenue), 0) || 0;
  const adRevenue = reports?.filter(r => r.source === "ads").reduce((sum, r) => sum + Number(r.net_revenue), 0) || 0;
  const subscriptionRevenue = reports?.filter(r => r.source === "subscriptions").reduce((sum, r) => sum + Number(r.net_revenue), 0) || 0;

  const handleExportCSV = () => {
    if (!reports || reports.length === 0) return;
    
    const csvContent = [
      ["Period Start", "Period End", "Source", "Gross Revenue", "Refunds", "Net Revenue"],
      ...reports.map(r => [
        r.period_start,
        r.period_end,
        r.source,
        r.gross_revenue,
        r.refunds,
        r.net_revenue,
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-8">
      <div className="flex flex-col items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Revenue Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide revenue tracking and analysis
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-4 items-start justify-start">
        <Select value={granularity} onValueChange={setGranularity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Granularity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="subscriptions">Subscriptions</SelectItem>
            <SelectItem value="ads">Ads</SelectItem>
            <SelectItem value="credits">Credits</SelectItem>
            <SelectItem value="services">Services</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 justify-start">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">${totalRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ad Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${adRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">${subscriptionRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">${totalRefunds.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">${netRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : reports && reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Period</th>
                    <th className="text-left py-3 px-4">Source</th>
                    <th className="text-right py-3 px-4">Gross Revenue</th>
                    <th className="text-right py-3 px-4">Refunds</th>
                    <th className="text-right py-3 px-4">Net Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {format(new Date(report.period_start), "MMM d, yyyy")} - {format(new Date(report.period_end), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{report.source}</Badge>
                      </td>
                      <td className="text-right py-3 px-4">${Number(report.gross_revenue).toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-red-500">${Number(report.refunds).toLocaleString()}</td>
                      <td className="text-right py-3 px-4 font-semibold">${Number(report.net_revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No revenue data available. Revenue will appear here as transactions are processed.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}