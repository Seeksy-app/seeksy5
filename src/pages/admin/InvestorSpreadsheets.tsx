import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, Upload, Eye, Calendar } from "lucide-react";

export default function InvestorSpreadsheets() {
  const spreadsheets = [
    { id: 1, name: "Q4 2024 Financial Model", date: "Dec 1, 2024", status: "Current" },
    { id: 2, name: "3-Year Revenue Projections", date: "Nov 15, 2024", status: "Current" },
    { id: 3, name: "Cap Table - Series A", date: "Oct 30, 2024", status: "Active" },
    { id: 4, name: "Unit Economics Analysis", date: "Oct 15, 2024", status: "Archived" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-8 animate-fade-in">
      <div className="flex flex-col items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Investor Spreadsheets</h1>
          <p className="text-muted-foreground">Financial documents and investor materials</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Spreadsheet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Financial Documents
          </CardTitle>
          <CardDescription>
            Investor-ready financial models and analyses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {spreadsheets.map((sheet) => (
              <div key={sheet.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{sheet.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{sheet.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sheet.status === "Current" ? "default" : "outline"}>
                    {sheet.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}