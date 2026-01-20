import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { FinancialData } from "@/hooks/useProFormaData";

interface Props {
  data: FinancialData;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const formatFullCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const ProFormaFinancialTables = ({ data }: Props) => {
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Table */}
      <Card className="rounded-lg overflow-hidden">
        <CardHeader className="bg-[#053877] text-white">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="text-right font-semibold">Total Revenue</TableHead>
                  <TableHead className="text-right font-semibold">YoY Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.years.map((year, idx) => (
                  <TableRow key={year}>
                    <TableCell className="font-medium">{year}</TableCell>
                    <TableCell className="text-right font-semibold text-[#053877]">
                      {formatFullCurrency(data.revenue[idx])}
                    </TableCell>
                    <TableCell className="text-right">
                      {idx > 0 ? (
                        <span className="text-green-600 font-medium">
                          +{calculateGrowth(data.revenue[idx], data.revenue[idx - 1]).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="rounded-lg overflow-hidden">
        <CardHeader className="bg-rose-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="text-right font-semibold">Total Expenses</TableHead>
                  <TableHead className="text-right font-semibold">% of Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.years.map((year, idx) => (
                  <TableRow key={year}>
                    <TableCell className="font-medium">{year}</TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">
                      {formatFullCurrency(data.expenses[idx])}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {((data.expenses[idx] / data.revenue[idx]) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* EBITDA Table */}
      <Card className="rounded-lg overflow-hidden">
        <CardHeader className="bg-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            EBITDA Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="text-right font-semibold">EBITDA</TableHead>
                  <TableHead className="text-right font-semibold">Margin</TableHead>
                  <TableHead className="text-right font-semibold">YoY Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.years.map((year, idx) => (
                  <TableRow key={year}>
                    <TableCell className="font-medium">{year}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {formatFullCurrency(data.ebitda[idx])}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        {((data.ebitda[idx] / data.revenue[idx]) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {idx > 0 ? (
                        <span className="text-emerald-600 font-medium">
                          +{calculateGrowth(data.ebitda[idx], data.ebitda[idx - 1]).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProFormaFinancialTables;
