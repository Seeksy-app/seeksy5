import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mic2, Megaphone, CheckCircle2, Circle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function RoleSettings() {
  const { currentRole, availableRoles } = useRole();

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
  });

  const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Role Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Seeksy roles and permissions
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
          <CardDescription>
            Your account is set up as a {currentRole || 'user'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentRole === 'creator' ? (
                <>
                  <Mic2 className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">Creator</div>
                    <div className="text-sm text-muted-foreground">
                      Create and manage content
                    </div>
                  </div>
                </>
              ) : currentRole === 'advertiser' ? (
                <>
                  <Megaphone className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">Advertiser</div>
                    <div className="text-sm text-muted-foreground">
                      Create and manage campaigns
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No role assigned</div>
              )}
            </div>
            <Badge variant="default" className="bg-green-500">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>
            Each Seeksy account has a single role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mic2 className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">Creator</div>
                <div className="text-sm text-muted-foreground">
                  Access to podcasts, studio, and content creation tools
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {availableRoles.includes('creator') ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">Advertiser</div>
                <div className="text-sm text-muted-foreground">
                  Access to campaigns, ad creation, and analytics
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {availableRoles.includes('advertiser') ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4">
              <Separator className="mb-4" />
              <p className="text-sm text-muted-foreground">
                <strong>Admin Note:</strong> Each account is assigned a single role. Use separate accounts for testing different roles.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Onboarding Status</CardTitle>
          <CardDescription>
            Track your onboarding progress for each role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic2 className="h-4 w-4" />
              <span>Creator Onboarding</span>
            </div>
            {profile?.creator_onboarding_completed ? (
              <Badge variant="default" className="bg-green-500">Completed</Badge>
            ) : (
              <Badge variant="secondary">Not Started</Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span>Advertiser Onboarding</span>
            </div>
            {profile?.advertiser_onboarding_completed ? (
              <Badge variant="default" className="bg-green-500">Completed</Badge>
            ) : (
              <Badge variant="secondary">Not Started</Badge>
            )}
          </div>

          {isAdmin && (
            <div className="pt-3">
              <p className="text-xs text-muted-foreground">
                Contact a super admin to reset onboarding status if needed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
