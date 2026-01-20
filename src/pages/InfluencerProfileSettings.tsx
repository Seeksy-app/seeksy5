import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, ExternalLink, Check, Instagram, Youtube, Twitter, MapPin, Mail, Shield, Heart, MessageSquare, Edit2, Facebook, Linkedin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import sampleImage1 from "@/assets/influencer-sample-1.jpg";
import sampleImage2 from "@/assets/influencer-sample-2.jpg";
import sampleImage3 from "@/assets/influencer-sample-3.jpg";
import demoAvatar from "@/assets/influencer-avatar-1.jpg";

export default function InfluencerProfileSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
    username: "",
    user_id: "",
  });

  const [profileUrl, setProfileUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: socialAccounts, refetch: refetchSocial } = useQuery({
    queryKey: ["influencer-social", profileData.user_id],
    queryFn: async () => {
      if (!profileData.user_id) return [];
      const { data } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("user_id", profileData.user_id);
      return data || [];
    },
    enabled: !!profileData.user_id,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        // Use demo avatar for JohnnyRocket's influencer profile display
        const avatarUrl = profile.username === 'JohnnyRocket' ? demoAvatar : (profile.account_avatar_url || "");
        
        setProfileData({
          full_name: profile.account_full_name || "",
          bio: profile.bio || "",
          avatar_url: avatarUrl,
          username: profile.username || "",
          user_id: user.id,
        });
        
        if (profile.username) {
          setProfileUrl(`${window.location.origin}/${profile.username}.portfolio`);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          account_full_name: profileData.full_name,
          bio: profileData.bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Profile URL copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'twitter': 
      case 'x': return <Twitter className="h-4 w-4" />;
      case 'tiktok': return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0';
      case 'youtube': return 'bg-red-600 hover:bg-red-700 text-white border-0';
      case 'twitter':
      case 'x': return 'bg-black hover:bg-gray-900 text-white border-0';
      case 'tiktok': return 'bg-black hover:bg-gray-900 text-white border-0';
      case 'facebook': return 'bg-blue-600 hover:bg-blue-700 text-white border-0';
      case 'linkedin': return 'bg-blue-700 hover:bg-blue-800 text-white border-0';
      default: return 'bg-muted hover:bg-muted/80';
    }
  };

  const primarySocial = socialAccounts?.[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Influencer Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your public influencer profile that agencies can discover
          </p>
        </div>

        {/* Shareable Profile Link */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Shareable Profile Link</CardTitle>
            <CardDescription>
              Share this link with agencies and brands to showcase your influencer profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={profileUrl}
                readOnly
                className="flex-1 bg-muted"
              />
              <Button
                variant="outline"
                onClick={copyProfileUrl}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(profileUrl, "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Active</Badge>
              <span>Your profile is visible to agencies searching for influencers</span>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview with Edit Controls */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Live Preview</h2>
          <div className="flex gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditing ? "Preview Mode" : "Edit Mode"}
            </Button>
            {isEditing && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* Portfolio Preview */}
        <Card className="border-2 border-green-600">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[300px_1fr] gap-0">
              {/* Left Sidebar */}
              <div className="bg-card p-6 border-r border-border">
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="relative">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <Avatar className="h-48 w-48 mx-auto">
                          <AvatarImage src={profileData.avatar_url} />
                          <AvatarFallback className="text-4xl">
                            {profileData.full_name?.[0] || profileData.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Input
                          placeholder="Avatar URL"
                          value={profileData.avatar_url}
                          onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <Avatar className="h-48 w-48 mx-auto">
                          <AvatarImage src={profileData.avatar_url} />
                          <AvatarFallback className="text-4xl">
                            {profileData.full_name?.[0] || profileData.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-1/2 translate-x-1/2 translate-y-full">
                          <div className="bg-green-600 p-2 rounded-full">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Name & Username */}
                  <div className="text-center space-y-2 mt-8">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={profileData.full_name}
                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </div>
                        <p className="text-muted-foreground text-sm">@{profileData.username}</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold">{profileData.full_name || profileData.username}</h1>
                        <p className="text-muted-foreground">@{profileData.username}</p>
                      </>
                    )}
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>United States</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary" className="bg-muted">Beauty</Badge>
                    <Badge variant="secondary" className="bg-muted">Lifestyle</Badge>
                  </div>

                  {/* CTA Button */}
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Mail className="h-4 w-4 mr-2" />
                    New Outreach Email
                  </Button>

                  {/* Bio */}
                  <div className="text-sm text-center">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell agencies about yourself..."
                          rows={4}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Max 500 characters</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{profileData.bio || "Add your bio to tell agencies about yourself and your content"}</p>
                    )}
                  </div>

                  {/* Social Media Connection */}
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => navigate("/integrations")}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage Connected Accounts
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Content Area */}
              <div className="p-6">
                {/* Social Platform Tabs */}
                {socialAccounts && socialAccounts.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {socialAccounts.map((account: any) => (
                      <Button
                        key={account.id}
                        className={`gap-2 ${account.platform === primarySocial?.platform ? getPlatformColor(account.platform) : 'bg-muted hover:bg-muted/80 border border-border'}`}
                      >
                        {getPlatformIcon(account.platform)}
                        {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button className="gap-2 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Button>
                    <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white border-0">
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </Button>
                    <Button className="gap-2 bg-black hover:bg-gray-900 text-white border-0">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      TikTok
                    </Button>
                  </div>
                )}

                {/* Stats */}
                {primarySocial && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Followers</p>
                      <p className="text-3xl font-bold">{(primarySocial.followers_count || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Engagement</p>
                      <p className="text-3xl font-bold">{primarySocial.engagement_rate || 0}%</p>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="communication" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent">
                      Communication
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent">
                      Media
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    {/* Sample Content Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <Card className="overflow-hidden">
                        <div className="aspect-square overflow-hidden">
                          <img src={sampleImage1} alt="Content 1" className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 fill-current" />
                              <span>286.9K</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>4K</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden">
                        <div className="aspect-square overflow-hidden">
                          <img src={sampleImage2} alt="Content 2" className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 fill-current" />
                              <span>629.3K</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>6K</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden">
                        <div className="aspect-square overflow-hidden">
                          <img src={sampleImage3} alt="Content 3" className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 fill-current" />
                              <span>446.4K</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>2.8K</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-4">Average Engagement</h3>
                          <p className="text-2xl font-bold mb-4">45k per Post</p>
                          <div className="flex gap-6 justify-center">
                            <div className="text-center">
                              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg mb-2 inline-block">
                                <Instagram className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-sm font-medium">45K ♥</p>
                            </div>
                            <div className="text-center">
                              <div className="bg-red-600 p-2 rounded-lg mb-2 inline-block">
                                <Youtube className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-sm font-medium">50K ♥</p>
                            </div>
                            <div className="text-center">
                              <div className="bg-black p-2 rounded-lg mb-2 inline-block">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                </svg>
                              </div>
                              <p className="text-sm font-medium">20K ♥</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-4">Audience Insights</h3>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">94% Real People</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-green-600" style={{ width: '94%' }} />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">6% Suspicious People</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-muted-foreground" style={{ width: '6%' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="communication">
                    <p className="text-muted-foreground">Communication tab content</p>
                  </TabsContent>

                  <TabsContent value="media">
                    <p className="text-muted-foreground">Media tab content</p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
