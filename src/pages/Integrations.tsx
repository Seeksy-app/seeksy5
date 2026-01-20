import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Trophy, Clapperboard, Landmark, User as UserIcon, Building2, Instagram, Facebook, Linkedin, Twitter, Youtube, Music, CheckSquare, DollarSign, TrendingUp, CreditCard, Wallet, Info, Edit2, MessageSquare, FileText, Rss, CalendarDays, ClipboardList, BarChart3, QrCode, Mail, Smartphone, Search, Mic, Sparkles, Target } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IntegrationCard } from "@/components/IntegrationCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

type ModuleStatus = {
  [key: string]: boolean;
};

const Integrations = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modules, setModules] = useState<ModuleStatus>({
    my_page: false,
    ai_assistant: false,
    meetings: false,
    contacts: false,
    podcasts: false,
    awards: false,
    media: false,
    civic: false,
    influencer: false,
    agency: false,
    project_management: false,
    monetization: false,
    team_chat: false,
    blog: false,
    advertiser: false,
    events: false,
    signup_sheets: false,
    polls: false,
    qr_codes: false,
    marketing: false,
    sms: false,
    lead_pixel: false,
    newsletter: false,
    forms: false,
  });
  const [socialConnections, setSocialConnections] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string; description: string; tooltip: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [moduleToDeactivate, setModuleToDeactivate] = useState<keyof ModuleStatus | null>(null);
  const [dependencyWarningOpen, setDependencyWarningOpen] = useState(false);
  const [dependencyMessage, setDependencyMessage] = useState("");
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [dismissedDependencies, setDismissedDependencies] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrationMetadata } = useQuery({
    queryKey: ["integration-metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_metadata")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: audioDescriptions } = useQuery({
    queryKey: ["app-audio-descriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_audio_descriptions")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const getAudioUrl = (appId: string) => {
    // Convert underscores to hyphens and handle special cases
    const dbAppId = appId.replace(/_/g, '-');
    return audioDescriptions?.find(desc => desc.app_id === dbAppId)?.audio_url;
  };

  const getAvatarUrl = (appId: string) => {
    // Convert underscores to hyphens and handle special cases
    const dbAppId = appId.replace(/_/g, '-');
    return audioDescriptions?.find(desc => desc.app_id === dbAppId)?.avatar_url;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadModulesAndConnections(session.user.id);
      await checkAdminStatus(session.user.id);
      await loadDismissedDependencies(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const loadDismissedDependencies = async (userId: string) => {
    const { data } = await supabase
      .from("user_preferences")
      .select("dismissed_dependency_warnings")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data?.dismissed_dependency_warnings) {
      setDismissedDependencies(data.dismissed_dependency_warnings as string[]);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["super_admin", "admin"]);
    
    setIsAdmin((data?.length || 0) > 0);
  };

  const loadModulesAndConnections = async (userId: string) => {
    try {
      // Load module preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (prefs) {
        setModules({
          my_page: (prefs as any).my_page_enabled === true,
          ai_assistant: (prefs as any).ai_assistant_enabled === true,
          meetings: (prefs as any).meetings_enabled === true,
          contacts: (prefs as any).contacts_enabled === true,
          podcasts: (prefs as any).podcasts_enabled === true,
          awards: prefs.module_awards_enabled || false,
          media: prefs.module_media_enabled || false,
          civic: prefs.module_civic_enabled || false,
          influencer: prefs.module_influencer_enabled || false,
          agency: prefs.module_agency_enabled || false,
          project_management: prefs.module_project_management_enabled || false,
          monetization: prefs.module_monetization_enabled || false,
          team_chat: (prefs as any).module_team_chat_enabled || false,
          blog: (prefs as any).module_blog_enabled || false,
          advertiser: (prefs as any).module_advertiser_enabled || false,
          events: (prefs as any).module_events_enabled || false,
          signup_sheets: (prefs as any).module_signup_sheets_enabled || false,
          polls: (prefs as any).module_polls_enabled || false,
          qr_codes: (prefs as any).module_qr_codes_enabled || false,
          marketing: (prefs as any).module_marketing_enabled || false,
          sms: (prefs as any).module_sms_enabled || false,
          newsletter: (prefs as any).module_newsletter_enabled || false,
          forms: (prefs as any).module_forms_enabled || false,
        });
      }

      // Load social media connections
      const { data: connections } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setSocialConnections(connections || []);
    } catch (error: any) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      let endpoint = '';
      
      switch(platform.toLowerCase()) {
        case 'google calendar':
          endpoint = 'google-calendar-auth';
          break;
        case 'google email':
        case 'gmail':
          endpoint = 'gmail-auth';
          break;
        case 'zoom':
          endpoint = 'zoom-auth';
          break;
        default:
          toast({
            title: "Coming Soon",
            description: `Connect your ${platform} account to unlock more features.`,
          });
          return;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to initiate connection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleModule = async (moduleName: keyof ModuleStatus) => {
    if (!user) return;

    const newValue = !modules[moduleName];
    
    // Check dependencies when DEACTIVATING
    if (!newValue) {
      const dependencies = checkDependencies(moduleName);
      if (dependencies.length > 0 && !dismissedDependencies.includes(String(moduleName))) {
        const dependentNames = dependencies.map(d => {
          return d.replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }).join(', ');
        
        setDependencyMessage(`This Seekie is attached to ${dependentNames}. You will not lose your data and can reactivate it any time.`);
        setModuleToDeactivate(moduleName);
        setDependencyWarningOpen(true);
        return;
      }
      
      // Show standard deactivate confirmation
      setModuleToDeactivate(moduleName);
      setDeactivateDialogOpen(true);
      return;
    }
    
    // Special handling: PM requires Contacts (CRM) when ACTIVATING
    if (moduleName === 'project_management' && newValue) {
      if (!modules.contacts) {
        const confirmPM = window.confirm(
          "Project Management requires Contacts to manage clients.\n\n" +
          "Both Project Management and Contacts will be activated.\n\n" +
          "Click OK to continue."
        );
        
        if (!confirmPM) {
          return;
        }
        
        await performToggle('contacts', true);
        await performToggle('project_management', true);
        
        toast({
          title: "✅ Project Management + Contacts Activated",
          description: "Both apps are now active and available in your sidebar.",
          duration: 5000,
        });
        return;
      }
    }
    
    await performToggle(moduleName, newValue);
  };

  const checkDependencies = (moduleName: keyof ModuleStatus): string[] => {
    const dependencies: Record<string, string[]> = {
      'contacts': ['project_management'],
      'marketing': [],
    };
    
    const dependents: string[] = [];
    const moduleNameStr = String(moduleName);
    
    for (const [dependent, requirements] of Object.entries(dependencies)) {
      if (requirements.includes(moduleNameStr) && modules[dependent as keyof ModuleStatus]) {
        dependents.push(dependent);
      }
    }
    
    return dependents;
  };

  const performToggle = async (moduleName: keyof ModuleStatus, newValue: boolean) => {
    if (!user) return;

    console.log(`Toggling ${moduleName} to ${newValue}`);
    setModules({ ...modules, [moduleName]: newValue });

    try {
      // Core apps use different column names (no "module_" prefix)
      const coreApps = ['my_page', 'ai_assistant', 'meetings', 'contacts', 'podcasts'];
      const moduleNameStr = String(moduleName);
      const columnName = coreApps.includes(moduleNameStr) 
        ? `${moduleNameStr}_enabled`
        : `module_${moduleNameStr}_enabled`;

      // Fetch current pinned_modules
      const { data: currentPrefs } = await supabase
        .from("user_preferences")
        .select("pinned_modules")
        .eq("user_id", user.id)
        .single();

      const currentPinned = Array.isArray(currentPrefs?.pinned_modules) 
        ? currentPrefs.pinned_modules 
        : [];

      console.log("Current pinned before toggle:", currentPinned);

      // Prepare update data
      let updateData: any = {
        user_id: user.id,
        [columnName]: newValue,
      };

      if (newValue) {
        // If enabling, auto-pin to sidebar
        if (!currentPinned.includes(moduleNameStr)) {
          updateData.pinned_modules = [...currentPinned, moduleNameStr];
          console.log("Adding to pinned:", updateData.pinned_modules);
        } else {
          updateData.pinned_modules = currentPinned;
        }
      } else {
        // If disabling, remove from pinned
        updateData.pinned_modules = currentPinned.filter((m: string) => m !== moduleNameStr);
        console.log("Removing from pinned:", updateData.pinned_modules);
      }

      console.log("Upserting preferences:", updateData);

      const { error } = await supabase
        .from("user_preferences")
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: newValue ? "Seeky Activated" : "Seeky Deactivated",
        description: `${moduleNameStr.charAt(0).toUpperCase() + moduleNameStr.slice(1).replace(/_/g, ' ')} has been ${newValue ? 'activated' : 'deactivated'}.`,
      });
      
      // Trigger sidebar refresh with delay to ensure DB update propagates
      setTimeout(() => {
        console.log("Dispatching pinnedModulesChanged event");
        window.dispatchEvent(new Event("pinnedModulesChanged"));
      }, 100);
    } catch (error: any) {
      toast({
        title: "Error updating Seeky",
        description: error.message,
        variant: "destructive",
      });
      // Revert on error
      setModules({ ...modules, [moduleName]: !newValue });
    }
  };

  const handleConfirmDeactivate = async () => {
    if (moduleToDeactivate) {
      await performToggle(moduleToDeactivate, false);
      setDeactivateDialogOpen(false);
      setDependencyWarningOpen(false);
      setModuleToDeactivate(null);
      setDontShowAgain(false);
    }
  };

  const handleConfirmDependencyDeactivate = async () => {
    if (moduleToDeactivate && user) {
      // Save "don't show again" preference if checked
      if (dontShowAgain) {
        const updatedDismissed = [...dismissedDependencies, String(moduleToDeactivate)];
        setDismissedDependencies(updatedDismissed);
        
        await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            dismissed_dependency_warnings: updatedDismissed
          }, {
            onConflict: 'user_id'
          });
      }
      
      await performToggle(moduleToDeactivate, false);
      setDependencyWarningOpen(false);
      setModuleToDeactivate(null);
      setDontShowAgain(false);
    }
  };

  const handleDisconnectSocial = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("social_media_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      setSocialConnections(socialConnections.filter(c => c.id !== accountId));
      
      toast({
        title: "Account disconnected",
        description: "Social media account has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Error disconnecting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditMetadata = (moduleId: string) => {
    const metadata = integrationMetadata?.find(m => m.id === moduleId);
    
    // If metadata exists, use it; otherwise create default values
    const defaultMetadata = {
      id: moduleId,
      title: moduleId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: `Description for ${moduleId.replace(/_/g, ' ')}`,
      tooltip: `Tooltip for ${moduleId.replace(/_/g, ' ')}`,
    };
    
    const editData = metadata ? {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      tooltip: metadata.tooltip_text || "",
    } : defaultMetadata;
    
    setEditingModule(editData);
    setEditDialogOpen(true);
  };

  const handleSaveMetadata = async () => {
    if (!editingModule) return;

    try {
      const { error } = await supabase
        .from("integration_metadata")
        .upsert({
          id: editingModule.id,
          title: editingModule.title,
          description: editingModule.description,
          tooltip_text: editingModule.tooltip,
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["integration-metadata"] });
      
      toast({
        title: "Metadata updated",
        description: "Integration information has been updated.",
      });
      
      setEditDialogOpen(false);
      setEditingModule(null);
    } catch (error: any) {
      toast({
        title: "Error updating metadata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getMetadata = (moduleId: string) => {
    return integrationMetadata?.find(m => m.id === moduleId);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: any } = {
      instagram: Instagram,
      facebook: Facebook,
      linkedin: Linkedin,
      twitter: Twitter,
      youtube: Youtube,
      tiktok: TrendingUp,
    };
    return icons[platform.toLowerCase()] || UserIcon;
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      instagram: "from-pink-500 to-purple-600",
      facebook: "from-blue-600 to-blue-700",
      linkedin: "from-blue-500 to-blue-600",
      twitter: "from-blue-400 to-blue-500",
      youtube: "from-red-500 to-red-600",
      tiktok: "from-black to-gray-800",
    };
    return colors[platform.toLowerCase()] || "from-gray-500 to-gray-600";
  };

  const matchesSearch = (title: string, description: string) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupedConnections = socialConnections.reduce((acc: any, conn: any) => {
    if (!acc[conn.platform]) {
      acc[conn.platform] = [];
    }
    acc[conn.platform].push(conn);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Seekies</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Seekies</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Connect your tools and explore available Seekies
          </p>
          
          {/* Category Navigation */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('core-apps')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Core Apps
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('engagement')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Engagement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Content
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('business')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Business
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('social')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Social Media
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Services
            </Button>
          </div>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Seekies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-12">
          {/* Core Apps Section */}
          <section id="core-apps">
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              CORE APPS
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchesSearch('My Page', 'Create your shareable digital identity page with social links, videos, bookings, and more. Perfect for creators and influencers.') && (
                <IntegrationCard
                  id="my_page"
                  icon={UserIcon}
                  iconGradient="from-teal-500 to-cyan-600"
                  title="My Page"
                  description="Create your shareable digital identity page with social links, videos, bookings, and more. Perfect for creators and influencers."
                  tooltip="Enable to create your customizable public profile page"
                  isActive={modules.my_page}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('my_page')}
                  onEdit={() => handleEditMetadata('my_page')}
                  audioUrl={getAudioUrl('my-page')}
                  avatarUrl={getAvatarUrl('my-page')}
                />
              )}


              {matchesSearch('Meetings', 'Schedule and manage meetings with booking links, calendar integrations, and automated reminders.') && (
                <IntegrationCard
                  id="meetings"
                  icon={CalendarDays}
                  iconGradient="from-blue-500 to-indigo-600"
                  title="Meetings"
                  description="Schedule and manage meetings with booking links, calendar integrations, and automated reminders."
                  tooltip="Enable to schedule and manage meetings"
                  isActive={modules.meetings}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('meetings')}
                  onEdit={() => handleEditMetadata('meetings')}
                  audioUrl={getAudioUrl('meetings')}
                  avatarUrl={getAvatarUrl('meetings')}
                />
              )}

              {matchesSearch('Contacts & Email', 'Manage contacts, track interactions, view email history, and organize your network. Complete CRM with email integration.') && (
                <IntegrationCard
                  id="contacts"
                  icon={UserIcon}
                  iconGradient="from-green-500 to-emerald-600"
                  title="Contacts & Email"
                  description="Manage contacts, track interactions, view email history, and organize your network. Complete CRM with email integration."
                  tooltip="Enable contact management, CRM features, and email history"
                  isActive={modules.contacts}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('contacts')}
                  onEdit={() => handleEditMetadata('contacts')}
                  audioUrl={getAudioUrl('contacts')}
                  avatarUrl={getAvatarUrl('contacts')}
                />
              )}

              {matchesSearch('Podcasts', 'Create, publish, and distribute podcasts. Manage episodes, RSS feeds, and podcast analytics.') && (
                <IntegrationCard
                  id="podcasts"
                  icon={Mic}
                  iconGradient="from-amber-500 to-orange-600"
                  title="Podcasts"
                  description="Create, publish, and distribute podcasts. Manage episodes, RSS feeds, and podcast analytics."
                  tooltip="Enable podcast creation and distribution"
                  isActive={modules.podcasts}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('podcasts')}
                  onEdit={() => handleEditMetadata('podcasts')}
                  audioUrl={getAudioUrl('podcasts')}
                  avatarUrl={getAvatarUrl('podcasts')}
                />
              )}

              {matchesSearch('Awards', 'Create and manage award programs with voting, sponsorships, and live ceremony streaming.') && (
                <IntegrationCard
                  id="awards"
                  icon={Trophy}
                  iconGradient="from-yellow-500 to-orange-600"
                  title={getMetadata('awards')?.title || 'Awards'}
                  description={getMetadata('awards')?.description || 'Create and manage award programs with voting, sponsorships, and live ceremony streaming.'}
                  tooltip={getMetadata('awards')?.tooltip_text}
                  isActive={modules.awards}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('awards')}
                  onEdit={() => handleEditMetadata('awards')}
                />
              )}
              
              {matchesSearch('Media', 'Complete content creation suite with podcasts, blogs, live studio, and media library with AI-powered editing.') && (
                <IntegrationCard
                  id="media"
                  icon={Clapperboard}
                  iconGradient="from-purple-600 to-indigo-700"
                  title={getMetadata('media')?.title || 'Media'}
                  description={getMetadata('media')?.description || 'Complete content creation suite with podcasts, blogs, live studio, and media library with AI-powered editing.'}
                  tooltip={getMetadata('media')?.tooltip_text}
                  isActive={modules.media}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('media')}
                  onEdit={() => handleEditMetadata('media')}
                  audioUrl={getAudioUrl('media')}
                  avatarUrl={getAvatarUrl('media')}
                />
              )}
            </div>
          </section>

          {/* Content Creation Section */}
          <section id="content">
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              CONTENT CREATION
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchesSearch('Civic Tools', 'Platform for government officials and civic leaders. Manage constituent requests, publish updates, and engage communities.') && (
                <IntegrationCard
                  id="civic"
                  icon={Landmark}
                  iconGradient="from-blue-600 to-indigo-700"
                  title={getMetadata('civic')?.title || 'Civic Tools'}
                  description={getMetadata('civic')?.description || 'Platform for government officials and civic leaders. Manage constituent requests, publish updates, and engage communities.'}
                  tooltip={getMetadata('civic')?.tooltip_text}
                  isActive={modules.civic}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('civic')}
                  onEdit={() => handleEditMetadata('civic')}
                />
              )}

              {matchesSearch('Blog', 'Create and publish blog posts with AI assistance, RSS import, and SEO optimization.') && (
                <IntegrationCard
                  id="blog"
                  icon={FileText}
                  iconGradient="from-orange-500 to-red-600"
                  title={getMetadata('blog')?.title || 'Blog'}
                  description={getMetadata('blog')?.description || 'Create and publish blog posts with AI assistance, RSS import, and SEO optimization.'}
                  tooltip={getMetadata('blog')?.tooltip_text}
                  isActive={modules.blog}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('blog')}
                  onEdit={() => handleEditMetadata('blog')}
                />
              )}
            </div>
          </section>

          {/* Engagement Section */}
          <section id="engagement">
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              ENGAGEMENT
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchesSearch('Events', 'Create and manage events with ticketing, registrations, RSVPs, and automated reminders.') && (
                <IntegrationCard
                  id="events"
                  icon={CalendarDays}
                  iconGradient="from-violet-500 to-purple-600"
                  title="Events"
                  description="Create and manage events with ticketing, registrations, RSVPs, and automated reminders."
                  tooltip="Enable to create events and manage attendees"
                  isActive={modules.events}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('events')}
                  onEdit={() => handleEditMetadata('events')}
                  audioUrl={getAudioUrl('events')}
                  avatarUrl={getAvatarUrl('events')}
                />
              )}

              {matchesSearch('Sign-up Sheets', 'Create volunteer sign-up sheets with time slots, capacity limits, and automated confirmations.') && (
                <IntegrationCard
                  id="signup_sheets"
                  icon={ClipboardList}
                  iconGradient="from-sky-500 to-blue-600"
                  title="Sign-up Sheets"
                  description="Create volunteer sign-up sheets with time slots, capacity limits, and automated confirmations."
                  tooltip="Enable to create and manage volunteer sign-up sheets"
                  isActive={modules.signup_sheets}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('signup_sheets')}
                  onEdit={() => handleEditMetadata('signup_sheets')}
                  audioUrl={getAudioUrl('signup_sheets')}
                  avatarUrl={getAvatarUrl('signup_sheets')}
                />
              )}

              {matchesSearch('Polls', 'Create interactive polls and surveys with real-time results, voting analytics, and shareable links.') && (
                <IntegrationCard
                  id="polls"
                  icon={BarChart3}
                  iconGradient="from-emerald-500 to-green-600"
                  title="Polls"
                  description="Create interactive polls and surveys with real-time results, voting analytics, and shareable links."
                  tooltip="Enable to create polls and collect feedback"
                  isActive={modules.polls}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('polls')}
                  onEdit={() => handleEditMetadata('polls')}
                  audioUrl={getAudioUrl('polls')}
                  avatarUrl={getAvatarUrl('polls')}
                />
              )}

              {matchesSearch('QR Codes', 'Generate QR codes for events, links, contact info, and more. Track scans and engagement.') && (
                <IntegrationCard
                  id="qr_codes"
                  icon={QrCode}
                  iconGradient="from-rose-500 to-pink-600"
                  title="QR Codes"
                  description="Generate QR codes for events, links, contact info, and more. Track scans and engagement."
                  tooltip="Enable to create and manage QR codes"
                  isActive={modules.qr_codes}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('qr_codes')}
                  onEdit={() => handleEditMetadata('qr_codes')}
                />
              )}

              {matchesSearch('Marketing', 'Create email campaigns, build automated sequences, and manage marketing automation workflows.') && (
                <IntegrationCard
                  id="marketing"
                  icon={Target}
                  iconGradient="from-purple-500 to-indigo-600"
                  title="Marketing"
                  description="Create email campaigns, build automated sequences, and manage marketing automation workflows."
                  tooltip="Enable to access marketing campaigns and automation tools"
                  isActive={modules.marketing}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('marketing')}
                  onEdit={() => handleEditMetadata('marketing')}
                  audioUrl={getAudioUrl('marketing')}
                  avatarUrl={getAvatarUrl('marketing')}
                />
              )}

              {matchesSearch('SMS', 'Send SMS campaigns, automate text message reminders, and engage your audience directly on their mobile devices.') && (
                <IntegrationCard
                  id="sms"
                  icon={Smartphone}
                  iconGradient="from-green-500 to-teal-600"
                  title="SMS"
                  description="Send SMS campaigns, automate text message reminders, and engage your audience directly on their mobile devices."
                  tooltip="Enable to send SMS messages and notifications"
                  isActive={modules.sms}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('sms')}
                  onEdit={() => handleEditMetadata('sms')}
                />
              )}
              
              {matchesSearch('Team Chat', 'Real-time team messaging and collaboration. Connect with your team members instantly.') && (
                <IntegrationCard
                  id="team_chat"
                  icon={MessageSquare}
                  iconGradient="from-cyan-500 to-blue-600"
                  title={getMetadata('team_chat')?.title || 'Team Chat'}
                  description={getMetadata('team_chat')?.description || 'Real-time team messaging and collaboration. Connect with your team members instantly.'}
                  tooltip={getMetadata('team_chat')?.tooltip_text}
                  isActive={modules.team_chat}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('team_chat')}
                  onEdit={() => handleEditMetadata('team_chat')}
                />
              )}

              {matchesSearch('Newsletter', 'Build and grow your email list. Send newsletters to subscribers from your My Page and influencer profiles.') && (
                <IntegrationCard
                  id="newsletter"
                  icon={Mail}
                  iconGradient="from-blue-500 to-purple-600"
                  title="Newsletter"
                  description="Build and grow your email list. Send newsletters to subscribers from your My Page and influencer profiles."
                  tooltip="Enable to build your email list and send newsletters"
                  isActive={modules.newsletter}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('newsletter')}
                  onEdit={() => handleEditMetadata('newsletter')}
                />
              )}

              {matchesSearch('Forms', 'Create custom forms for lead capture and tracking. Generate unique links for field staff and salespeople with form attribution.') && (
                <IntegrationCard
                  id="forms"
                  icon={FileText}
                  iconGradient="from-teal-500 to-cyan-600"
                  title="Forms"
                  description="Create custom forms for lead capture and tracking. Generate unique links for field staff and salespeople with form attribution."
                  tooltip="Enable to create custom forms and track submissions"
                  isActive={modules.forms}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('forms')}
                  onEdit={() => handleEditMetadata('forms')}
                  audioUrl={getAudioUrl('forms')}
                  avatarUrl={getAvatarUrl('forms')}
                />
              )}
            </div>
          </section>

          {/* Business Tools Section */}
          <section id="business">
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              BUSINESS TOOLS
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchesSearch('Advertiser Account', 'Create an advertiser account to run campaigns, manage ad budgets, and reach engaged podcast audiences.') && (
                <IntegrationCard
                  id="advertiser"
                  icon={TrendingUp}
                  iconGradient="from-orange-500 to-red-600"
                  title="Advertiser Account"
                  description="Create an advertiser account to run campaigns, manage ad budgets, and reach engaged podcast audiences."
                  tooltip="Enable to access advertiser features and campaign management"
                  isActive={modules.advertiser}
                  isAdmin={isAdmin}
                  onToggle={() => {
                    if (!modules.advertiser) {
                      navigate('/advertiser/signup');
                    } else {
                      toggleModule('advertiser');
                    }
                  }}
                  onEdit={() => handleEditMetadata('advertiser')}
                />
              )}

              {matchesSearch('Influencer', 'Creator tools for influencers. Manage brand deals, track performance, and monetize your content.') && (
                <IntegrationCard
                  id="influencer"
                  icon={TrendingUp}
                  iconGradient="from-pink-500 to-purple-600"
                  title={getMetadata('influencer')?.title || 'Influencer'}
                  description={getMetadata('influencer')?.description || 'Creator tools for influencers. Manage brand deals, track performance, and monetize your content.'}
                  tooltip={getMetadata('influencer')?.tooltip_text}
                  isActive={modules.influencer}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('influencer')}
                  onEdit={() => handleEditMetadata('influencer')}
                />
              )}

              {matchesSearch('Agency', 'Talent agency management tools. Represent creators, manage rosters, and negotiate deals.') && (
                <IntegrationCard
                  id="agency"
                  icon={Building2}
                  iconGradient="from-slate-600 to-gray-700"
                  title={getMetadata('agency')?.title || 'Agency'}
                  description={getMetadata('agency')?.description || 'Talent agency management tools. Represent creators, manage rosters, and negotiate deals.'}
                  tooltip={getMetadata('agency')?.tooltip_text}
                  isActive={modules.agency}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('agency')}
                  onEdit={() => handleEditMetadata('agency')}
                />
              )}

              {matchesSearch('Project Management', 'Manage client projects, track tickets, send documents, and collaborate with your team.') && (
                <IntegrationCard
                  id="project_management"
                  icon={CheckSquare}
                  iconGradient="from-teal-500 to-cyan-600"
                  title={getMetadata('project_management')?.title || 'Project Management'}
                  description={getMetadata('project_management')?.description || 'Manage client projects, track tickets, send documents, and collaborate with your team.'}
                  tooltip={getMetadata('project_management')?.tooltip_text}
                  isActive={modules.project_management}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('project_management')}
                  onEdit={() => handleEditMetadata('project_management')}
                  audioUrl={getAudioUrl('project_management')}
                  avatarUrl={getAvatarUrl('project_management')}
                />
              )}

              {matchesSearch('Monetization', 'Revenue tracking and financial tools. Monitor earnings, ad revenue, sponsorships, and subscriptions.') && (
                <IntegrationCard
                  id="monetization"
                  icon={DollarSign}
                  iconGradient="from-emerald-500 to-green-600"
                  title={getMetadata('monetization')?.title || 'Monetization'}
                  description={getMetadata('monetization')?.description || 'Revenue tracking and financial tools. Monitor earnings, ad revenue, sponsorships, and subscriptions.'}
                  tooltip={getMetadata('monetization')?.tooltip_text}
                  isActive={modules.monetization}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('monetization')}
                  onEdit={() => handleEditMetadata('monetization')}
                />
              )}

              {matchesSearch('Lead Pixel', 'Invisible tracking pixel to capture website visitors and behavioral data. Track page views, session duration, and geo location.') && (
                <IntegrationCard
                  id="lead_pixel"
                  icon={Target}
                  iconGradient="from-violet-500 to-purple-600"
                  title={getMetadata('lead_pixel')?.title || 'Lead Pixel'}
                  description={getMetadata('lead_pixel')?.description || 'Invisible tracking pixel to capture website visitors and behavioral data. Track page views, session duration, and geo location.'}
                  tooltip={getMetadata('lead_pixel')?.tooltip_text || 'Track website visitors invisibly and capture behavioral data'}
                  isActive={modules.lead_pixel}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('lead_pixel')}
                  onEdit={() => handleEditMetadata('lead_pixel')}
                />
              )}

              {matchesSearch('Newsletter', 'Build and grow your email list. Send newsletters to subscribers from your My Page and influencer profiles.') && (
                <IntegrationCard
                  id="newsletter"
                  icon={Mail}
                  iconGradient="from-indigo-500 to-blue-600"
                  title={getMetadata('newsletter')?.title || 'Newsletter'}
                  description={getMetadata('newsletter')?.description || 'Build and grow your email list. Send newsletters to subscribers from your My Page and influencer profiles.'}
                  tooltip={getMetadata('newsletter')?.tooltip_text || 'Enable newsletter subscription forms on your profile pages'}
                  isActive={modules.newsletter}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('newsletter')}
                  onEdit={() => handleEditMetadata('newsletter')}
                />
              )}
            </div>
          </section>

          {/* Social Media Section */}
          <section id="social">
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              SOCIAL MEDIA
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Instagram */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['instagram'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['instagram'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Instagram</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect your Instagram account to share content and grow your audience.
                    </p>
                  </div>
                  
                  {groupedConnections['instagram'] && groupedConnections['instagram'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['instagram'].length} account{groupedConnections['instagram'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* Facebook */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['facebook'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['facebook'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Facebook</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect your Facebook page to expand your reach and engagement.
                    </p>
                  </div>
                  
                  {groupedConnections['facebook'] && groupedConnections['facebook'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['facebook'].length} account{groupedConnections['facebook'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* LinkedIn */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['linkedin'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['linkedin'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">LinkedIn</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect LinkedIn to build your professional network and brand.
                    </p>
                  </div>
                  
                  {groupedConnections['linkedin'] && groupedConnections['linkedin'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['linkedin'].length} account{groupedConnections['linkedin'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* Twitter/X */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                      <Twitter className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['twitter'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['twitter'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">X (Twitter)</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect your X account to share updates and engage with followers.
                    </p>
                  </div>
                  
                  {groupedConnections['twitter'] && groupedConnections['twitter'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['twitter'].length} account{groupedConnections['twitter'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* YouTube */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['youtube'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['youtube'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">YouTube</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect YouTube to showcase your video content and grow subscribers.
                    </p>
                  </div>
                  
                  {groupedConnections['youtube'] && groupedConnections['youtube'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['youtube'].length} account{groupedConnections['youtube'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* TikTok */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['tiktok'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['tiktok'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">TikTok</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect TikTok to share short-form videos and reach new audiences.
                    </p>
                  </div>
                  
                  {groupedConnections['tiktok'] && groupedConnections['tiktok'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['tiktok'].length} account{groupedConnections['tiktok'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          {/* Payments Section */}
          <section id="services">
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              SERVICES & PAYMENTS
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Stripe */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="default" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Stripe</h3>
                    <p className="text-xs text-muted-foreground">Payment Processing</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Accept payments, manage subscriptions, and handle transactions securely.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Configure
                  </Button>
                </div>
              </Card>

              {/* PayPal */}
              <Card className="p-6 hover:border-primary/50 transition-all opacity-60">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">PayPal</h3>
                    <p className="text-xs text-muted-foreground">Payment Processing</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Alternative payment processing with PayPal integration.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </Card>

              {/* Zoom */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Not Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Zoom</h3>
                    <p className="text-xs text-muted-foreground">Video Conferencing</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect Zoom to schedule and host virtual meetings and webinars.
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect('Zoom')}
                  >
                    Connect
                  </Button>
                </div>
              </Card>

              {/* Google Calendar */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Not Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Google Calendar</h3>
                    <p className="text-xs text-muted-foreground">Calendar Integration</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sync your meetings and events with Google Calendar automatically.
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect('Google Calendar')}
                  >
                    Connect
                  </Button>
                </div>
              </Card>

              {/* Google Email (Gmail) */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Not Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Google Email</h3>
                    <p className="text-xs text-muted-foreground">Email Integration</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect Gmail to manage email communications and sync contacts.
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect('Gmail')}
                  >
                    Connect
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px] bg-background border shadow-lg z-50">
          <DialogHeader>
            <DialogTitle>Edit Integration Info</DialogTitle>
            <DialogDescription>
              Update the title, description, and tooltip for this integration.
            </DialogDescription>
          </DialogHeader>
          
          {editingModule && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <input
                  id="title"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className="min-h-[80px] bg-background"
                  value={editingModule.description}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tooltip">Tooltip (More Info)</Label>
                <Textarea
                  id="tooltip"
                  className="min-h-[100px] bg-background"
                  placeholder="Detailed information shown when hovering over the info icon..."
                  value={editingModule.tooltip}
                  onChange={(e) => setEditingModule({ ...editingModule, tooltip: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMetadata}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dependency Warning Dialog */}
      <AlertDialog open={dependencyWarningOpen} onOpenChange={setDependencyWarningOpen}>
        <AlertDialogContent className="bg-background border shadow-lg z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Connected Seekie</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{dependencyMessage}</p>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label 
                  htmlFor="dont-show-again" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Don't show this again
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDependencyWarningOpen(false);
              setDontShowAgain(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDependencyDeactivate}>
              Deactivate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dependency Warning Dialog */}
      <AlertDialog open={dependencyWarningOpen} onOpenChange={setDependencyWarningOpen}>
        <AlertDialogContent className="bg-background border shadow-lg z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Connected Seekie</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-foreground">{dependencyMessage}</p>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-border cursor-pointer"
                />
                <label 
                  htmlFor="dont-show-again" 
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Don't show this again
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDependencyWarningOpen(false);
              setDontShowAgain(false);
              setModuleToDeactivate(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDependencyDeactivate}>
              Deactivate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dependency Warning Dialog */}
      <AlertDialog open={dependencyWarningOpen} onOpenChange={setDependencyWarningOpen}>
        <AlertDialogContent className="bg-background border shadow-lg z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Connected Seekie</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-foreground">{dependencyMessage}</p>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                />
                <label 
                  htmlFor="dont-show-again" 
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Don't show this again
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDependencyWarningOpen(false);
              setDontShowAgain(false);
              setModuleToDeactivate(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDependencyDeactivate}>
              Deactivate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Seeky?</AlertDialogTitle>
            <AlertDialogDescription>
              Your data won&apos;t be deleted by deactivating this Seeky. You can reactivate it anytime and your data will still be there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeactivateDialogOpen(false);
              setModuleToDeactivate(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeactivate}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Integrations;
