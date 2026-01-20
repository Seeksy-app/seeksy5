import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User as UserIcon, Phone, Lock, Check, Save, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BoardSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialDataRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [profileData, setProfileData] = useState({
    avatar_url: null as string | null,
    username: null as string | null,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/auth");
        return;
      }

      setUser(authUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_full_name, account_avatar_url, account_phone, username")
        .eq("id", authUser.id)
        .single();

      setFormData({
        full_name: profile?.account_full_name || "",
        phone: profile?.account_phone || "",
        email: authUser.email || "",
      });

      setProfileData({
        avatar_url: profile?.account_avatar_url || null,
        username: profile?.username || null,
      });

      initialDataRef.current = {
        formData: {
          full_name: profile?.account_full_name || "",
          phone: profile?.account_phone || "",
          email: authUser.email || "",
        },
        profileData: {
          avatar_url: profile?.account_avatar_url || null,
        },
      };
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (showToast = false) => {
    if (!user) return;

    setSaving(true);
    try {
      let usernameToUse = profileData.username;
      if (!usernameToUse && user.email) {
        const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        usernameToUse = baseUsername;
        
        let counter = 0;
        let isUnique = false;
        while (!isUnique && counter < 100) {
          const testUsername = counter === 0 ? usernameToUse : `${usernameToUse}${counter}`;
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", testUsername)
            .single();
          
          if (!data) {
            usernameToUse = testUsername;
            isUnique = true;
          } else {
            counter++;
          }
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id,
          username: usernameToUse,
          account_full_name: formData.full_name,
          account_avatar_url: profileData.avatar_url,
          account_phone: formData.phone
        } as any, {
          onConflict: 'id'
        });

      if (profileError) throw profileError;

      setJustSaved(true);
      setHasUnsavedChanges(false);
      initialDataRef.current = {
        formData: { ...formData },
        profileData: { avatar_url: profileData.avatar_url },
      };
      setTimeout(() => setJustSaved(false), 2500);

      if (showToast) {
        toast({
          title: "Settings saved! ✨",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(false);
    }, 1000);
  }, [formData, profileData]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!initialDataRef.current) return;
    
    const hasChanges = 
      JSON.stringify(formData) !== JSON.stringify(initialDataRef.current.formData) ||
      profileData.avatar_url !== initialDataRef.current.profileData.avatar_url;
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, profileData.avatar_url]);

  useBeforeUnload(
    useCallback((e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return (e.returnValue = "You have unsaved changes. Are you sure you want to leave?");
      }
    }, [hasUnsavedChanges])
  );

  const handlePasswordReset = async () => {
    if (!formData.email) return;

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending reset email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account information and security</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && !saving && !justSaved && (
            <Button 
              onClick={() => handleSave(true)}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
          {(saving || justSaved) && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-muted/50 border border-border">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Saved ✓</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => { setHasUnsavedChanges(false); setShowUnsavedDialog(false); }}>
              Discard
            </Button>
            <Button onClick={() => { handleSave(true); setShowUnsavedDialog(false); }}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              <ImageUpload
                currentImage={profileData.avatar_url || undefined}
                onImageUploaded={(url) => {
                  setProfileData({ ...profileData, avatar_url: url });
                  debouncedSave();
                }}
                bucket="avatars"
                variant="avatar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  debouncedSave();
                }}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    debouncedSave();
                  }}
                  className="pl-10"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security & Preferences
            </CardTitle>
            <CardDescription>Manage your password and display preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">
                Send a password reset link to your email address
              </p>
              <Button
                variant="outline"
                onClick={handlePasswordReset}
                disabled={sendingReset}
              >
                {sendingReset ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Email
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
