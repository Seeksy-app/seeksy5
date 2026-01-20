import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Edit,
  Save,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBoardContent } from '@/hooks/useBoardContent';

interface BoardMember {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export default function BoardMemberManagement() {
  const queryClient = useQueryClient();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState('');

  // Fetch board members
  const { data: boardMembers, isLoading } = useQuery({
    queryKey: ['boardMembers'],
    queryFn: async () => {
      // First get user_roles with board_member role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, created_at')
        .eq('role', 'board_member');

      if (roleError) throw roleError;
      if (!roleData || roleData.length === 0) return [];

      // Then get profiles for those users
      const userIds = roleData.map(r => r.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Merge the data
      return roleData.map((role) => {
        const profile = profiles?.find((p: any) => p.id === role.user_id);
        return {
          id: role.user_id,
          email: profile?.username || role.user_id.slice(0, 8),
          full_name: profile?.full_name || null,
          created_at: role.created_at,
        };
      }) as BoardMember[];
    },
  });

  // Content hooks
  const businessModel = useBoardContent('business-model');
  const gtm = useBoardContent('gtm');
  const forecasts = useBoardContent('forecasts');
  const stateOfCompany = useBoardContent('state-of-company');

  const contentPages = [
    { slug: 'state-of-company', label: 'State of Company', hook: stateOfCompany },
    { slug: 'business-model', label: 'Business Model', hook: businessModel },
    { slug: 'gtm', label: 'GTM Strategy', hook: gtm },
    { slug: 'forecasts', label: 'Forecasts', hook: forecasts },
  ];

  // Add board member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      // Find user by username (email field in form is used for username lookup)
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!existingProfile) {
        toast.error('User not found by username. Please check the username.');
        throw new Error('User not found');
      }

      // Add board_member role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: existingProfile.id,
          role: 'board_member' as const,
        });

      if (roleError) {
        if (roleError.code === '23505') {
          toast.error('User is already a board member');
          throw new Error('Already a board member');
        }
        throw roleError;
      }

      return existingProfile.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardMembers'] });
      toast.success('Board member added successfully');
      setIsAddDialogOpen(false);
      setNewMemberEmail('');
      setNewMemberName('');
    },
    onError: (error: any) => {
      if (!error.message.includes('User not found') && !error.message.includes('Already a board member')) {
        toast.error('Failed to add board member');
      }
    },
  });

  // Remove board member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'board_member');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardMembers'] });
      toast.success('Board member removed');
    },
    onError: () => {
      toast.error('Failed to remove board member');
    },
  });

  // Reset video progress mutation
  const resetProgressMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('video_progress')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Video progress reset');
    },
    onError: () => {
      toast.error('Failed to reset progress');
    },
  });

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    addMemberMutation.mutate({ email: newMemberEmail, name: newMemberName });
  };

  const handleEditContent = (slug: string, content: string) => {
    setEditingContent(slug);
    setContentDraft(content);
  };

  const handleSaveContent = (hook: any) => {
    hook.updateContent({ content: contentDraft });
    setEditingContent(null);
    setContentDraft('');
    toast.success('Content saved');
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Board Member Management</h1>
        <p className="text-muted-foreground">Manage board members and portal content</p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Board Members</TabsTrigger>
          <TabsTrigger value="content">Portal Content</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Board Members
                </CardTitle>
                <CardDescription>
                  Users with board member access to the investor portal
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Board Member</DialogTitle>
                    <DialogDescription>
                      Enter the email of an existing user to grant board member access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="board@example.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name (optional)</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
                      {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : boardMembers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No board members yet. Add your first board member above.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boardMembers?.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.full_name || 'Not set'}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resetProgressMutation.mutate(member.id)}
                              disabled={resetProgressMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                              disabled={removeMemberMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Board Portal Content
              </CardTitle>
              <CardDescription>
                Edit the markdown content displayed on each board portal page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {contentPages.map((page) => (
                <div key={page.slug} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{page.label}</h3>
                    {editingContent === page.slug ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContent(null);
                            setContentDraft('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveContent(page.hook)}
                          disabled={page.hook.isUpdating}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContent(page.slug, page.hook.content?.content || '')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingContent === page.slug ? (
                    <Textarea
                      value={contentDraft}
                      onChange={(e) => setContentDraft(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      placeholder="Enter markdown content..."
                    />
                  ) : (
                    <div className="bg-muted/50 rounded p-4 max-h-[200px] overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {page.hook.content?.content?.slice(0, 500) || 'No content yet'}
                        {(page.hook.content?.content?.length || 0) > 500 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
