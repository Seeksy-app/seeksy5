import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export const EmailAccountManager = () => {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["email-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const result = await (supabase as any)
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (result.error) throw result.error;
      return result.data as any[];
    },
    enabled: !!user,
  });

  // Handle OAuth success/error redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success === "gmail_connected") {
      toast.success("Gmail account connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      // Clean up URL
      window.history.replaceState({}, "", "/email-settings");
    } else if (error) {
      if (error === "oauth_failed") {
        toast.error("Gmail connection was cancelled");
      } else if (error === "connection_failed") {
        toast.error("Failed to connect Gmail account");
      }
      // Clean up URL
      window.history.replaceState({}, "", "/email-settings");
    }
  }, [location.search, queryClient]);

  const connectGmail = async () => {
    console.log("Connect Gmail button clicked");
    console.log("User:", user);
    
    if (!user) {
      console.error("No user found");
      toast.error("Please log in to connect Gmail");
      return;
    }
    
    setConnecting(true);
    try {
      console.log("Calling gmail-auth edge function...");
      // Call edge function to get OAuth URL
      const response = await supabase.functions.invoke('gmail-auth');
      
      console.log("Full edge function response:", response);
      console.log("Response data type:", typeof response.data);
      console.log("Response data:", JSON.stringify(response.data));
      
      const { data, error } = response;
      
      if (error) throw error;
      if (!data?.authUrl) throw new Error('No auth URL returned');

      console.log("Redirecting to:", data.authUrl);
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Failed to initiate Gmail connection:", error);
      toast.error("Failed to connect Gmail: " + (error instanceof Error ? error.message : String(error)));
      setConnecting(false);
    }
  };

  const setDefaultAccount = useMutation({
    mutationFn: async (accountId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Unset all defaults first
      await (supabase as any)
        .from("email_accounts")
        .update({ is_default: false })
        .eq("user_id", user.id);
      
      // Set new default
      const result = await (supabase as any)
        .from("email_accounts")
        .update({ is_default: true })
        .eq("id", accountId);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast.success("Default email account updated");
    },
    onError: () => {
      toast.error("Failed to set default account");
    },
  });

  const disconnectAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const result = await (supabase as any)
        .from("email_accounts")
        .delete()
        .eq("id", accountId);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast.success("Email account disconnected");
    },
    onError: () => {
      toast.error("Failed to disconnect account");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Connected Email Accounts
        </CardTitle>
        <CardDescription>
          Manage Gmail accounts for sending campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        ) : accounts && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{account.email_address}</p>
                    {account.display_name && (
                      <p className="text-sm text-muted-foreground">{account.display_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.is_default && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  {!account.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDefaultAccount.mutate(account.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => disconnectAccount.mutate(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No email accounts connected yet
          </p>
        )}
        
        <Button
          onClick={connectGmail}
          disabled={connecting}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {connecting ? "Connecting..." : "Connect Gmail Account"}
        </Button>
      </CardContent>
    </Card>
  );
};
