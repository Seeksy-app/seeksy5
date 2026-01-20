import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const BrandRequestsWidget = () => {
  const navigate = useNavigate();

  const { data: requests } = useQuery({
    queryKey: ["brand-requests-widget"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { pending: 0, approved: 0 };

      const { data } = await (supabase as any)
        .from("identity_access_requests")
        .select("status")
        .eq("creator_user_id", user.id);

      const pending = data?.filter((r: any) => r.status === "pending").length || 0;
      const approved = data?.filter((r: any) => r.status === "approved").length || 0;

      return { pending, approved };
    },
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Brand Requests
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Advertiser identity access
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Hide widget</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <span className="text-sm font-medium">Pending</span>
            <span className="text-2xl font-bold">{requests?.pending || 0}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium">Approved</span>
            <span className="text-lg font-semibold text-muted-foreground">{requests?.approved || 0}</span>
          </div>

          {requests && requests.pending > 0 && (
            <Button size="sm" className="w-full" onClick={() => navigate("/identity")}>
              Review Requests
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
