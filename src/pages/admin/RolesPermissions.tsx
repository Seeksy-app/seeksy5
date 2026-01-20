/**
 * Admin Roles & Permissions Management
 * 
 * Full RBAC management interface for assigning roles,
 * managing permissions, and viewing audit logs.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Users, Key, History, Search, UserPlus, Settings2 } from 'lucide-react';

interface RoleDefinition {
  id: string;
  role_key: string;
  display_name: string;
  description: string;
  priority: number;
  is_system_role: boolean;
  is_active: boolean;
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

interface AuditLog {
  id: string;
  user_id: string;
  target_user_id: string;
  action: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  platform_owner: 'bg-purple-500',
  super_admin: 'bg-red-500',
  admin: 'bg-orange-500',
  support_admin: 'bg-blue-500',
  support_agent: 'bg-cyan-500',
  team_manager: 'bg-green-500',
  creator: 'bg-emerald-500',
  advertiser: 'bg-amber-500',
  board_member: 'bg-indigo-500',
  read_only_analyst: 'bg-gray-500',
};

export default function RolesPermissions() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch role definitions
  const { data: roles = [] } = useQuery({
    queryKey: ['roleDefinitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_definitions')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as RoleDefinition[];
    }
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category');
      if (error) throw error;
      return data as Permission[];
    }
  });

  // Fetch role-permission mappings
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Fetch users with roles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['usersWithRoles', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username
        `)
        .limit(100);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);
          
          return {
            id: profile.id,
            email: profile.username || '',
            full_name: profile.full_name || '',
            roles: userRoles?.map(r => r.role) || []
          };
        })
      );

      return usersWithRoles as UserWithRole[];
    }
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['permissionAuditLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AuditLog[];
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersWithRoles'] });
      queryClient.invalidateQueries({ queryKey: ['permissionAuditLogs'] });
      toast.success('Role assigned successfully');
      setIsAssignDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to assign role: ' + error.message);
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersWithRoles'] });
      queryClient.invalidateQueries({ queryKey: ['permissionAuditLogs'] });
      toast.success('Role removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove role: ' + error.message);
    }
  });

  // Toggle permission for role
  const togglePermissionMutation = useMutation({
    mutationFn: async ({ role, permission, enabled }: { role: string; permission: string; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role: role as any, permission });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role as any)
          .eq('permission', permission);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      toast.success('Permission updated');
    },
    onError: (error) => {
      toast.error('Failed to update permission: ' + error.message);
    }
  });

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const hasRolePermission = (role: string, permission: string) => {
    return rolePermissions.some(rp => rp.role === role && rp.permission === permission);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">Manage user access across the platform</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" /> Permissions Matrix
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Management</CardTitle>
              <CardDescription>Assign and manage user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <span className="text-muted-foreground text-sm">No roles</span>
                            ) : (
                              user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="secondary"
                                  className={`${ROLE_COLORS[role] || 'bg-gray-500'} text-white cursor-pointer`}
                                  onClick={() => {
                                    if (confirm(`Remove ${role} role from this user?`)) {
                                      removeRoleMutation.mutate({ userId: user.id, role });
                                    }
                                  }}
                                >
                                  {role}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isAssignDialogOpen && selectedUserId === user.id} onOpenChange={(open) => {
                            setIsAssignDialogOpen(open);
                            if (open) setSelectedUserId(user.id);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-1" /> Assign Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Role</DialogTitle>
                                <DialogDescription>
                                  Select a role to assign to {user.full_name || user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Label>Role</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.filter(r => !user.roles.includes(r.role_key)).map((role) => (
                                      <SelectItem key={role.role_key} value={role.role_key}>
                                        {role.display_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (newRole && selectedUserId) {
                                      assignRoleMutation.mutate({ userId: selectedUserId, role: newRole });
                                    }
                                  }}
                                  disabled={!newRole}
                                >
                                  Assign Role
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${ROLE_COLORS[role.role_key] || 'bg-gray-500'} text-white`}>
                      {role.display_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Priority: {role.priority}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={role.is_system_role ? 'text-blue-500' : 'text-green-500'}>
                      {role.is_system_role ? 'System Role' : 'Custom Role'}
                    </span>
                    <span className={role.is_active ? 'text-green-500' : 'text-red-500'}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Permissions Matrix Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>Configure permissions for each role</CardDescription>
                </div>
                <Select value={selectedRole || ''} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select role to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_key} value={role.role_key}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {selectedRole ? (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-medium capitalize flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        {category}
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {perms.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium">{perm.name}</p>
                              <p className="text-xs text-muted-foreground">{perm.key}</p>
                            </div>
                            <Switch
                              checked={hasRolePermission(selectedRole, perm.key)}
                              onCheckedChange={(checked) => {
                                togglePermissionMutation.mutate({
                                  role: selectedRole,
                                  permission: perm.key,
                                  enabled: checked
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Select a role to view and edit permissions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Audit Log</CardTitle>
              <CardDescription>Track all role and permission changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={log.action === 'role_removed' ? 'destructive' : 'default'}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.new_value && (
                            <span className="text-green-600">
                              +{JSON.stringify(log.new_value)}
                            </span>
                          )}
                          {log.old_value && (
                            <span className="text-red-600 ml-2">
                              -{JSON.stringify(log.old_value)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
