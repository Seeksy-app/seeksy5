import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Search, Mail, Shield, UserCog, Calendar, Award, Mic, Sparkles, Coins, ArrowUpDown, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";

type SortField = "credits" | "joined" | "name";
type SortDirection = "asc" | "desc";

const AdminCreators = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all creator users (users who are not admins)
  const { data: creators, isLoading } = useQuery({
    queryKey: ["admin-creators", roleFilter, planFilter],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles for all users
      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get credits for all users
      const { data: allCredits, error: creditsError } = await supabase
        .from("user_credits")
        .select("user_id, balance, total_purchased, total_spent, total_earned");

      if (creditsError) throw creditsError;

      // Get subscriptions for all users
      const { data: allSubscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id, plan_name, status");

      if (subsError) throw subsError;

      // Combine the data
      const combinedData = profiles?.map((profile) => {
        const userRoles = allRoles?.filter((r) => r.user_id === profile.id) || [];
        const userCredits = allCredits?.find((c) => c.user_id === profile.id);
        const userSub = allSubscriptions?.find((s) => s.user_id === profile.id);

        return {
          ...profile,
          user_roles: userRoles,
          user_credits: userCredits,
          subscriptions: userSub,
        };
      });

      // Filter based on role and plan
      const filteredCreators = combinedData?.filter((profile) => {
        const roles = profile.user_roles?.map((r: any) => r.role) || [];
        const isAdmin = roles.includes("admin") || roles.includes("super_admin");
        
        if (isAdmin) return false;
        
        // Role filter
        if (roleFilter !== "all") {
          if (roleFilter === "creator" && !roles.includes("creator")) return false;
          if (roleFilter === "podcaster" && !roles.includes("podcaster")) return false;
          if (roleFilter === "event_creator" && !roles.includes("event_creator")) return false;
          if (roleFilter === "influencer" && !roles.includes("influencer")) return false;
          if (roleFilter === "advertiser" && !roles.includes("advertiser")) return false;
          if (roleFilter === "member" && roles.length > 0) return false;
        }

        // Plan filter
        if (planFilter !== "all") {
          const plan = profile.subscriptions?.plan_name?.toLowerCase() || "free";
          if (planFilter !== plan) return false;
        }
        
        return true;
      });

      return filteredCreators || [];
    },
  });

  // Fetch creator stats
  const { data: stats } = useQuery({
    queryKey: ["creator-stats"],
    queryFn: async () => {
      const { count: totalCreators } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: activePodcasters } = await supabase
        .from("podcasts")
        .select("*", { count: "exact", head: true });

      const { count: activeEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("event_date", new Date().toISOString());

      const { count: totalMeetings } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true });

      return {
        totalCreators: totalCreators || 0,
        activePodcasters: activePodcasters || 0,
        activeEvents: activeEvents || 0,
        totalMeetings: totalMeetings || 0,
      };
    },
  });

  // AI-powered search
  const handleAISearch = async () => {
    if (!searchTerm.trim()) {
      setAiResults([]);
      return;
    }

    setIsAISearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-admin-search", {
        body: { query: searchTerm, searchType: "creators" },
      });

      if (error) throw error;

      setAiResults(data.results || []);
      
      if (data.results?.length > 0) {
        toast.success(`Found ${data.results.length} results using AI search`);
      } else {
        toast.info("No matches found");
      }
    } catch (error: any) {
      console.error("AI search error:", error);
      toast.error("AI search failed", {
        description: error.message,
      });
    } finally {
      setIsAISearching(false);
    }
  };

  // Sort and filter creators
  const sortedAndFilteredCreators = creators
    ?.filter((creator) => {
      // If AI search has results, filter by AI results
      if (aiResults.length > 0) {
        return aiResults.some(result => result.id === creator.id);
      }

      // Otherwise use basic text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        creator.account_full_name?.toLowerCase().includes(searchLower) ||
        creator.username?.toLowerCase().includes(searchLower);

      return matchesSearch;
    })
    ?.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "credits") {
        const aCredits = a.user_credits?.balance || 0;
        const bCredits = b.user_credits?.balance || 0;
        comparison = aCredits - bCredits;
      } else if (sortField === "joined") {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        comparison = aDate - bDate;
      } else if (sortField === "name") {
        comparison = (a.account_full_name || "").localeCompare(b.account_full_name || "");
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleRowClick = (creator: any) => {
    setSelectedUser(creator);
    setDrawerOpen(true);
  };

  const getRoleBadges = (roles: any[]) => {
    if (!roles || roles.length === 0) return <Badge variant="secondary">Member</Badge>;

    return roles.map((roleObj: any, index: number) => (
      <Badge key={index} variant="secondary" className="mr-1">
        {roleObj.role}
      </Badge>
    ));
  };

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription) {
      return <Badge variant="outline">Free</Badge>;
    }

    const variants: any = {
      free: "outline",
      starter: "secondary",
      creator: "secondary",
      pro: "default",
      power_user: "default",
      studio_team: "default",
    };

    return (
      <Badge variant={variants[subscription.plan_name?.toLowerCase()] || "outline"} className="capitalize">
        {subscription.plan_name || "Free"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, credits, and view CRM-style profiles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreators || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Podcasters</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePodcasters || 0}</div>
            <p className="text-xs text-muted-foreground">With podcasts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">Meetings booked</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Directory</CardTitle>
          <CardDescription>Search, filter, and click any row to view full profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <Label htmlFor="search">AI-Powered Search</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Try: 'users with low credits', 'joined last week'..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!e.target.value.trim()) {
                        setAiResults([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAISearch();
                      }
                    }}
                    className="pl-8"
                  />
                </div>
                <Button 
                  onClick={handleAISearch} 
                  disabled={isAISearching || !searchTerm.trim()}
                  className="shrink-0"
                >
                  {isAISearching ? "Searching..." : "AI Search"}
                </Button>
              </div>
              {aiResults.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Showing {aiResults.length} AI-matched results
                </p>
              )}
            </div>
            <div className="w-40">
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="podcaster">Podcaster</SelectItem>
                  <SelectItem value="event_creator">Event Creator</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="advertiser">Advertiser</SelectItem>
                  <SelectItem value="member">Member (no role)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label htmlFor="plan-filter">Plan</Label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger id="plan-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="power_user">Power User</SelectItem>
                  <SelectItem value="studio_team">Studio Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creators Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({sortedAndFilteredCreators?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === "name" && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("credits")}
                  >
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      Credits
                      {sortField === "credits" && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("joined")}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      {sortField === "joined" && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredCreators && sortedAndFilteredCreators.length > 0 ? (
                  sortedAndFilteredCreators.map((creator) => {
                    const aiMatch = aiResults.find(r => r.id === creator.id);
                    const credits = creator.user_credits?.balance || 0;
                    return (
                      <TableRow 
                        key={creator.id}
                        className={`cursor-pointer hover:bg-muted/50 ${aiMatch ? "bg-primary/5" : ""}`}
                        onClick={() => handleRowClick(creator)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {aiMatch && (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                            {creator.account_full_name || "No name"}
                          </div>
                          {aiMatch?.matchReason && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {aiMatch.matchReason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{creator.username || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell>{getRoleBadges(creator.user_roles)}</TableCell>
                        <TableCell>{getSubscriptionBadge(creator.subscriptions)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={credits < 10 ? "text-destructive font-medium" : ""}>
                              {credits}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(creator);
                                setDrawerOpen(true);
                              }}
                            >
                              <span className="text-xs text-muted-foreground">Manage</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {creator.created_at
                            ? new Date(creator.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(creator);
                            }}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No creators found matching your search" : "No creators yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            // Refresh the list when drawer closes
            queryClient.invalidateQueries({ queryKey: ["admin-creators"] });
          }
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminCreators;
