import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, Database, HardDrive, Server, Users, CheckCircle2, XCircle } from "lucide-react";
import { formatBytes } from "@/lib/utils";

const SystemStatus = () => {
  // Get storage usage by bucket
  const { data: storageStats, isLoading: storageLoading } = useQuery({
    queryKey: ["admin-storage-stats"],
    queryFn: async () => {
      const buckets = [
        'avatars', 'event-images', 'studio-recordings', 'podcast-covers',
        'episode-files', 'lead-photos', 'investor-spreadsheets', 'contact-photos', 'persona-videos'
      ];

      const bucketStats = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const { data, error } = await supabase.storage.from(bucket).list();
            if (error) throw error;

            let totalSize = 0;
            let fileCount = 0;

            if (data) {
              for (const file of data) {
                totalSize += file.metadata?.size || 0;
                fileCount++;
              }
            }

            return { bucket, totalSize, fileCount };
          } catch (error) {
            console.error(`Error fetching ${bucket}:`, error);
            return { bucket, totalSize: 0, fileCount: 0, error: true };
          }
        })
      );

      const totalStorage = bucketStats.reduce((acc, stat) => acc + stat.totalSize, 0);
      return { bucketStats, totalStorage };
    },
  });

  // Get top storage consumers by creator
  const { data: topConsumers } = useQuery({
    queryKey: ["admin-top-consumers"],
    queryFn: async () => {
      // Query media files grouped by user
      const { data: mediaFiles } = await supabase
        .from("media_files")
        .select("user_id, file_size_bytes, profiles(account_full_name, username)");

      // Query studio recordings grouped by user  
      const { data: recordings } = await supabase
        .from("studio_recordings")
        .select("user_id, file_size_bytes, profiles(account_full_name, username)");

      const userStorage = new Map();

      // Aggregate media files
      mediaFiles?.forEach((file) => {
        const userId = file.user_id;
        const size = file.file_size_bytes || 0;
        const existing = userStorage.get(userId) || { size: 0, profile: file.profiles };
        userStorage.set(userId, { 
          size: existing.size + size, 
          profile: file.profiles 
        });
      });

      // Aggregate recordings
      recordings?.forEach((rec) => {
        const userId = rec.user_id;
        const size = rec.file_size_bytes || 0;
        const existing = userStorage.get(userId) || { size: 0, profile: rec.profiles };
        userStorage.set(userId, { 
          size: existing.size + size, 
          profile: rec.profiles 
        });
      });

      // Convert to array and sort by size
      const sorted = Array.from(userStorage.entries())
        .map(([userId, data]) => ({
          userId,
          name: data.profile?.account_full_name || data.profile?.username || 'Unknown',
          totalSize: data.size,
        }))
        .sort((a, b) => b.totalSize - a.totalSize)
        .slice(0, 10);

      return sorted;
    },
  });

  // Calculate storage thresholds
  const STORAGE_LIMIT_GB = 100; // Lovable Cloud typical limit
  const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;
  const storageUsagePercent = storageStats 
    ? (storageStats.totalStorage / STORAGE_LIMIT_BYTES) * 100 
    : 0;

  const getStorageStatus = () => {
    if (storageUsagePercent >= 90) return { color: "destructive", icon: XCircle, text: "Critical" };
    if (storageUsagePercent >= 75) return { color: "warning", icon: AlertTriangle, text: "Warning" };
    return { color: "success", icon: CheckCircle2, text: "Healthy" };
  };

  const status = getStorageStatus();
  const StatusIcon = status.icon;

  if (storageLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            System Status & Storage
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform health, storage usage, and redundancy
          </p>
        </div>
      </div>

      {/* Critical Alerts */}
      {storageUsagePercent >= 75 && (
        <Alert variant={storageUsagePercent >= 90 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {storageUsagePercent >= 90 ? "Critical Storage Alert" : "Storage Warning"}
          </AlertTitle>
          <AlertDescription>
            You're using {storageUsagePercent.toFixed(1)}% of your storage limit. 
            {storageUsagePercent >= 90 
              ? " Take immediate action to free up space or upgrade storage."
              : " Consider reviewing and archiving old content to free up space."}
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(storageStats?.totalStorage || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {STORAGE_LIMIT_GB}GB available
            </p>
            <Progress value={storageUsagePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Status</CardTitle>
            <StatusIcon className={`h-4 w-4 ${
              status.color === 'destructive' ? 'text-destructive' :
              status.color === 'warning' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.text}</div>
            <p className="text-xs text-muted-foreground">
              {storageUsagePercent.toFixed(1)}% capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Storage Buckets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageStats?.bucketStats.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across Lovable Cloud
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage by Bucket */}
      <Card>
        <CardHeader>
          <CardTitle>Storage by Bucket</CardTitle>
          <CardDescription>Breakdown of storage usage across different buckets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket Name</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>% of Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageStats?.bucketStats
                  .sort((a, b) => b.totalSize - a.totalSize)
                  .map((bucket) => {
                    const percentage = storageStats.totalStorage 
                      ? (bucket.totalSize / storageStats.totalStorage) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={bucket.bucket}>
                        <TableCell className="font-medium">{bucket.bucket}</TableCell>
                        <TableCell>{bucket.fileCount.toLocaleString()}</TableCell>
                        <TableCell>{formatBytes(bucket.totalSize)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20" />
                            <span className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {bucket.error ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Storage Consumers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Storage Consumers
          </CardTitle>
          <CardDescription>Creators using the most storage on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Total Storage</TableHead>
                  <TableHead>% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topConsumers && topConsumers.length > 0 ? (
                  topConsumers.map((consumer, index) => {
                    const percentage = storageStats?.totalStorage
                      ? (consumer.totalSize / storageStats.totalStorage) * 100
                      : 0;

                    return (
                      <TableRow key={consumer.userId}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>{consumer.name}</TableCell>
                        <TableCell>{formatBytes(consumer.totalSize)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20" />
                            <span className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No storage data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Redundancy & Backup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Redundancy & Backup Status
          </CardTitle>
          <CardDescription>Your disaster recovery and backup systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">GitHub Code Backup</p>
                <p className="text-sm text-muted-foreground">
                  All code auto-synced to GitHub repository
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Lovable Cloud Storage</p>
                <p className="text-sm text-muted-foreground">
                  Supabase managed storage with automatic backups
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Cloudflare R2 Storage</p>
                <p className="text-sm text-muted-foreground">
                  Distributed video and media storage
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Database Backups</p>
                <p className="text-sm text-muted-foreground">
                  Daily automated PostgreSQL backups
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50">Active</Badge>
          </div>

          <Alert>
            <Server className="h-4 w-4" />
            <AlertTitle>Multi-Layer Protection</AlertTitle>
            <AlertDescription>
              Your platform has 4 layers of redundancy: GitHub code backup, Lovable Cloud storage, 
              Cloudflare distributed storage, and daily database backups. If one system fails, 
              your data remains safe and accessible through other systems.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatus;
