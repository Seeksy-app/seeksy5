import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProformaData {
  companyName: string;
  preparedFor: string;
  preparedDate: string;
  
  // Year 1-3 Revenue Projections
  year1Revenue: number;
  year2Revenue: number;
  year3Revenue: number;
  
  // Cost of Revenue
  year1COGS: number;
  year2COGS: number;
  year3COGS: number;
  
  // Operating Expenses
  year1SalesMarketing: number;
  year2SalesMarketing: number;
  year3SalesMarketing: number;
  
  year1RnD: number;
  year2RnD: number;
  year3RnD: number;
  
  year1GnA: number;
  year2GnA: number;
  year3GnA: number;
  
  // Key Metrics
  year1Users: number;
  year2Users: number;
  year3Users: number;
  
  year1ARPU: number;
  year2ARPU: number;
  year3ARPU: number;
}

interface ProformaTemplateProps {
  assumptions: any;
  projectedRevenue: any;
}

export const ProformaTemplate = ({ assumptions, projectedRevenue }: ProformaTemplateProps) => {
  const { toast } = useToast();
  
  const [proformaData, setProformaData] = useState<ProformaData>({
    companyName: "Seeksy",
    preparedFor: "Investor Presentation",
    preparedDate: new Date().toISOString().split('T')[0],
    
    // Calculate from projections
    year1Revenue: projectedRevenue?.revenueData?.[11]?.total || 0,
    year2Revenue: projectedRevenue?.revenueData?.[23]?.total || 0,
    year3Revenue: projectedRevenue?.revenueData?.[35]?.total || 0,
    
    year1COGS: 0,
    year2COGS: 0,
    year3COGS: 0,
    
    year1SalesMarketing: 0,
    year2SalesMarketing: 0,
    year3SalesMarketing: 0,
    
    year1RnD: 0,
    year2RnD: 0,
    year3RnD: 0,
    
    year1GnA: 0,
    year2GnA: 0,
    year3GnA: 0,
    
    year1Users: 0,
    year2Users: 0,
    year3Users: 0,
    
    year1ARPU: 0,
    year2ARPU: 0,
    year3ARPU: 0,
  });

  const updateField = (field: keyof ProformaData, value: string | number) => {
    setProformaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateGrossProfit = (year: 1 | 2 | 3) => {
    const revenue = proformaData[`year${year}Revenue` as keyof ProformaData] as number;
    const cogs = proformaData[`year${year}COGS` as keyof ProformaData] as number;
    return revenue - cogs;
  };

  const calculateGrossMargin = (year: 1 | 2 | 3) => {
    const revenue = proformaData[`year${year}Revenue` as keyof ProformaData] as number;
    const grossProfit = calculateGrossProfit(year);
    return revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  };

  const calculateTotalOpEx = (year: 1 | 2 | 3) => {
    const sm = proformaData[`year${year}SalesMarketing` as keyof ProformaData] as number;
    const rnd = proformaData[`year${year}RnD` as keyof ProformaData] as number;
    const gna = proformaData[`year${year}GnA` as keyof ProformaData] as number;
    return sm + rnd + gna;
  };

  const calculateEBITDA = (year: 1 | 2 | 3) => {
    const grossProfit = calculateGrossProfit(year);
    const opex = calculateTotalOpEx(year);
    return grossProfit - opex;
  };

  const calculateEBITDAMargin = (year: 1 | 2 | 3) => {
    const revenue = proformaData[`year${year}Revenue` as keyof ProformaData] as number;
    const ebitda = calculateEBITDA(year);
    return revenue > 0 ? (ebitda / revenue) * 100 : 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExportPDF = () => {
    window.print();
    toast({
      title: "Exporting Proforma",
      description: "Use your browser's print dialog to save as PDF",
    });
  };

  const handleExportExcel = () => {
    // Create CSV data
    const csvData = [
      ["Seeksy Financial Proforma", "", "", ""],
      ["Prepared for:", proformaData.preparedFor, "", ""],
      ["Date:", proformaData.preparedDate, "", ""],
      ["", "", "", ""],
      ["", "Year 1", "Year 2", "Year 3"],
      ["Revenue", proformaData.year1Revenue, proformaData.year2Revenue, proformaData.year3Revenue],
      ["Cost of Revenue", proformaData.year1COGS, proformaData.year2COGS, proformaData.year3COGS],
      ["Gross Profit", calculateGrossProfit(1), calculateGrossProfit(2), calculateGrossProfit(3)],
      ["Gross Margin %", calculateGrossMargin(1).toFixed(1) + "%", calculateGrossMargin(2).toFixed(1) + "%", calculateGrossMargin(3).toFixed(1) + "%"],
      ["", "", "", ""],
      ["Operating Expenses", "", "", ""],
      ["Sales & Marketing", proformaData.year1SalesMarketing, proformaData.year2SalesMarketing, proformaData.year3SalesMarketing],
      ["R&D", proformaData.year1RnD, proformaData.year2RnD, proformaData.year3RnD],
      ["G&A", proformaData.year1GnA, proformaData.year2GnA, proformaData.year3GnA],
      ["Total OpEx", calculateTotalOpEx(1), calculateTotalOpEx(2), calculateTotalOpEx(3)],
      ["", "", "", ""],
      ["EBITDA", calculateEBITDA(1), calculateEBITDA(2), calculateEBITDA(3)],
      ["EBITDA Margin %", calculateEBITDAMargin(1).toFixed(1) + "%", calculateEBITDAMargin(2).toFixed(1) + "%", calculateEBITDAMargin(3).toFixed(1) + "%"],
      ["", "", "", ""],
      ["Key Metrics", "", "", ""],
      ["Total Users", proformaData.year1Users, proformaData.year2Users, proformaData.year3Users],
      ["ARPU", proformaData.year1ARPU, proformaData.year2ARPU, proformaData.year3ARPU],
    ];

    const csv = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Seeksy_Proforma_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({
      title: "Proforma Exported",
      description: "CSV file downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Proforma</h2>
          <p className="text-muted-foreground">3-Year projection template for investor presentations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={proformaData.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Prepared For</Label>
            <Input
              value={proformaData.preparedFor}
              onChange={(e) => updateField('preparedFor', e.target.value)}
              placeholder="e.g., Series A Investors"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={proformaData.preparedDate}
              onChange={(e) => updateField('preparedDate', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Projections</CardTitle>
          <CardDescription>Total revenue by year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Year 1 Revenue</Label>
              <Input
                type="number"
                value={proformaData.year1Revenue}
                onChange={(e) => updateField('year1Revenue', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Year 2 Revenue</Label>
              <Input
                type="number"
                value={proformaData.year2Revenue}
                onChange={(e) => updateField('year2Revenue', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Year 3 Revenue</Label>
              <Input
                type="number"
                value={proformaData.year3Revenue}
                onChange={(e) => updateField('year3Revenue', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost of Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Cost of Revenue (COGS)</CardTitle>
          <CardDescription>Direct costs associated with delivering service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Year 1 COGS</Label>
              <Input
                type="number"
                value={proformaData.year1COGS}
                onChange={(e) => updateField('year1COGS', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Year 2 COGS</Label>
              <Input
                type="number"
                value={proformaData.year2COGS}
                onChange={(e) => updateField('year2COGS', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Year 3 COGS</Label>
              <Input
                type="number"
                value={proformaData.year3COGS}
                onChange={(e) => updateField('year3COGS', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses</CardTitle>
          <CardDescription>Sales & Marketing, R&D, and General & Administrative costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sales & Marketing */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Sales & Marketing</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Year 1</Label>
                <Input
                  type="number"
                  value={proformaData.year1SalesMarketing}
                  onChange={(e) => updateField('year1SalesMarketing', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 2</Label>
                <Input
                  type="number"
                  value={proformaData.year2SalesMarketing}
                  onChange={(e) => updateField('year2SalesMarketing', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 3</Label>
                <Input
                  type="number"
                  value={proformaData.year3SalesMarketing}
                  onChange={(e) => updateField('year3SalesMarketing', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* R&D */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Research & Development</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Year 1</Label>
                <Input
                  type="number"
                  value={proformaData.year1RnD}
                  onChange={(e) => updateField('year1RnD', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 2</Label>
                <Input
                  type="number"
                  value={proformaData.year2RnD}
                  onChange={(e) => updateField('year2RnD', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 3</Label>
                <Input
                  type="number"
                  value={proformaData.year3RnD}
                  onChange={(e) => updateField('year3RnD', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* G&A */}
          <div>
            <h4 className="text-sm font-semibold mb-3">General & Administrative</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Year 1</Label>
                <Input
                  type="number"
                  value={proformaData.year1GnA}
                  onChange={(e) => updateField('year1GnA', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 2</Label>
                <Input
                  type="number"
                  value={proformaData.year2GnA}
                  onChange={(e) => updateField('year2GnA', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 3</Label>
                <Input
                  type="number"
                  value={proformaData.year3GnA}
                  onChange={(e) => updateField('year3GnA', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>User growth and unit economics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3">Total Users</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Year 1</Label>
                <Input
                  type="number"
                  value={proformaData.year1Users}
                  onChange={(e) => updateField('year1Users', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 2</Label>
                <Input
                  type="number"
                  value={proformaData.year2Users}
                  onChange={(e) => updateField('year2Users', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 3</Label>
                <Input
                  type="number"
                  value={proformaData.year3Users}
                  onChange={(e) => updateField('year3Users', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Average Revenue Per User (ARPU)</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Year 1</Label>
                <Input
                  type="number"
                  value={proformaData.year1ARPU}
                  onChange={(e) => updateField('year1ARPU', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 2</Label>
                <Input
                  type="number"
                  value={proformaData.year2ARPU}
                  onChange={(e) => updateField('year2ARPU', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year 3</Label>
                <Input
                  type="number"
                  value={proformaData.year3ARPU}
                  onChange={(e) => updateField('year3ARPU', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Calculated proforma statement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line Item</TableHead>
                <TableHead className="text-right">Year 1</TableHead>
                <TableHead className="text-right">Year 2</TableHead>
                <TableHead className="text-right">Year 3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="font-semibold">
                <TableCell>Revenue</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year1Revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year2Revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year3Revenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Cost of Revenue</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year1COGS)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year2COGS)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year3COGS)})</TableCell>
              </TableRow>
              <TableRow className="font-semibold border-t">
                <TableCell>Gross Profit</TableCell>
                <TableCell className="text-right">{formatCurrency(calculateGrossProfit(1))}</TableCell>
                <TableCell className="text-right">{formatCurrency(calculateGrossProfit(2))}</TableCell>
                <TableCell className="text-right">{formatCurrency(calculateGrossProfit(3))}</TableCell>
              </TableRow>
              <TableRow className="text-muted-foreground">
                <TableCell className="pl-8">Gross Margin %</TableCell>
                <TableCell className="text-right">{calculateGrossMargin(1).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{calculateGrossMargin(2).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{calculateGrossMargin(3).toFixed(1)}%</TableCell>
              </TableRow>
              <TableRow className="h-4"></TableRow>
              <TableRow className="font-semibold">
                <TableCell>Operating Expenses</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Sales & Marketing</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year1SalesMarketing)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year2SalesMarketing)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year3SalesMarketing)})</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">R&D</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year1RnD)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year2RnD)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year3RnD)})</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">G&A</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year1GnA)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year2GnA)})</TableCell>
                <TableCell className="text-right">({formatCurrency(proformaData.year3GnA)})</TableCell>
              </TableRow>
              <TableRow className="font-semibold border-t">
                <TableCell>Total OpEx</TableCell>
                <TableCell className="text-right">({formatCurrency(calculateTotalOpEx(1))})</TableCell>
                <TableCell className="text-right">({formatCurrency(calculateTotalOpEx(2))})</TableCell>
                <TableCell className="text-right">({formatCurrency(calculateTotalOpEx(3))})</TableCell>
              </TableRow>
              <TableRow className="h-4"></TableRow>
              <TableRow className="font-bold text-lg border-t-2">
                <TableCell>EBITDA</TableCell>
                <TableCell className="text-right">{formatCurrency(calculateEBITDA(1))}</TableCell>
                <TableCell className="text-right">{formatCurrency(calculateEBITDA(2))}</TableCell>
                <TableCell className="text-right">{formatCurrency(calculateEBITDA(3))}</TableCell>
              </TableRow>
              <TableRow className="font-semibold text-muted-foreground">
                <TableCell className="pl-8">EBITDA Margin %</TableCell>
                <TableCell className="text-right">{calculateEBITDAMargin(1).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{calculateEBITDAMargin(2).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{calculateEBITDAMargin(3).toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Economics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Year 1</TableHead>
                <TableHead className="text-right">Year 2</TableHead>
                <TableHead className="text-right">Year 3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Users</TableCell>
                <TableCell className="text-right">{proformaData.year1Users.toLocaleString()}</TableCell>
                <TableCell className="text-right">{proformaData.year2Users.toLocaleString()}</TableCell>
                <TableCell className="text-right">{proformaData.year3Users.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ARPU (Annual)</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year1ARPU)}</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year2ARPU)}</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year3ARPU)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>Calculated Revenue (Users × ARPU)</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year1Users * proformaData.year1ARPU)}</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year2Users * proformaData.year2ARPU)}</TableCell>
                <TableCell className="text-right">{formatCurrency(proformaData.year3Users * proformaData.year3ARPU)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};