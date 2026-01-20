import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User as UserIcon, Phone, Lock, Bell, FileText, Puzzle, Shield, Palette, Check, Eye, MessageSquare, Settings as SettingsIcon, Info, Save, X, Upload, UserCog } from "lucide-react";
import { DevOnboardingResetButton } from "@/components/dev/DevOnboardingResetButton";
import { NotificationPreferencesDialog } from "@/components/NotificationPreferencesDialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
    my_page_visited: false,
    username: null as string | null,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    task_reminder_enabled: false,
    task_reminder_frequency: "start_of_day",
    sms_notifications_enabled: false,
  });
  const [contentSettings, setContentSettings] = useState({
    auto_transcribe_enabled: true,
  });
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadUserData();
  }, []);

  // Handle scroll to field on hash navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }, 100);
    }
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/auth");
        return;
      }

      setUser(authUser);

      // Load profile data (account-level, not public profile)
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_full_name, account_avatar_url, bio, account_phone, username")
        .eq("id", authUser.id)
        .single();

      setFormData({
        full_name: profile?.account_full_name || "",
        phone: profile?.account_phone || "",
        email: authUser.email || "",
      });

      // Load notification preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setProfileData({
        avatar_url: profile?.account_avatar_url || null,
        my_page_visited: prefs?.my_page_visited || false,
        username: profile?.username || null,
      });

      if (prefs) {
        setNotificationPrefs({
          task_reminder_enabled: prefs.task_reminder_enabled || false,
          task_reminder_frequency: prefs.task_reminder_frequency || "start_of_day",
          sms_notifications_enabled: prefs.sms_notifications_enabled || false,
        });
        setContentSettings({
          auto_transcribe_enabled: prefs.auto_transcribe_enabled !== false,
        });
        
        // Load theme preference but don't override it immediately
        // The ThemeToggle component will handle the initial theme setting
      }

      // Store initial state for comparison
      initialDataRef.current = {
        formData: {
          full_name: profile?.account_full_name || "",
          phone: profile?.account_phone || "",
          email: authUser.email || "",
        },
        profileData: {
          avatar_url: profile?.account_avatar_url || null,
        },
        notificationPrefs: {
          task_reminder_enabled: prefs?.task_reminder_enabled || false,
          task_reminder_frequency: prefs?.task_reminder_frequency || "start_of_day",
          sms_notifications_enabled: prefs?.sms_notifications_enabled || false,
        },
        contentSettings: {
          auto_transcribe_enabled: prefs?.auto_transcribe_enabled !== false,
        },
      };

      // Check admin status
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      setIsAdmin(roles?.some(r => r.role === "admin" || r.role === "super_admin") || false);
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
      // Generate username from email if not set
      let usernameToUse = profileData.username;
      if (!usernameToUse && user.email) {
        const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        usernameToUse = baseUsername;
        
        // Check if username exists and make it unique
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

      // Update or insert account profile (not public profile)
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

      // Update or insert notification preferences
      const { error: prefsError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          task_reminder_enabled: notificationPrefs.task_reminder_enabled,
          task_reminder_frequency: notificationPrefs.task_reminder_frequency,
          sms_notifications_enabled: notificationPrefs.sms_notifications_enabled,
          auto_transcribe_enabled: contentSettings.auto_transcribe_enabled,
        }, {
          onConflict: 'user_id'
        });

      if (prefsError) throw prefsError;

      // Request notification permission if enabling reminders
      if (notificationPrefs.task_reminder_enabled && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      // Show brief "saved" indicator
      setJustSaved(true);
      setHasUnsavedChanges(false);
      // Update initial data ref after successful save
      initialDataRef.current = {
        formData: { ...formData },
        profileData: { avatar_url: profileData.avatar_url },
        notificationPrefs: { ...notificationPrefs },
        contentSettings: { ...contentSettings },
      };
      setTimeout(() => setJustSaved(false), 2500);

      if (showToast) {
        const encouragingMessages = [
          { title: "Settings saved! ✨", description: "Looking good! Your profile is getting better." },
          { title: "Nice work! 🎯", description: "Your settings have been updated successfully." },
          { title: "All set! 🚀", description: "Changes saved and ready to go." },
          { title: "Perfect! 💫", description: "Your account is now updated." },
          { title: "Great! 🌟", description: "Settings saved successfully." },
        ];
        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        toast({
          title: randomMessage.title,
          description: randomMessage.description,
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

  // Auto-save with debounce - ensure we capture latest state
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(false);
    }, 1000); // Save 1 second after user stops typing/changing
  }, [formData, profileData, notificationPrefs]); // Include deps so closure captures current state

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (!initialDataRef.current) return;
    
    const hasChanges = 
      JSON.stringify(formData) !== JSON.stringify(initialDataRef.current.formData) ||
      profileData.avatar_url !== initialDataRef.current.profileData.avatar_url ||
      JSON.stringify(notificationPrefs) !== JSON.stringify(initialDataRef.current.notificationPrefs) ||
      JSON.stringify(contentSettings) !== JSON.stringify(initialDataRef.current.contentSettings);
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, profileData.avatar_url, notificationPrefs]);

  // Warn before leaving with unsaved changes
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

          <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account information and security</p>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && !saving && !justSaved && (
                <Button 
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  size="lg"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              )}
              {(saving || justSaved) && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-right-5 duration-300">
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm font-medium text-foreground">Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-500 animate-in zoom-in duration-200" />
                        <div className="absolute inset-0 animate-ping opacity-75">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-500">Saved successfully ✓</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
              <AlertDialogDescription>
                You've made changes to your settings. Would you like to save them before leaving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <Button 
                variant="outline" 
                onClick={() => {
                  setHasUnsavedChanges(false);
                  setShowUnsavedDialog(false);
                }}
              >
                Discard Changes
              </Button>
              <Button 
                onClick={() => {
                  handleSave(true);
                  setShowUnsavedDialog(false);
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-6">
          {/* Account Information with Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
              {profileData.username && profileData.my_page_visited && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Your public profile:</span>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <a href={`/${profileData.username}`} target="_blank" rel="noopener noreferrer">
                      /{profileData.username}
                      <Eye className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 items-start">
                {/* Left: Form Fields */}
                <div className="flex-1 max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => {
                          setFormData({ ...formData, full_name: e.target.value });
                          debouncedSave();
                        }}
                        className="pl-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="pl-10 bg-muted cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update it.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 0) {
                            if (value.length <= 3) {
                              value = `(${value}`;
                            } else if (value.length <= 6) {
                              value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                            } else {
                              value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                            }
                          }
                          setFormData({ ...formData, phone: value });
                          debouncedSave();
                        }}
                        className="pl-10"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Profile Photo */}
                <div id="avatar" className="flex-shrink-0">
                  <div className="space-y-3">
                    <Label className="text-sm">Profile Photo</Label>
                    {profileData.avatar_url ? (
                      <div className="relative">
                        <img
                          src={profileData.avatar_url}
                          alt="Profile"
                          className="w-40 h-40 object-cover rounded-lg border-2 border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                          onClick={async () => {
                            setProfileData(prev => ({ ...prev, avatar_url: null }));
                            if (user) {
                              try {
                                let usernameToUse = profileData.username;
                                if (!usernameToUse && user.email) {
                                  usernameToUse = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                                }
                                
                                const { error } = await supabase
                                  .from("profiles")
                                  .upsert({ 
                                    id: user.id,
                                    username: usernameToUse,
                                    account_avatar_url: null 
                                  } as any, {
                                    onConflict: 'id'
                                  });
                                
                                if (error) throw error;
                                
                                setJustSaved(true);
                                setTimeout(() => setJustSaved(false), 2500);
                                
                                toast({
                                  title: "Photo removed",
                                  description: "Profile photo has been removed.",
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Error removing photo",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (!e.target.files || !e.target.files[0]) return;
                        const file = e.target.files[0];
                        
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const { data: { user: authUser } } = await supabase.auth.getUser();
                          if (!authUser) throw new Error("You must be logged in");
                          
                          const filePath = `${authUser.id}/${fileName}`;
                          const { error: uploadError } = await supabase.storage
                            .from('avatars')
                            .upload(filePath, file);
                          
                          if (uploadError) throw uploadError;
                          
                          const { data } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(filePath);
                          
                          setProfileData(prev => ({ ...prev, avatar_url: data.publicUrl }));
                          
                          let usernameToUse = profileData.username;
                          if (!usernameToUse && authUser.email) {
                            usernameToUse = authUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                          }
                          
                          const { error } = await supabase
                            .from("profiles")
                            .upsert({ 
                              id: authUser.id,
                              username: usernameToUse,
                              account_avatar_url: data.publicUrl 
                            } as any, {
                              onConflict: 'id'
                            });
                          
                          if (error) throw error;
                          
                          setJustSaved(true);
                          setTimeout(() => setJustSaved(false), 2500);
                          
                          toast({
                            title: "Profile photo updated! 📸",
                            description: "Your new photo looks great!",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Upload failed",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      className="hidden"
                      id="avatar-upload-inline"
                    />
                    <label htmlFor="avatar-upload-inline">
                      <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                        <span className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {profileData.avatar_url ? 'Change' : 'Upload'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                Changes are saved automatically. Your theme preference is instantly synced.
              </p>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your display theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Theme</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose between Light, Dark, or Auto (follows system)
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Changes are saved automatically
              </p>
            </CardContent>
          </Card>

          {/* Content & Automation */}
          <Card>
            <CardHeader>
              <CardTitle>Content & Automation</CardTitle>
              <CardDescription>Control how Seeksy handles your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Auto-transcribe my Studio recordings</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When enabled, Seeksy will automatically generate transcripts from finished recordings and save them to your Transcript Library
                  </p>
                </div>
                <Switch
                  checked={contentSettings.auto_transcribe_enabled}
                  onCheckedChange={(checked) => {
                    setContentSettings({ ...contentSettings, auto_transcribe_enabled: checked });
                    debouncedSave();
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">Task Reminders</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about tasks from your Task Manager
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.task_reminder_enabled}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs({ ...notificationPrefs, task_reminder_enabled: checked });
                      debouncedSave();
                    }}
                  />
                </div>

                {notificationPrefs.task_reminder_enabled && (
                  <div className="space-y-2 pt-2 pl-6">
                    <Label htmlFor="frequency">Reminder Frequency</Label>
                    <Select
                      value={notificationPrefs.task_reminder_frequency}
                      onValueChange={(value) => {
                        setNotificationPrefs({ ...notificationPrefs, task_reminder_frequency: value });
                        debouncedSave();
                      }}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="start_of_day">Start of Day (9 AM)</SelectItem>
                        <SelectItem value="end_of_day">End of Day (5 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      You'll be notified about tasks in backlog, todo, or in progress status
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* SMS Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">SMS Notifications</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via text message
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.sms_notifications_enabled}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs({ ...notificationPrefs, sms_notifications_enabled: checked });
                      debouncedSave();
                    }}
                  />
                </div>

                {notificationPrefs.sms_notifications_enabled && (
                  <div className="space-y-3 pt-2 pl-6">
                    <p className="text-sm text-muted-foreground">
                      SMS notifications are enabled. Customize which types of notifications you receive.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreferencesDialogOpen(true)}
                      className="w-full"
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Customize SMS Preferences
                    </Button>
                    {!formData.phone && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">
                          <strong>Phone number required:</strong> Add your phone number above to receive SMS notifications.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <NotificationPreferencesDialog
            open={preferencesDialogOpen}
            onOpenChange={setPreferencesDialogOpen}
            userId={user?.id || ""}
          />

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Password</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reset your password via email
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Reset Password</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset your password?</AlertDialogTitle>
                      <AlertDialogDescription>
                        We'll send a password reset link to <strong>{formData.email}</strong>. 
                        Click the link in the email to set a new password.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePasswordReset} disabled={sendingReset}>
                        {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions & Billing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscriptions & Billing</CardTitle>
                  <CardDescription>Manage your subscription and payment methods</CardDescription>
                </div>
                <Button onClick={() => navigate("/subscription")}>
                  Manage Subscription
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Credits & Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Credits & Usage</CardTitle>
                  <CardDescription>View credit costs and manage your usage</CardDescription>
                </div>
                <Button onClick={() => navigate("/credit-info")} variant="outline">
                  <Info className="h-4 w-4 mr-2" />
                  View Credit Costs
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Modules & Add-ons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modules & Add-ons</CardTitle>
                  <CardDescription>Extend Seeksy with premium modules</CardDescription>
                </div>
                <Button onClick={() => navigate("/modules")}>
                  <Puzzle className="h-4 w-4 mr-2" />
                  Browse Modules
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Admin Profile (Admin Only) */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Admin Profile</CardTitle>
                    <CardDescription>Configure your admin identity separate from your personal profile</CardDescription>
                  </div>
                  <Button onClick={() => navigate("/admin/profile-settings")}>
                    <UserCog className="h-4 w-4 mr-2" />
                    Manage Admin Profile
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Legal Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Legal & Compliance</CardTitle>
              <CardDescription>View and manage legal pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/security")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Security & Data Protection
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/privacy")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/terms")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/cookies")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Cookie Policy
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/legal")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Legal Pages
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account ID (for support) */}
          <Card>
            <CardHeader>
              <CardTitle>Account ID</CardTitle>
              <CardDescription>Use this when contacting support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <code className="text-xs bg-muted px-3 py-2 rounded block font-mono">
                {user.id}
              </code>
              
              {/* Dev-only reset button */}
              <DevOnboardingResetButton />
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Platform health, security, and technical architecture</CardDescription>
                </div>
                <Button onClick={() => navigate("/system-status")}>
                  View Full Status
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Architecture button removed per user request */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
