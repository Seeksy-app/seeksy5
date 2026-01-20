import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Settings } from "lucide-react";

const DEFAULT_PERMISSIONS = [
  { value: "manage_users", label: "Manage Users" },
  { value: "manage_roles", label: "Manage Roles & Permissions" },
  { value: "manage_permissions", label: "Configure Permissions" },
  { value: "view_analytics", label: "View Analytics" },
  { value: "manage_subscriptions", label: "Manage Subscriptions" },
  { value: "manage_campaigns", label: "Manage Ad Campaigns" },
  { value: "manage_ads", label: "Manage Ads" },
  { value: "manage_advertisers", label: "Manage Advertisers" },
  { value: "manage_legal", label: "Manage Legal Pages" },
  { value: "view_revenue", label: "View Revenue" },
  { value: "manage_content", label: "Manage Content" },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  scheduler: "Scheduler",
  sales: "Sales",
  advertiser: "Advertiser",
  member: "Member",
};

export default function RoleManagement() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPermissionDialogOpen, setAddPermissionDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState<{ value: string; label: string }[]>([]);
  const [newPermissionValue, setNewPermissionValue] = useState("");
  const [newPermissionLabel, setNewPermissionLabel] = useState("");

  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role", { ascending: true });

      if (error) throw error;

      // Group by role and collect all unique permissions
      const grouped: Record<string, string[]> = {};
      const allPerms = new Set<string>();
      
      data.forEach((perm) => {
        if (!grouped[perm.role]) {
          grouped[perm.role] = [];
        }
        grouped[perm.role].push(perm.permission);
        allPerms.add(perm.permission);
      });

      // Identify custom permissions (not in default list)
      const custom = Array.from(allPerms)
        .filter(p => !DEFAULT_PERMISSIONS.find(dp => dp.value === p))
        .map(p => ({
          value: p,
          label: p.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }));
      
      setCustomPermissions(custom);
      return grouped;
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: string; permissions: string[] }) => {
      // Delete existing permissions for this role
      await supabase
        .from("role_permissions")
        .delete()
        .eq("role", role as any);

      // Insert new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from("role_permissions")
          .insert(permissions.map(permission => ({ 
            role: role as any, 
            permission 
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      setEditDialogOpen(false);
      setSelectedRole(null);
      toast.success("Role permissions updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update permissions: " + error.message);
    },
  });

  const handleEditRole = (role: string) => {
    setSelectedRole(role);
    setSelectedPermissions(rolePermissions?.[role] || []);
    setEditDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      updatePermissionsMutation.mutate({
        role: selectedRole,
        permissions: selectedPermissions,
      });
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleAddCustomPermission = () => {
    if (!newPermissionValue.trim() || !newPermissionLabel.trim()) {
      toast.error("Both permission value and label are required");
      return;
    }

    const permValue = newPermissionValue.toLowerCase().replace(/\s+/g, '_');
    
    if (DEFAULT_PERMISSIONS.find(p => p.value === permValue) || 
        customPermissions.find(p => p.value === permValue)) {
      toast.error("This permission already exists");
      return;
    }

    setCustomPermissions(prev => [...prev, { value: permValue, label: newPermissionLabel }]);
    setNewPermissionValue("");
    setNewPermissionLabel("");
    setAddPermissionDialogOpen(false);
    toast.success("Custom permission added");
  };

  const availablePermissions = [...DEFAULT_PERMISSIONS, ...customPermissions];

  if (isLoading) {
    return <div className="text-center py-8">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Role Permissions</h2>
        <Button onClick={() => setAddPermissionDialogOpen(true)} variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Add Custom Permission
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(rolePermissions || {}).map(([role, permissions]) => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>{ROLE_LABELS[role] || role}</CardTitle>
                </div>
                {role !== "super_admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription>
                {permissions.length} {permissions.length === 1 ? "permission" : "permissions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => (
                  <Badge key={perm} variant="secondary">
                    {availablePermissions.find((p) => p.value === perm)?.label || perm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure Permissions for {selectedRole ? ROLE_LABELS[selectedRole] : ""}
            </DialogTitle>
            <DialogDescription>
              Select the permissions this role should have. Changes will affect all users with this role.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
            {availablePermissions.map((perm) => (
              <div key={perm.value} className="flex items-center space-x-2">
                <Checkbox
                  id={perm.value}
                  checked={selectedPermissions.includes(perm.value)}
                  onCheckedChange={() => togglePermission(perm.value)}
                />
                <Label
                  htmlFor={perm.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {perm.label}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addPermissionDialogOpen} onOpenChange={setAddPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="perm-value">Permission Value *</Label>
              <Input
                id="perm-value"
                placeholder="e.g., access_legal"
                value={newPermissionValue}
                onChange={(e) => setNewPermissionValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase with underscores (will be auto-formatted)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perm-label">Permission Label *</Label>
              <Input
                id="perm-label"
                placeholder="e.g., Access Legal"
                value={newPermissionLabel}
                onChange={(e) => setNewPermissionLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomPermission}>Add Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
