import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Upload, List } from "lucide-react";
import { SpreadsheetUploadForm } from "@/components/investor/SpreadsheetUploadForm";
import { SpreadsheetList } from "@/components/investor/SpreadsheetList";
import { SpreadsheetViewer } from "@/components/investor/SpreadsheetViewer";

export default function ManageInvestorSpreadsheets() {
  const [viewingSpreadsheet, setViewingSpreadsheet] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (viewingSpreadsheet) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <SpreadsheetViewer 
            spreadsheet={viewingSpreadsheet} 
            onBack={() => setViewingSpreadsheet(null)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <FileSpreadsheet className="w-10 h-10 text-primary" />
            Investor Spreadsheets
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage financial spreadsheets shared with investors
          </p>
        </div>

        <Tabs defaultValue="list" className="space-y-8">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              All Spreadsheets
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" key={refreshKey}>
            <SpreadsheetList 
              onViewSpreadsheet={setViewingSpreadsheet}
              showAdminActions={true}
            />
          </TabsContent>

          <TabsContent value="upload">
            <div className="max-w-2xl">
              <SpreadsheetUploadForm onUploadSuccess={handleUploadSuccess} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
