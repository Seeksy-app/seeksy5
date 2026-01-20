import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Youtube, Twitter, MapPin, Mail, Shield, Heart, MessageSquare, Facebook, Linkedin } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import sampleImage1 from "@/assets/influencer-sample-1.jpg";
import sampleImage2 from "@/assets/influencer-sample-2.jpg";
import sampleImage3 from "@/assets/influencer-sample-3.jpg";
import youtubeThumbnail1 from "@/assets/youtube-thumbnail-1.jpg";
import youtubeThumbnail2 from "@/assets/youtube-thumbnail-2.jpg";
import youtubeThumbnail3 from "@/assets/youtube-thumbnail-3.jpg";
import demoAvatar from "@/assets/influencer-avatar-1.jpg";
import alexMorganAvatar from "@/assets/demo-influencer-alex-morgan.jpg";
import emmaMartinezAvatar from "@/assets/demo-influencer-emma-martinez.jpg";
import sarahJohnsonAvatar from "@/assets/demo-influencer-sarah-johnson.jpg";
import marcoRodriguezAvatar from "@/assets/demo-influencer-marco-rodriguez.jpg";

export default function InfluencerPortfolio() {
  const { username } = useParams<{ username: string }>();
  const portfolioUsername = username?.replace('.portfolio', '');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');

  const { data: profile, isLoading } = useQuery({
    queryKey: ["influencer-portfolio", portfolioUsername],
    queryFn: async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", portfolioUsername)
        .single();

      if (profileError) throw profileError;

      // Get social media accounts
      const { data: socialAccounts } = await supabase
        .from("social_media_accounts")
        .select("platform, username, followers_count, engagement_rate, is_verified")
        .eq("user_id", profileData.id);

      return {
        ...profileData,
        socialAccounts: socialAccounts || [],
      };
    },
    enabled: !!portfolioUsername,
  });

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

  const allPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'x'];
  
  const platformData: Record<string, { followers: number; engagement: number; avgLikes: string }> = {
    instagram: { followers: 2500000, engagement: 4.2, avgLikes: '45K' },
    youtube: { followers: 1800000, engagement: 5.8, avgLikes: '50K' },
    tiktok: { followers: 3200000, engagement: 8.1, avgLikes: '120K' },
    facebook: { followers: 950000, engagement: 2.3, avgLikes: '22K' },
    linkedin: { followers: 450000, engagement: 3.1, avgLikes: '8K' },
    x: { followers: 680000, engagement: 2.7, avgLikes: '15K' },
  };

  const currentPlatformData = platformData[selectedPlatform] || platformData.instagram;

  const getContentImages = () => {
    if (selectedPlatform === 'youtube') {
      return [youtubeThumbnail1, youtubeThumbnail2, youtubeThumbnail3];
    }
    return [sampleImage1, sampleImage2, sampleImage3];
  };

  const getContentMetrics = (index: number) => {
    if (selectedPlatform === 'youtube') {
      const viewsData = ['286.9K', '629.3K', '446.4K'];
      const hoursData = ['1.2K', '2.8K', '1.8K'];
      return {
        primary: { icon: 'views', value: viewsData[index] },
        secondary: { icon: 'hours', value: hoursData[index] + ' hrs' }
      };
    }
    const likesData = ['286.9K', '629.3K', '446.4K'];
    const commentsData = ['4K', '6K', '2.8K'];
    return {
      primary: { icon: 'likes', value: likesData[index] },
      secondary: { icon: 'comments', value: commentsData[index] }
    };
  };

  const contentImages = getContentImages();

  // Use demo avatar for influencer portfolio display (realistic photo)
  const getDisplayAvatar = () => {
    switch (profile?.username) {
      case 'DemoInfluencer': return alexMorganAvatar;
      case 'hello': return emmaMartinezAvatar;
      case 'support': return sarahJohnsonAvatar;
      case 'andrew1': return marcoRodriguezAvatar;
      case 'JohnnyRocket': return demoAvatar;
      default: return profile?.account_avatar_url || profile?.avatar_url || demoAvatar;
    }
  };
  const displayAvatar = getDisplayAvatar();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
          <p className="text-muted-foreground">This influencer portfolio doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-2 border-primary">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[300px_1fr] gap-0">
              {/* Left Sidebar */}
              <div className="bg-card p-6 border-r border-border">
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-48 w-48 mx-auto border-4 border-border">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback className="text-4xl">
                        {profile.account_full_name?.[0] || profile.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-2 right-1/2 translate-x-1/2 translate-y-full">
                      <div className="bg-primary p-2 rounded-full">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Name & Username */}
                  <div className="text-center space-y-1 mt-8">
                    <h1 className="text-2xl font-bold">{profile.account_full_name || profile.username}</h1>
                    <p className="text-muted-foreground">@{portfolioUsername}</p>
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
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>

                  {/* Description */}
                  <div className="text-sm text-center text-muted-foreground">
                    <p>{profile.bio || "The Profile is registered on heepsy. Opted in creators have higher response rates than average."}</p>
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="p-6">
                {/* Social Platform Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {allPlatforms.map((platform) => (
                    <Button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`gap-2 ${platform === selectedPlatform ? getPlatformColor(platform) : 'bg-muted hover:bg-muted/80 border border-border'}`}
                    >
                      {getPlatformIcon(platform)}
                      {platform === 'x' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Followers</p>
                    <p className="text-3xl font-bold">{currentPlatformData.followers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Engagement</p>
                    <p className="text-3xl font-bold">{currentPlatformData.engagement}%</p>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="communication" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                      Communication
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                      Media
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                      Payment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    {/* Sample Content Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {contentImages.map((image, index) => {
                        const metrics = getContentMetrics(index);
                        return (
                          <Card key={index} className="overflow-hidden">
                            <div className={selectedPlatform === 'youtube' ? 'aspect-video overflow-hidden' : 'aspect-square overflow-hidden'}>
                              <img src={image} alt={`Content ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                  {metrics.primary.icon === 'views' ? (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                      <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                  ) : (
                                    <Heart className="h-4 w-4 fill-current" />
                                  )}
                                  <span>{metrics.primary.value}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {metrics.secondary.icon === 'hours' ? (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"/>
                                      <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                  ) : (
                                    <MessageSquare className="h-4 w-4" />
                                  )}
                                  <span>{metrics.secondary.value}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-4">Average Engagement</h3>
                          <p className="text-2xl font-bold mb-4">{currentPlatformData.avgLikes} per Post</p>
                          <div className="flex gap-6 justify-center">
                            <div className="text-center">
                              <div className={`${getPlatformColor(selectedPlatform).split(' ')[0]} p-2 rounded-lg mb-2 inline-block`}>
                                {getPlatformIcon(selectedPlatform)}
                              </div>
                              <p className="text-sm font-medium">{currentPlatformData.avgLikes} ♥</p>
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
                                  <div className="h-full bg-primary" style={{ width: '94%' }} />
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

                  <TabsContent value="payment">
                    <p className="text-muted-foreground">Payment tab content</p>
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
