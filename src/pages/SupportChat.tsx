import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";

interface AccountHolder {
  id: string;
  account_full_name: string;
  account_avatar_url: string;
  account_type: string;
}

export default function SupportChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accountHolders, setAccountHolders] = useState<AccountHolder[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", session.user.id)
      .single();

    const userIsAdmin = profile?.account_type === "admin";
    setIsAdmin(userIsAdmin);

    if (userIsAdmin) {
      loadAccountHolders();
    }

    setLoading(false);
  };

  const loadAccountHolders = async () => {
    const { data: teams } = await supabase
      .from("teams")
      .select(`
        owner_id,
        profiles:owner_id (
          id,
          account_full_name,
          account_avatar_url,
          account_type
        )
      `)
      .neq("profiles.account_type", "admin");

    if (teams) {
      const holders = teams
        .map((t: any) => t.profiles)
        .filter(Boolean);
      setAccountHolders(holders);
    }
  };

  const startSupportChat = (accountHolderId: string) => {
    // Navigate to team chat with support context
    navigate(`/team-chat?support=true&user=${accountHolderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Customer Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Need help? Contact our support team.
              </p>
              <Button onClick={() => navigate("/team-chat?support=true")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Support Chat</h1>
          <p className="text-muted-foreground">
            Connect with account holders for customer support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountHolders.map((holder) => (
            <Card key={holder.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={holder.account_avatar_url}
                      alt={holder.account_full_name}
                    />
                    <AvatarFallback>
                      {holder.account_full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{holder.account_full_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {holder.account_type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => startSupportChat(holder.id)}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
