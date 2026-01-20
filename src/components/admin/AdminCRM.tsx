import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Building2, Users as UsersIcon, Mail, Phone, Calendar, DollarSign, Loader2, Shield, UsersRound, UserPlus } from "lucide-react";
import { format } from "date-fns";
import UserManagementTab from "./UserManagementTab";
import RoleManagement from "./RoleManagement";
import TeamsManagement from "./TeamsManagement";
import { InviteTeamMemberDialog } from "./InviteTeamMemberDialog";

interface UserManagementProps {
  users: any[];
  filteredUsers: any[];
  searchQuery: string;
  roleFilter: string;
  setSearchQuery: (q: string) => void;
  setRoleFilter: (f: string) => void;
  onToggleRole: (userId: string, role: string) => void;
  onDeleteUser: (userId: string, username: string) => void;
}

interface AdminCRMProps {
  userManagementProps?: UserManagementProps;
}

export default function AdminCRM({ userManagementProps }: AdminCRMProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Create filtered user lists for specific tabs
  const allAdminUsers = userManagementProps?.users.filter(user => 
    user.roles?.some(role => ['super_admin', 'admin', 'manager'].includes(role))
  ) || [];
  
  const salesTeamUsers = userManagementProps?.users.filter(user => 
    user.roles?.includes('sales')
  ) || [];
  
  const eventPlannerUsers = userManagementProps?.users.filter(user => 
    user.roles?.includes('scheduler')
  ) || [];

  const { data: advertisers, isLoading: loadingAdvertisers } = useQuery({
    queryKey: ["admin-crm-advertisers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: creators, isLoading: loadingCreators } = useQuery({
    queryKey: ["admin-crm-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          podcasts (count)
        `)
        .not("account_type", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: advertiserStats } = useQuery({
    queryKey: ["admin-crm-advertiser-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertiser_transactions")
        .select("advertiser_id, amount");

      if (error) throw error;

      const statsMap = new Map();
      data?.forEach((transaction) => {
        const current = statsMap.get(transaction.advertiser_id) || 0;
        statsMap.set(transaction.advertiser_id, current + Number(transaction.amount));
      });

      return statsMap;
    },
  });

  const filteredAdvertisers = advertisers?.filter(
    (adv) =>
      adv.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adv.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCreators = creators?.filter(
    (creator) =>
      creator.account_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM</h2>
          <p className="text-muted-foreground">Manage users, advertisers, and creators</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {userManagementProps && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
          )}
        </div>
      </div>

      <InviteTeamMemberDialog 
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          {userManagementProps && (
            <>
              <TabsTrigger value="all" className="gap-2">
                <UsersIcon className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Shield className="h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="sales" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Sales Team
              </TabsTrigger>
              <TabsTrigger value="event-planners" className="gap-2">
                <Calendar className="h-4 w-4" />
                Event Planners
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="advertisers" className="gap-2">
            <Building2 className="h-4 w-4" />
            Advertisers ({advertisers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="creators" className="gap-2">
            <UsersIcon className="h-4 w-4" />
            Creators ({creators?.length || 0})
          </TabsTrigger>
          {userManagementProps && (
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
          )}
        </TabsList>

        {userManagementProps && (
          <>
            <TabsContent value="all">
              <UserManagementTab {...userManagementProps} />
            </TabsContent>

            <TabsContent value="team">
              <UserManagementTab 
                {...userManagementProps} 
                filteredUsers={allAdminUsers.filter(user =>
                  user.username?.toLowerCase().includes(userManagementProps.searchQuery.toLowerCase()) ||
                  user.full_name?.toLowerCase().includes(userManagementProps.searchQuery.toLowerCase())
                )}
              />
            </TabsContent>

            <TabsContent value="sales">
              <UserManagementTab 
                {...userManagementProps}
                filteredUsers={salesTeamUsers.filter(user =>
                  user.username?.toLowerCase().includes(userManagementProps.searchQuery.toLowerCase()) ||
                  user.full_name?.toLowerCase().includes(userManagementProps.searchQuery.toLowerCase())
                )}
              />
            </TabsContent>

            <TabsContent value="event-planners">
              <UserManagementTab 
                {...userManagementProps}
                filteredUsers={eventPlannerUsers.filter(user =>
                  user.username?.toLowerCase().includes(userManagementProps.searchQuery.toLowerCase()) ||
                  user.full_name?.toLowerCase().includes(userManagementProps.searchQuery.toLowerCase())
                )}
              />
            </TabsContent>
          </>
        )}

        <TabsContent value="advertisers" className="space-y-4">
          {loadingAdvertisers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Advertiser Accounts</CardTitle>
                <CardDescription>Manage and track all advertiser accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Total Spend</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdvertisers?.map((advertiser) => (
                      <TableRow key={advertiser.id}>
                        <TableCell>
                          <div className="font-medium">{advertiser.company_name}</div>
                          {advertiser.website_url && (
                            <a
                              href={advertiser.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {advertiser.website_url}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {advertiser.contact_email}
                            </div>
                            {advertiser.contact_phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {advertiser.contact_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(advertiser.status || "pending")}>
                            {advertiser.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3" />
                            0.00
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            {(advertiserStats?.get(advertiser.id) || 0).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(advertiser.created_at || ""), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          {loadingCreators ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Creator Accounts</CardTitle>
                <CardDescription>Track all content creators on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Podcasts</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCreators?.map((creator) => (
                      <TableRow key={creator.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {creator.account_avatar_url ? (
                              <img
                                src={creator.account_avatar_url}
                                alt={creator.account_full_name || "Creator"}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {creator.account_full_name?.[0]?.toUpperCase() || "U"}
                                </span>
                              </div>
                            )}
                            <span className="font-medium">
                              {creator.account_full_name || "Unnamed"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          @{creator.username || "no-username"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {creator.account_type || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(creator as any).podcasts?.[0]?.count || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(creator.created_at || ""), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {userManagementProps && (
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
