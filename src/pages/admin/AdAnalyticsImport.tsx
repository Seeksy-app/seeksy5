import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { externalAdCsvImporter } from "@/lib/importers/externalAdCsvImporter";
import { youtubeAnalytics } from "@/lib/integrations/youtubeAnalytics";
import { Upload, Youtube, CheckCircle2, AlertCircle, Download, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdAnalyticsImport() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<'spotify' | 'apple_podcasts' | 'youtube'>('spotify');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // YouTube sync state
  const [youtubeVideoIds, setYoutubeVideoIds] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await externalAdCsvImporter.importCsv(csvFile, selectedPlatform);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.rowsInserted} rows from ${result.rowsProcessed} total rows`
        });
      } else {
        toast({
          title: "Import completed with errors",
          description: `${result.errors.length} errors occurred during import`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleYoutubeSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const videoIds = youtubeVideoIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (videoIds.length === 0) {
        toast({
          title: "No video IDs provided",
          description: "Please enter at least one YouTube video ID",
          variant: "destructive"
        });
        return;
      }

      const result = await youtubeAnalytics.syncMultipleVideos(
        videoIds,
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0]
      );

      setSyncResult(result);

      if (result.success) {
        toast({
          title: "YouTube sync successful",
          description: `Synced ${result.videosProcessed} videos, inserted ${result.rowsInserted} rows`
        });
      } else {
        toast({
          title: "Sync completed with errors",
          description: `${result.errors.length} errors occurred`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "YouTube sync failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadExampleCsv = () => {
    const exampleCsv = externalAdCsvImporter.getExampleCsvFormat(selectedPlatform);
    const blob = new Blob([exampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPlatform}_example.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">External Ad Analytics Import</h1>
        <p className="text-muted-foreground">
          Import performance data from external platforms (Spotify, Apple, YouTube)
        </p>
      </div>

      <Tabs defaultValue="csv-import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv-import">CSV Import (Spotify & Apple)</TabsTrigger>
          <TabsTrigger value="youtube-sync">YouTube API Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="csv-import" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={selectedPlatform}
                  onValueChange={(value: any) => setSelectedPlatform(value)}
                >
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spotify">Spotify</SelectItem>
                    <SelectItem value="apple_podcasts">Apple Podcasts</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a CSV file with {selectedPlatform} ad performance data
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCsvImport} disabled={isImporting || !csvFile}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </Button>
                <Button variant="outline" onClick={downloadExampleCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Example Format
                </Button>
              </div>

              {importResult && (
                <Alert variant={importResult.success ? "default" : "destructive"}>
                  <div className="flex items-start gap-3">
                    {importResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-semibold">
                            {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
                          </div>
                          <div className="flex gap-4 text-sm">
                            <Badge variant="outline">Processed: {importResult.rowsProcessed}</Badge>
                            <Badge variant="outline">Inserted: {importResult.rowsInserted}</Badge>
                            {importResult.errors.length > 0 && (
                              <Badge variant="destructive">Errors: {importResult.errors.length}</Badge>
                            )}
                          </div>
                          {importResult.errors.length > 0 && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-medium">View Errors</summary>
                              <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                                {importResult.errors.slice(0, 10).map((error: string, idx: number) => (
                                  <li key={idx}>{error}</li>
                                ))}
                                {importResult.errors.length > 10 && (
                                  <li>...and {importResult.errors.length - 10} more errors</li>
                                )}
                              </ul>
                            </details>
                          )}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="youtube-sync" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <Alert>
                <Youtube className="h-4 w-4" />
                <AlertDescription>
                  YouTube Analytics API integration fetches daily metrics for specified videos.
                  Make sure you have configured YouTube OAuth credentials in External Platform Accounts.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="video-ids">Video IDs (comma-separated)</Label>
                <Input
                  id="video-ids"
                  placeholder="dQw4w9WgXcQ, abc123def45, ..."
                  value={youtubeVideoIds}
                  onChange={(e) => setYoutubeVideoIds(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Enter YouTube video IDs separated by commas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleYoutubeSync} disabled={isSyncing}>
                <Play className="mr-2 h-4 w-4" />
                {isSyncing ? 'Syncing...' : 'Sync YouTube Analytics'}
              </Button>

              {syncResult && (
                <Alert variant={syncResult.success ? "default" : "destructive"}>
                  <div className="flex items-start gap-3">
                    {syncResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-semibold">
                            {syncResult.success ? 'Sync Successful' : 'Sync Completed with Errors'}
                          </div>
                          <div className="flex gap-4 text-sm">
                            <Badge variant="outline">Videos: {syncResult.videosProcessed}</Badge>
                            <Badge variant="outline">Rows Inserted: {syncResult.rowsInserted}</Badge>
                            {syncResult.errors.length > 0 && (
                              <Badge variant="destructive">Errors: {syncResult.errors.length}</Badge>
                            )}
                          </div>
                          {syncResult.errors.length > 0 && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-medium">View Errors</summary>
                              <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                                {syncResult.errors.slice(0, 10).map((error: string, idx: number) => (
                                  <li key={idx}>{error}</li>
                                ))}
                                {syncResult.errors.length > 10 && (
                                  <li>...and {syncResult.errors.length - 10} more errors</li>
                                )}
                              </ul>
                            </details>
                          )}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
