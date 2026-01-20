import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  UserPlus, 
  MoreHorizontal, 
  Mail,
  Shield,
  Loader2,
  RefreshCw,
  UserX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    email?: string;
  };
}

interface PendingInvite {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
}

const ALL_ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full platform access' },
  { value: 'admin', label: 'Admin', description: 'Everything except platform settings' },
  { value: 'board_member', label: 'Board Member', description: 'Board Portal access only' },
  { value: 'cfo', label: 'CFO', description: 'Financials + user list read' },
  { value: 'cmo', label: 'CMO', description: 'Marketing + Revenue Insights' },
  { value: 'cco', label: 'CCO', description: 'Creator + Content Management' },
  { value: 'manager', label: 'Manager', description: 'Help Desk + Billing overview' },
  { value: 'creator', label: 'Creator', description: 'Creator Dashboard access' },
  { value: 'member', label: 'Member', description: 'Basic member access' },
  { value: 'advertiser', label: 'Advertiser', description: 'Advertiser portal access' },
  { value: 'agency', label: 'Agency', description: 'Agency management access' },
];

// Admin-level roles displayed in the role permissions card
const ADMIN_ROLES = ALL_ROLES.slice(0, 7);

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  // Fetch team members with their roles
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-team-members'],
    queryFn: async () => {
      // Get users with admin/team roles (including board members)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['super_admin', 'admin', 'board_member', 'cfo', 'cmo', 'cco', 'manager']);

      if (rolesError) throw rolesError;

      // Get profile info for each user
      const userIds = [...new Set(roles.map(r => r.user_id))];
      
      if (userIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      return roles.map(role => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        joined_at: role.created_at,
        profile: profiles?.find(p => p.id === role.user_id) || { full_name: 'Unknown' }
      }));
    }
  });

  // Fetch pending invitations
  const { data: pendingInvites = [], refetch: refetchInvites } = useQuery({
    queryKey: ['admin-pending-invites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch ALL invites for the current user (not just pending)
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PendingInvite[];
    }
  });
  
  // Filter to just pending for the main display
  const activePendingInvites = pendingInvites.filter(i => i.status === 'pending');

  // Invite mutation - calls edge function to send email
  const inviteMutation = useMutation({
    mutationFn: async ({ email, name, role }: { email: string; name: string; role: string }) => {
      // Call edge function to send email and create invitation
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: { email, name, role, team_id: null }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Invitation sent successfully" });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("manager");
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-invites'] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error sending invitation", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  // Resend invitation
  const resendMutation = useMutation({
    mutationFn: async (invite: PendingInvite) => {
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: { email: invite.invitee_email, name: invite.invitee_name || '', role: invite.role, team_id: null }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Invitation resent" });
    },
    onError: (err: any) => {
      toast({ title: "Error resending", description: err.message, variant: "destructive" });
    }
  });

  // Cancel invitation
  const cancelMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('id', inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invitation cancelled" });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-invites'] });
    },
    onError: (err: any) => {
      toast({ title: "Error cancelling", description: err.message, variant: "destructive" });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Remove old admin roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin', 'cfo', 'cmo', 'cco', 'manager']);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error updating role", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin', 'cfo', 'cmo', 'cco', 'manager']);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User removed from team" });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error removing user", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'board_member': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'cfo': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cmo': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'cco': return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'manager': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
      case 'creator': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'advertiser': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'agency': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Team Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage admin team members and their roles
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Teammate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join the admin team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Assign Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => inviteMutation.mutate({ email: inviteEmail, name: inviteName, role: inviteRole })}
                disabled={!inviteEmail || !inviteName || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ADMIN_ROLES.map((role) => (
              <div key={role.value} className="text-center p-3 border rounded-lg">
                <Badge className={getRoleBadgeColor(role.value)}>{role.label}</Badge>
                <p className="text-xs text-muted-foreground mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitations
            </CardTitle>
            <CardDescription>
              {activePendingInvites.length} pending, {pendingInvites.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.invitee_email}</TableCell>
                    <TableCell>{invite.invitee_name || '—'}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(invite.role)}>
                        {ALL_ROLES.find(r => r.value === invite.role)?.label || invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invite.status === 'pending' ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Pending
                        </Badge>
                      ) : invite.status === 'accepted' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                          Accepted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400">
                          {invite.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(invite.invited_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invite.status === 'pending' ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendMutation.mutate(invite)}
                            disabled={resendMutation.isPending}
                            title="Resend invitation"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate(invite.id)}
                            disabled={cancelMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            title="Cancel invitation"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Team</CardTitle>
          <CardDescription>
            {members.length} team member{members.length !== 1 ? 's' : ''} with admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite your first teammate to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{member.user_id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {ALL_ROLES.find(r => r.value === member.role)?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.joined_at 
                        ? new Date(member.joined_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ADMIN_ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role.value}
                              onClick={() => updateRoleMutation.mutate({ 
                                userId: member.user_id, 
                                newRole: role.value 
                              })}
                              disabled={member.role === role.value}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Change to {role.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => deactivateMutation.mutate(member.user_id)}
                            className="text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove from team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
