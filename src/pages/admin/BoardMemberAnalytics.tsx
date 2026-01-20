import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoardMemberAnalytics, useBoardMemberActivityLog } from "@/hooks/useBoardMemberAnalytics";
import { Users, LogIn, Play, Share2, Eye, Clock } from "lucide-react";

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export default function BoardMemberAnalytics() {
  const { data: stats, isLoading } = useBoardMemberAnalytics();
  const { data: activityLog } = useBoardMemberActivityLog();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const totalLogins = stats?.reduce((sum, s) => sum + s.totalLogins, 0) || 0;
  const totalVideoWatches = stats?.reduce((sum, s) => sum + s.totalVideoWatches, 0) || 0;
  const totalShares = stats?.reduce((sum, s) => sum + s.totalShares, 0) || 0;
  const totalWatchTime = stats?.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Board Member Analytics</h1>
        <p className="text-muted-foreground">Track engagement and activity of board members</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Board Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Video Watches</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideoWatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSeconds(totalWatchTime)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Board Member Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-center">Logins</TableHead>
                    <TableHead className="text-center">Last Login</TableHead>
                    <TableHead className="text-center">Videos Watched</TableHead>
                    <TableHead className="text-center">Watch Time</TableHead>
                    <TableHead className="text-center">Shares</TableHead>
                    <TableHead className="text-center">Page Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.map((member) => (
                    <TableRow 
                      key={member.userId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedMember(selectedMember === member.userId ? null : member.userId)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.displayName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{member.totalLogins}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {member.lastLogin 
                          ? formatDistanceToNow(new Date(member.lastLogin), { addSuffix: true })
                          : <span className="text-muted-foreground">Never</span>
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{member.totalVideoWatches}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatSeconds(member.totalWatchTimeSeconds)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{member.totalShares}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{member.totalPageViews}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats || stats.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No board members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Video Details for selected member */}
          {selectedMember && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Video Watch Details - {stats?.find(s => s.userId === selectedMember)?.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.find(s => s.userId === selectedMember)?.videosWatched.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead className="text-center">Times Watched</TableHead>
                        <TableHead className="text-center">Total Time</TableHead>
                        <TableHead className="text-center">Avg % Watched</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.find(s => s.userId === selectedMember)?.videosWatched.map((video, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{video.videoTitle}</TableCell>
                          <TableCell className="text-center">{video.watchCount}</TableCell>
                          <TableCell className="text-center">{formatSeconds(video.totalWatchTimeSeconds)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={video.avgPercentWatched >= 80 ? "default" : "secondary"}>
                              {video.avgPercentWatched}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No videos watched yet</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog?.map((activity) => {
                      const member = stats?.find(s => s.userId === activity.user_id);
                      const data = activity.activity_data as Record<string, unknown>;
                      
                      let details = "";
                      if (activity.activity_type === "video_watch") {
                        details = `${data.videoTitle} (${data.percentWatched}%)`;
                      } else if (activity.activity_type === "share") {
                        details = `${data.shareType}${data.sharedItemTitle ? `: ${data.sharedItemTitle}` : ""}`;
                      } else if (activity.activity_type === "page_view") {
                        details = String(data.pageTitle || data.pagePath || "");
                      }

                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {format(new Date(activity.created_at), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{member?.displayName || "Unknown"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              activity.activity_type === "login" ? "default" :
                              activity.activity_type === "video_watch" ? "secondary" :
                              activity.activity_type === "share" ? "outline" : "secondary"
                            }>
                              {activity.activity_type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                            {details}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!activityLog || activityLog.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No activity recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
