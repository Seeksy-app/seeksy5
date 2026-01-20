import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Mail, Loader2, ArrowLeft, RefreshCw, MoreVertical, Link as LinkIcon, UserMinus, Copy, UserCog, Archive } from "lucide-react";

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type TeamInvitation = {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
};

type CombinedMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
  avatar_url: string | null;
  created_at: string;
  type: 'member' | 'invitation';
};

type AppRole = "member" | "manager" | "scheduler" | "sales";

export default function Team() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [combinedMembers, setCombinedMembers] = useState<CombinedMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CombinedMember | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("member");

  useEffect(() => {
    checkAuth();
    loadTeamData();
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles && roles.length > 0) {
      const hasAdminRole = roles.some(r => r.role === "admin" || r.role === "super_admin");
      setIsAdmin(hasAdminRole);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTeamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await Promise.all([
        loadTeamMembers(user.id),
        loadInvitations(user.id)
      ]);
      
      // Note: combineMembers() will be called automatically by the useEffect
      // that watches teamMembers and invitations state changes
    } catch (error: any) {
      console.error("Error loading team data:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (userId: string) => {
    try {
      console.log("Loading team members for user:", userId);
      
      // Get the current user's team, create one if it doesn't exist
      let { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (teamError) {
        console.error("Error fetching team:", teamError);
        throw teamError;
      }

      if (!team) {
        console.log("No team found, creating one");
        // Create team for this user
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("account_full_name, full_name, username")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile for team creation:", profileError);
        }

        const teamName = `${profile?.account_full_name || profile?.full_name || profile?.username || 'User'}'s Team`;
        
        const { data: newTeam, error: createError } = await supabase
          .from("teams")
          .insert({
            owner_id: userId,
            name: teamName,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating team:", createError);
          throw createError;
        }

        console.log("Team created:", newTeam);

        // Add owner as team member
        const { error: memberInsertError } = await supabase
          .from("team_members")
          .insert({
            team_id: newTeam.id,
            user_id: userId,
            role: 'owner',
          });

        if (memberInsertError) {
          console.error("Error adding owner to team:", memberInsertError);
        }

        team = newTeam;
      }

      console.log("Loading members for team:", team.id);

      // Get team members from team_members table
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq("team_id", team.id);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        throw membersError;
      }

      console.log("Found team members:", members);

      // Get profile info for each member
      if (!members || members.length === 0) {
        setTeamMembers([]);
        return;
      }

      const memberIds = members.map(m => m.user_id);
      
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, account_full_name, full_name, username, avatar_url")
        .in("id", memberIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }
      
      const membersWithDetails: TeamMember[] = members.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          email: "", // Will be populated if needed
          full_name: profile?.account_full_name || profile?.full_name || profile?.username || null,
          avatar_url: profile?.avatar_url || null,
          created_at: member.joined_at,
        };
      });

      console.log("Members with details:", membersWithDetails);
      setTeamMembers(membersWithDetails);
    } catch (error: any) {
      console.error("Error loading team members:", error);
      throw error;
    }
  };

  const loadInvitations = async (userId: string) => {
    try {
      console.log("Loading invitations for user:", userId);
      
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("inviter_id", userId)
        .eq("status", "pending")
        .order("invited_at", { ascending: false });

      if (error) {
        console.error("Error loading invitations:", error);
        throw error;
      }

      console.log("Found invitations:", data);
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error in loadInvitations:", error);
      // Don't throw - allow page to load even if invitations fail
      setInvitations([]);
    }
  };

  const combineMembers = () => {
    const combined: CombinedMember[] = [];

    // Add active team members
    teamMembers.forEach(member => {
      const [firstName = "", lastName = ""] = (member.full_name || "").split(" ");
      combined.push({
        id: member.id,
        firstName,
        lastName: lastName || "",
        email: member.email || "",
        role: member.role,
        status: 'active',
        avatar_url: member.avatar_url,
        created_at: member.created_at,
        type: 'member'
      });
    });

    // Add pending invitations
    invitations.forEach(invitation => {
      const [firstName = "", lastName = ""] = (invitation.invitee_name || "").split(" ");
      combined.push({
        id: invitation.id,
        firstName,
        lastName: lastName || "",
        email: invitation.invitee_email,
        role: invitation.role,
        status: 'pending',
        avatar_url: null,
        created_at: invitation.invited_at,
        type: 'invitation'
      });
    });

    setCombinedMembers(combined);
  };

  useEffect(() => {
    combineMembers();
  }, [teamMembers, invitations]);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toast({
        title: "Required fields",
        description: "Please enter both name and email address",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the current user's team
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!team) throw new Error("Team not found");

      // Use edge function to send invitation
      const { data, error } = await supabase.functions.invoke("send-team-invitation", {
        body: {
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          team_id: team.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Invited ${inviteName} (${inviteEmail}) to join your team`,
      });

      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      
      // Reload team data
      loadTeamData();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send team invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitation: TeamInvitation) => {
    setResendingId(invitation.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call edge function to resend invitation
      const { error } = await supabase.functions.invoke("send-team-invitation", {
        body: {
          email: invitation.invitee_email,
          name: invitation.invitee_name,
          role: invitation.role,
          team_id: null, // Will use existing team
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation resent",
        description: `Resent invitation to ${invitation.invitee_email}`,
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });

      loadTeamData();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteLink = async (email: string) => {
    const inviteLink = `${window.location.origin}/auth?email=${encodeURIComponent(email)}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedId(email);
      toast({
        title: "Link copied!",
        description: "Invite link copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Team member has been removed from the team",
      });

      loadTeamData();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = (member: CombinedMember) => {
    setSelectedMember(member);
    setNewRole(member.role as AppRole);
    setShowRoleDialog(true);
  };

  const handleSaveRoleChange = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", selectedMember.id);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `${selectedMember.firstName}'s role has been changed to ${newRole}`,
      });

      setShowRoleDialog(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const handleArchiveMember = async (memberId: string, memberName: string) => {
    try {
      // For now, we'll use a soft delete by updating the role to 'archived'
      const { error } = await supabase
        .from("team_members")
        .update({ role: "archived" })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member archived",
        description: `${memberName} has been archived`,
      });

      loadTeamData();
    } catch (error) {
      console.error("Error archiving member:", error);
      toast({
        title: "Error",
        description: "Failed to archive team member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500";
      case "manager":
      case "admin":
        return "bg-blue-500";
      case "scheduler":
        return "bg-green-500";
      case "sales":
        return "bg-purple-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-green-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingCount = invitations.filter(i => i.status === "pending").length;
  const activeCount = teamMembers.length;
  const totalCount = pendingCount + activeCount;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold mb-2">Team Management</h1>
            <p className="text-muted-foreground">
              Invite and manage team members for your creator account
            </p>
          </div>

          <Button onClick={() => setShowInviteDialog(true)} className="bg-[hsl(207,100%,50%)] hover:bg-[hsl(207,100%,45%)]">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-semibold">Directory</CardTitle>
              <span className="text-lg text-muted-foreground">{combinedMembers.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {combinedMembers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                <p className="text-muted-foreground">
                  Invite team members to collaborate
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[25%]">First Name</TableHead>
                    <TableHead className="w-[25%]">Last Name</TableHead>
                    <TableHead className="w-[20%]">Role access</TableHead>
                    <TableHead className="w-[20%]">Status</TableHead>
                    <TableHead className="w-[10%] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.firstName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                              <span className="text-sm font-medium">
                                {member.firstName?.[0]?.toUpperCase() || "?"}
                              </span>
                              {member.status === 'pending' && (
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 border-2 border-background" />
                              )}
                            </div>
                          )}
                          <span className="font-medium">
                            {member.firstName || "Unnamed"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.lastName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.status === 'active' ? (
                            <>
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-sm text-muted-foreground">Active</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              <span className="text-sm text-muted-foreground">Pending</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {member.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                            {member.status === 'pending' && member.type === 'invitation' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(invitations.find(i => i.id === member.id)!)}
                                  disabled={resendingId === member.id}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyInviteLink(member.email)}
                                >
                                  <LinkIcon className="h-4 w-4 mr-2" />
                                  {copiedId === member.email ? "Copied!" : "Copy unique invite link"}
                                </DropdownMenuItem>
                              </>
                            )}
                            {member.role !== "owner" && isAdmin && member.status === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(member)}
                                >
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleArchiveMember(member.id, member.firstName)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                            {member.role !== "owner" && isAdmin && (
                              <>
                                {member.type === 'invitation' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleCancelInvitation(member.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Cancel Invitation
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-red-600"
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Delete Member
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
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
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value: AppRole) => setInviteRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="scheduler">Scheduler</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={inviting} className="w-full">
                {inviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
              <DialogDescription>
                Update {selectedMember?.firstName}'s role in the team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newRole">New Role</Label>
                <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
                  <SelectTrigger id="newRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="scheduler">Scheduler</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRoleDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveRoleChange} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}