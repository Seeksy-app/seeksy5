import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, Trash2, UserPlus } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  members: { user_id: string; profiles: { username: string; full_name: string | null } }[];
}

export default function TeamsManagement() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      // Fetch members for each team
      const teamsWithMembers = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: membersData, error: membersError } = await supabase
            .from("team_members")
            .select("user_id")
            .eq("team_id", team.id);

          if (membersError) throw membersError;

          // Fetch profile data for each member
          const members = await Promise.all(
            (membersData || []).map(async (member) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("username, full_name")
                .eq("id", member.user_id)
                .single();

              return {
                user_id: member.user_id,
                profiles: profile || { username: "Unknown", full_name: null },
              };
            })
          );

          return { ...team, members };
        })
      );

      return teamsWithMembers as Team[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .order("username");

      if (error) throw error;
      return data;
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("teams")
        .insert([{ ...data, created_by: user.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setCreateDialogOpen(false);
      setTeamName("");
      setTeamDescription("");
      toast.success("Team created successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to create team: " + error.message);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete team: " + error.message);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .insert([{ team_id: data.teamId, user_id: data.userId }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setAddMemberDialogOpen(false);
      setSelectedUserId("");
      toast.success("Member added successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to add member: " + error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", data.teamId)
        .eq("user_id", data.userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Member removed successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to remove member: " + error.message);
    },
  });

  const handleCreateTeam = () => {
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    createTeamMutation.mutate({ name: teamName, description: teamDescription });
  };

  const handleAddMember = () => {
    if (!selectedTeam || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    addMemberMutation.mutate({ teamId: selectedTeam, userId: selectedUserId });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading teams...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teams Management</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>{team.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTeamMutation.mutate(team.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {team.description && (
                <CardDescription>{team.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {team.members?.length || 0} members
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeam(team.id);
                      setAddMemberDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {team.members?.map((member) => (
                    <Badge
                      key={member.user_id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10"
                      onClick={() =>
                        removeMemberMutation.mutate({
                          teamId: team.id,
                          userId: member.user_id,
                        })
                      }
                    >
                      {member.profiles.full_name || member.profiles.username}
                      <span className="ml-1 text-xs">×</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a team to organize users by department or function.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                placeholder="e.g., Marketing, Advertising"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                placeholder="Brief description of this team"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user to add to this team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="user-select">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
