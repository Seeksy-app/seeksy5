import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AdvertiserAccessCard = () => {
  const navigate = useNavigate();

  const { data: requests } = useQuery({
    queryKey: ['identity-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const result = await (supabase as any)
        .from('identity_requests')
        .select('*')
        .eq('creator_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      return (result.data as any[]) || [];
    },
  });

  const pendingCount = requests?.length || 0;
  const hasPending = pendingCount > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>Advertiser Access</CardTitle>
          </div>
          {hasPending && <Badge variant="destructive">{pendingCount} pending</Badge>}
        </div>
        <CardDescription>Identity usage requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPending ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Requests awaiting review</p>
                <p className="text-xs text-muted-foreground">
                  {pendingCount} {pendingCount === 1 ? 'advertiser' : 'advertisers'} requesting access
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending requests</p>
          </div>
        )}

        <Button 
          onClick={() => navigate("/identity")}
          className="w-full"
          variant={hasPending ? "default" : "outline"}
        >
          {hasPending ? "Review Requests" : "Open Identity & Rights"}
        </Button>
      </CardContent>
    </Card>
  );
};
