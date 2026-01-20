import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, RefreshCw, Eye, EyeOff, History, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VaultKey {
  id: string;
  key_name: string;
  key_description: string;
  is_configured: boolean;
  last_updated_at: string;
  is_required: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  key_name?: string;
  metadata: any;
  created_at: string;
}

export default function KeysVault() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [keys, setKeys] = useState<VaultKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasCodeSetup, setHasCodeSetup] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    checkCodeSetup();
  }, []);

  const checkCodeSetup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('vault_access_codes')
      .select('id')
      .eq('user_id', user.id)
      .single();

    setHasCodeSetup(!!data);
  };

  const handleSetupCode = async () => {
    if (newCode !== confirmCode) {
      toast({
        title: "Error",
        description: "Codes do not match",
        variant: "destructive",
      });
      return;
    }

    if (newCode.length < 6) {
      toast({
        title: "Error",
        description: "Code must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.functions.invoke('keys-vault', {
      body: { action: 'setup-code', newCode }
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Access code created successfully",
    });

    setShowSetupDialog(false);
    setHasCodeSetup(true);
    setNewCode("");
    setConfirmCode("");
  };

  const handleRequestRecovery = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('keys-vault', {
      body: { action: 'request-recovery' }
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setRecoveryCode(data.recoveryCode);
    toast({
      title: "Recovery Code Generated",
      description: "Save this code securely. It will only be shown once.",
    });
  };

  const handleUnlock = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('keys-vault', {
      body: { action: 'get-keys', code: accessCode }
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Access Denied",
        description: "Invalid access code",
        variant: "destructive",
      });
      return;
    }

    setKeys(data.keys);
    
    // Load audit logs
    const auditResponse = await supabase.functions.invoke('keys-vault', {
      body: { action: 'get-audit-log', code: accessCode }
    });

    setLoading(false);

    if (!auditResponse.error) {
      setAuditLogs(auditResponse.data.logs);
    }

    setIsUnlocked(true);
    toast({
      title: "Vault Unlocked",
      description: "Access granted to Keys Vault",
    });
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Keys Vault</CardTitle>
            <CardDescription>
              Enter your access code to unlock the vault
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Access Code</Label>
              <div className="relative">
                <Input
                  id="access-code"
                  type={showCode ? "text" : "password"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter your access code"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleUnlock}
              className="w-full"
              disabled={loading || !accessCode}
            >
              {loading ? "Verifying..." : "Unlock Vault"}
            </Button>

            {!hasCodeSetup ? (
              <Button
                onClick={() => setShowSetupDialog(true)}
                variant="outline"
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                Setup Access Code
              </Button>
            ) : (
              <Button
                onClick={() => setShowRecoveryDialog(true)}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Forgot Code? Generate Recovery Code
              </Button>
            )}

            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              className="w-full"
            >
              Back to Admin
            </Button>
          </CardContent>
        </Card>

        {/* Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setup Access Code</DialogTitle>
              <DialogDescription>
                Create a secure code to protect your Keys Vault
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-code">New Access Code</Label>
                <Input
                  id="new-code"
                  type="password"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-code">Confirm Access Code</Label>
                <Input
                  id="confirm-code"
                  type="password"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="Re-enter code"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetupCode} disabled={loading}>
                {loading ? "Creating..." : "Create Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recovery Dialog */}
        <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Recovery Code</DialogTitle>
              <DialogDescription>
                This will create a new access code. Save it securely.
              </DialogDescription>
            </DialogHeader>
            {recoveryCode ? (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertTriangle className="w-5 h-5" />
                    Important: Save This Code
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This code will only be shown once. Write it down in a secure location.
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Your New Access Code</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">{recoveryCode}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click below to generate a new access code. Your old code will no longer work.
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRecoveryDialog(false);
                  setRecoveryCode("");
                }}
              >
                {recoveryCode ? "I've Saved It" : "Cancel"}
              </Button>
              {!recoveryCode && (
                <Button onClick={handleRequestRecovery} disabled={loading}>
                  {loading ? "Generating..." : "Generate New Code"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Keys Vault
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys and secrets securely
          </p>
        </div>
        <Button onClick={() => {
          setIsUnlocked(false);
          setAccessCode("");
        }} variant="outline">
          Lock Vault
        </Button>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="w-4 h-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{key.key_name}</CardTitle>
                      <CardDescription>{key.key_description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.is_required && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                    <Badge variant={key.is_configured ? "default" : "secondary"}>
                      {key.is_configured ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {key.last_updated_at
                      ? `Last updated: ${new Date(key.last_updated_at).toLocaleDateString()}`
                      : "Never configured"}
                  </div>
                  <Button size="sm" variant="outline">
                    Update Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Last 100 vault access events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      {log.key_name && (
                        <p className="text-sm text-muted-foreground">{log.key_name}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}