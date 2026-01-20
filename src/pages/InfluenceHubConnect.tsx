import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Facebook } from "lucide-react";
import { FaTiktok } from "react-icons/fa";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_username: string | null;
  is_active: boolean;
}

export default function InfluenceHubConnect() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("social_accounts")
        .select("id, platform, account_name, account_username, is_active")
        .eq("user_id", user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    toast({
      title: "Coming Soon",
      description: `${platform} connection will be available soon!`,
    });
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account disconnected",
      });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const platforms = [
    {
      name: "Instagram",
      icon: <Instagram className="h-8 w-8" />,
      color: "text-pink-600",
      description: "Connect your Instagram Business account",
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-8 w-8" />,
      color: "text-blue-600",
      description: "Connect your Facebook Pages",
    },
    {
      name: "TikTok",
      icon: <FaTiktok className="h-8 w-8" />,
      color: "text-foreground",
      description: "Connect your TikTok Business account",
    },
  ];

  const isConnected = (platform: string) => {
    return accounts.some(
      (acc) => acc.platform.toLowerCase() === platform.toLowerCase() && acc.is_active
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Connect Social Accounts</h1>
        <p className="text-muted-foreground">
          Link your social media accounts to start managing content
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const connected = isConnected(platform.name);
          const account = accounts.find(
            (acc) => acc.platform.toLowerCase() === platform.name.toLowerCase()
          );

          return (
            <Card key={platform.name}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={platform.color}>{platform.icon}</div>
                  <CardTitle>{platform.name}</CardTitle>
                </div>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {connected && account ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{account.account_name}</p>
                      {account.account_username && (
                        <p className="text-xs text-muted-foreground">
                          @{account.account_username}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(platform.name)}
                  >
                    Connect {platform.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Accounts List */}
      {accounts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Your Connected Accounts</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      {account.platform === "instagram" && (
                        <Instagram className="h-5 w-5 text-pink-600" />
                      )}
                      {account.platform === "facebook" && (
                        <Facebook className="h-5 w-5 text-blue-600" />
                      )}
                      {account.platform === "tiktok" && (
                        <FaTiktok className="h-5 w-5" />
                      )}
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        {account.account_username && (
                          <p className="text-sm text-muted-foreground">
                            @{account.account_username}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {account.is_active ? "Active" : "Inactive"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
