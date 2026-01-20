import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useMyPageVideo } from "@/hooks/useMyPageVideo";
import { Card } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Settings, Clock, MapPin, Link2, Users, ChevronDown, Vote, Radio, FileText, Eye } from "lucide-react";
import ShareProfileButton from "@/components/ShareProfileButton";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { ProfileMenuBar } from "@/components/ProfileMenuBar";
import { ProfileQRCode } from "@/components/ProfileQRCode";
import {
  SiX,
  SiLinkedin,
  SiFacebook,
  SiInstagram,
  SiGithub,
  SiYoutube,
  SiTiktok,
  SiDiscord,
} from "react-icons/si";
import { PageBuilderProvider, usePageBuilder } from "@/contexts/PageBuilderContext";
import { DraggableElement } from "@/components/page-builder/DraggableElement";
import { PageBuilderToolbar } from "@/components/page-builder/PageBuilderToolbar";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  display_name?: string | null;
  bio: string;
  avatar_url: string;
  theme_color: string;
  social_icons_color: boolean | null;
  is_live_on_profile: boolean | null;
  live_stream_title: string | null;
  live_video_url: string | null;
  my_page_video_type: 'own' | 'ad' | null;
  my_page_video_id: string | null;
  my_page_video_loop: boolean | null;
  page_background_color?: string | null;
  hero_section_color?: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url?: string;
}

interface MeetingType {
  id: string;
  name: string;
  description: string;
  duration: number;
  location_type: string;
}

interface SignupSheet {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  image_url: string | null;
  section: string | null;
}

interface SectionMetadata {
  name: string;
  image_url: string | null;
}

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface Episode {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  publish_date: string;
  duration_seconds: number | null;
  podcast_id: string;
}

const ProfileContent = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [signupSheets, setSignupSheets] = useState<SignupSheet[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [sectionMetadata, setSectionMetadata] = useState<Map<string, SectionMetadata>>(new Map());
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [currentLiveViewers, setCurrentLiveViewers] = useState(0);
  const [activeMenuSection, setActiveMenuSection] = useState<string | undefined>();
  const viewerSessionRef = useRef<string | null>(null);
  const { videoUrl: myPageVideoUrl, trackImpression, shouldLoop } = useMyPageVideo(profile);
  
  const { layoutElements, updateElementPosition, isEditMode, isLoading: layoutLoading } = usePageBuilder();

  const isOwnProfile = profile?.id === currentUser?.id;
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = layoutElements.findIndex((el) => el.id === active.id);
      const newIndex = layoutElements.findIndex((el) => el.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        updateElementPosition(active.id as string, newIndex);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    loadProfile();
  }, [username]);

  // Track live stream viewers
  useEffect(() => {
    if (profile?.is_live_on_profile) {
      trackLiveViewer();
      subscribeToViewerCount();
    }
    
    return () => {
      if (viewerSessionRef.current && profile) {
        supabase
          .from('live_stream_viewers')
          .update({ is_active: false })
          .eq('session_id', viewerSessionRef.current)
          .eq('profile_id', profile.id);
      }
    };
  }, [profile?.is_live_on_profile, profile?.id]);

  const trackLiveViewer = async () => {
    if (!profile) return;
    
    const sessionId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    viewerSessionRef.current = sessionId;

    await supabase
      .from('live_stream_viewers')
      .insert({
        profile_id: profile.id,
        session_id: sessionId,
        is_active: true
      });

    const heartbeatInterval = setInterval(async () => {
      await supabase
        .from('live_stream_viewers')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('profile_id', profile.id);
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  };

  const subscribeToViewerCount = async () => {
    if (!profile) return;

    const channel = supabase
      .channel(`live-viewers-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stream_viewers',
          filter: `profile_id=eq.${profile.id}`
        },
        async () => {
          const { count } = await supabase
            .from('live_stream_viewers')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .eq('is_active', true)
            .gte('last_seen_at', new Date(Date.now() - 60000).toISOString());
          
          setCurrentLiveViewers(count || 0);
        }
      )
      .subscribe();

    const { count } = await supabase
      .from('live_stream_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .gte('last_seen_at', new Date(Date.now() - 60000).toISOString());
    
    setCurrentLiveViewers(count || 0);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (profile) {
      document.title = `${profile.full_name} (@${profile.username}) - Seeksy`;
    }

    return () => {
      document.title = 'Seeksy - Connect, Schedule & Engage';
    };
  }, [profile]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username || "")
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setLoading(false);
        return;
      }
      
      setProfile({
        ...profileData,
        my_page_video_type: profileData.my_page_video_type as 'own' | 'ad' | null,
      } as Profile);

      if (!isOwnProfile) {
        await supabase.from("profile_views").insert({
          profile_id: profileData.id,
        });
      }

      // Load all profile data
      const [eventsData, meetingTypesData, signupSheetsData, pollsData, linksData, customLinksData, sectionsData, podcastsData] = await Promise.all([
        supabase.from("events").select("*").eq("user_id", profileData.id).eq("is_published", true).eq("show_on_profile", true).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }),
        supabase.from("meeting_types").select("id, name, description, duration, location_type").eq("user_id", profileData.id).eq("is_active", true),
        supabase.from("signup_sheets").select("*").eq("user_id", profileData.id).eq("is_published", true).gte("end_date", new Date().toISOString()).order("start_date", { ascending: true}),
        supabase.from("polls").select("id, title, description, deadline").eq("user_id", profileData.id).eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("social_links").select("*").eq("profile_id", profileData.id).order("display_order"),
        supabase.from("custom_links").select("*").eq("profile_id", profileData.id).eq("is_active", true).order("display_order"),
        supabase.from("custom_link_sections").select("*").eq("profile_id", profileData.id),
        supabase.from("podcasts").select("id, title, description, cover_image_url").eq("user_id", profileData.id).eq("is_published", true).eq("show_on_profile", true),
      ]);

      setEvents(eventsData.data || []);
      setMeetingTypes(meetingTypesData.data || []);
      setSignupSheets(signupSheetsData.data || []);
      setPolls(pollsData.data || []);
      setSocialLinks(linksData.data || []);
      setCustomLinks(customLinksData.data || []);

      if (sectionsData.data) {
        const metadataMap = new Map<string, SectionMetadata>();
        sectionsData.data.forEach((section: any) => {
          metadataMap.set(section.name, {
            name: section.name,
            image_url: section.image_url
          });
        });
        setSectionMetadata(metadataMap);
      }

      setPodcasts(podcastsData.data || []);

      if (podcastsData.data && podcastsData.data.length > 0) {
        const { data: episodesData } = await supabase
          .from("episodes")
          .select("*")
          .in("podcast_id", podcastsData.data.map((p: any) => p.id))
          .eq("is_published", true)
          .order("publish_date", { ascending: false });

        setEpisodes(episodesData || []);
      }

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string, isColored: boolean) => {
    const lowerPlatform = platform.toLowerCase();
    const baseClass = "h-7 w-7";
    const colorClass = isColored ? "" : "text-white dark:text-foreground";
    const iconClass = `${baseClass} ${colorClass}`;
    
    if (lowerPlatform.includes("twitter") || lowerPlatform.includes("x")) {
      return <SiX className={iconClass} style={isColored ? { color: '#FFFFFF' } : undefined} />;
    } else if (lowerPlatform.includes("linkedin")) {
      return <SiLinkedin className={iconClass} style={isColored ? { color: '#0A66C2' } : undefined} />;
    } else if (lowerPlatform.includes("facebook")) {
      return <SiFacebook className={iconClass} style={isColored ? { color: '#1877F2' } : undefined} />;
    } else if (lowerPlatform.includes("instagram")) {
      return <SiInstagram className={iconClass} style={isColored ? { color: '#E4405F' } : undefined} />;
    } else if (lowerPlatform.includes("github")) {
      return <SiGithub className={iconClass} style={isColored ? { color: '#FFFFFF' } : undefined} />;
    } else if (lowerPlatform.includes("youtube")) {
      return <SiYoutube className={iconClass} style={isColored ? { color: '#FF0000' } : undefined} />;
    } else if (lowerPlatform.includes("tiktok")) {
      return <SiTiktok className={iconClass} style={isColored ? { color: '#000000' } : undefined} />;
    } else if (lowerPlatform.includes("discord")) {
      return <SiDiscord className={iconClass} style={isColored ? { color: '#5865F2' } : undefined} />;
    }
    return null;
  };

  const getLocationLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone: "Phone Call",
      zoom: "Zoom",
      teams: "Microsoft Teams",
      meet: "Google Meet",
      "in-person": "In Person",
      custom: "Custom Location",
    };
    return labels[type] || type;
  };

  const trackLinkClick = async (url: string, type: string) => {
    if (!profile || isOwnProfile) return;
    
    await supabase.from("link_clicks").insert({
      profile_id: profile.id,
      link_url: url,
      link_type: type,
    });
  };

  // Get sorted elements
  const sortedElements = [...layoutElements].sort((a, b) => a.position_order - b.position_order);
  
  // Calculate menu counts
  const menuCounts = {
    events: events.length,
    meetings: meetingTypes.length,
    signupSheets: signupSheets.length,
    polls: polls.length,
    podcasts: podcasts.length,
    blogPosts: 0,
    customLinks: customLinks.length,
  };
  
  const handleMenuSectionClick = (sectionId: string) => {
    setActiveMenuSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading || layoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">This user doesn't exist.</p>
        </Card>
      </div>
    );
  }

  // Render element content based on type
  const renderElement = (elementType: string) => {
    switch (elementType) {
      case 'streaming':
        return (
          <div className="mb-6">
            {profile?.is_live_on_profile ? (
              <Card className="overflow-hidden border-2 border-brand-red/50 shadow-lg">
                <div className="bg-gradient-to-r from-brand-red/90 to-brand-navy/90 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white font-bold text-sm">LIVE</span>
                    </div>
                    <span className="text-white font-medium text-sm">Streaming now</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    <Users className="h-3 w-3 mr-1" />
                    {currentLiveViewers} watching
                  </Badge>
                </div>
                <div className="aspect-video bg-gradient-to-br from-brand-navy to-black relative">
                  {profile.live_video_url ? (
                    <video 
                      src={profile.live_video_url} 
                      autoPlay
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                      <Badge variant="secondary" className="mb-4 bg-amber-500 text-amber-950 border-0">
                        Not Live
                      </Badge>
                      <div className="w-full max-w-md aspect-video bg-gradient-to-br from-muted/20 to-muted/5 rounded-lg border-2 border-dashed border-muted/30 flex items-center justify-center opacity-60">
                        <Eye className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground mt-4">Check back later for live streams</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : myPageVideoUrl ? (
              <Card className="overflow-hidden">
                <div className="aspect-video bg-black relative">
                  <video
                    src={myPageVideoUrl}
                    loop={shouldLoop}
                    controls
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onPlay={trackImpression}
                  />
                </div>
              </Card>
            ) : null}
          </div>
        );

      case 'events':
        return events.length > 0 ? (
          <div className="space-y-4 mb-8" id="section-events">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold text-foreground">Upcoming Events</h2>
            </div>
            {events.slice(0, 3).map((event) => (
              <InteractiveCard
                key={event.id}
                className="p-5"
                hoverVariant="lift"
                onInteract={() => {
                  trackLinkClick(`/event/${event.id}`, 'event');
                  navigate(`/event/${event.id}`);
                }}
              >
                <div className="flex gap-4">
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-28 h-28 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        ) : null;

      case 'meetings':
        return meetingTypes.length > 0 ? (
          <div className="space-y-4 mb-8" id="section-meetings">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold text-foreground">Book a Meeting</h2>
            </div>
            <div className="space-y-3">
              {meetingTypes.map((meeting) => (
                <InteractiveCard
                  key={meeting.id}
                  className="p-5"
                  hoverVariant="lift"
                  onInteract={() => {
                    trackLinkClick(`/book/${username}/${meeting.id}`, 'meeting');
                    navigate(`/book/${username}/${meeting.id}`);
                  }}
                >
                  <h3 className="font-semibold mb-2 text-foreground">{meeting.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {meeting.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{meeting.duration} min</span>
                    <span>•</span>
                    <span>{getLocationLabel(meeting.location_type)}</span>
                  </div>
                </InteractiveCard>
              ))}
            </div>
          </div>
        ) : null;

      case 'signup-sheets':
        return signupSheets.length > 0 ? (
          <div className="space-y-4 mb-8" id="section-signup-sheets">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold text-foreground">Sign Up Opportunities</h2>
            </div>
            {signupSheets.slice(0, 2).map((sheet) => (
              <InteractiveCard
                key={sheet.id}
                className="p-5"
                hoverVariant="lift"
                onInteract={() => {
                  trackLinkClick(`/signup-sheet/${sheet.id}`, 'signup');
                  navigate(`/signup-sheet/${sheet.id}`);
                }}
              >
                <h3 className="text-lg font-semibold mb-2 text-foreground">{sheet.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {sheet.description}
                </p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(sheet.start_date).toLocaleDateString()} - {new Date(sheet.end_date).toLocaleDateString()}
                  </span>
                  {sheet.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {sheet.location}
                    </span>
                  )}
                </div>
              </InteractiveCard>
            ))}
          </div>
        ) : null;

      case 'polls':
        return polls.length > 0 ? (
          <div className="space-y-4 mb-8" id="section-polls">
            <div className="flex items-center gap-2 mb-4">
              <Vote className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold text-foreground">Polls</h2>
            </div>
            <div className="space-y-3">
              {polls.map((poll) => (
                <InteractiveCard
                  key={poll.id}
                  className="p-5"
                  hoverVariant="lift"
                  onInteract={() => {
                    trackLinkClick(`/poll/${poll.id}`, 'poll');
                    navigate(`/poll/${poll.id}`);
                  }}
                >
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{poll.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {poll.description}
                  </p>
                  {poll.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Closes: {new Date(poll.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </InteractiveCard>
              ))}
            </div>
          </div>
        ) : null;

      case 'podcasts':
        return podcasts.length > 0 ? (
          <div className="space-y-4 mb-8" id="section-podcasts">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold text-foreground">Podcasts</h2>
            </div>
            {podcasts.map((podcast) => {
              const podcastEpisodes = episodes.filter(ep => ep.podcast_id === podcast.id);
              if (podcastEpisodes.length === 0) return null;
              
              return (
                <Card key={podcast.id} className="p-5 bg-card">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{podcast.title}</h3>
                  {podcast.description && (
                    <p className="text-sm text-muted-foreground mb-3">{podcast.description}</p>
                  )}
                  <PodcastPlayer podcast={podcast} episodes={podcastEpisodes} creatorId={profile?.id || ''} />
                </Card>
              );
            })}
          </div>
        ) : null;

      case 'custom-sections':
        const customSectionNames = Array.from(new Set(customLinks.map(link => link.section).filter(Boolean)));
        
        return customSectionNames.length > 0 ? (
          <div className="space-y-4 mb-8" id="section-custom-sections">
            {customSectionNames.map(sectionName => {
              const sectionLinks = customLinks.filter(link => link.section === sectionName);
              const isOpen = openSections.has(sectionName || "no-section");
              
              return (
                <Collapsible
                  key={sectionName}
                  open={isOpen}
                  onOpenChange={(open) => {
                    setOpenSections(prev => {
                      const newSet = new Set(prev);
                      if (open) {
                        newSet.add(sectionName || "no-section");
                      } else {
                        newSet.delete(sectionName || "no-section");
                      }
                      return newSet;
                    });
                  }}
                  className="space-y-3"
                >
                  <CollapsibleTrigger className="w-full group">
                    <Card 
                      className="p-5 transition-all duration-300 hover:shadow-xl border-2 cursor-pointer bg-card"
                      style={{ 
                        borderColor: isOpen ? profile?.theme_color : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {sectionMetadata.get(sectionName!)?.image_url ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-110">
                              <img 
                                src={sectionMetadata.get(sectionName!)?.image_url || ''} 
                                alt={sectionName!}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                              style={{ 
                                background: `linear-gradient(135deg, ${profile?.theme_color}20, ${profile?.theme_color}10)`
                              }}
                            >
                              <Link2 
                                className="h-6 w-6"
                                style={{ color: profile?.theme_color }}
                              />
                            </div>
                          )}
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-foreground">{sectionName}</h2>
                            <p className="text-sm text-muted-foreground">{sectionLinks.length} items</p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`}
                          style={{ color: profile?.theme_color }}
                        />
                      </div>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-4">
                    <div className="space-y-3">
                      {sectionLinks.map((link) => (
                        <InteractiveCard
                          key={link.id}
                          className="p-5"
                          hoverVariant="lift"
                          onInteract={() => {
                            trackLinkClick(link.url, 'custom_link');
                            window.open(link.url, '_blank');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {link.image_url && (
                              <img
                                src={link.image_url}
                                alt={link.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-1 break-words text-foreground">{link.title}</h3>
                              {link.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </InteractiveCard>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : null;

      case 'qr-code':
        return (
          <div className="flex justify-center mb-8">
            <ProfileQRCode username={profile.username} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div 
          className="min-h-screen overflow-x-hidden w-full"
          style={{ 
            backgroundColor: profile.page_background_color || '#000000'
          }}
        >
          <main className="w-full mx-auto max-w-4xl overflow-x-hidden">
            {/* Hero Section */}
            <div className="relative w-full overflow-hidden mb-6">
              <div className="relative w-full md:h-auto" style={{ backgroundColor: profile.hero_section_color || '#000000' }}>
                {profile.avatar_url && (
                  <div className="relative md:flex md:justify-center md:py-12">
                    {/* Mobile */}
                    <div className="relative md:hidden w-full h-[60vh]">
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"
                        style={{ 
                          background: `linear-gradient(to bottom, transparent 0%, transparent 40%, ${profile.hero_section_color || '#000000'}dd 100%)`
                        }}
                      />
                    </div>
                    
                    {/* Desktop */}
                    <div className="hidden md:block relative md:max-w-md md:mx-auto">
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name}
                        className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
                      />
                    </div>
                  </div>
                )}
                
                {/* Profile Info - Mobile */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 p-6 text-center">
                  <div className="flex justify-end gap-2 mb-4 absolute top-4 right-4">
                    {isOwnProfile && (
                      <Link to="/profile/edit">
                        <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white text-black border-white/20 backdrop-blur-sm">
                          <Settings className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                    )}
                    <ShareProfileButton username={profile.username} />
                  </div>

                  <h1 className="text-3xl font-bold mb-2 text-black drop-shadow-lg">
                    {profile.display_name || profile.full_name || profile.username}
                  </h1>
                  
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                      {socialLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackLinkClick(link.url, 'social')}
                          className="p-2.5 rounded-full hover:scale-110 transition-all bg-white/20 backdrop-blur-sm border border-white/30"
                          title={link.platform}
                        >
                          {getSocialIcon(link.platform, profile.social_icons_color === true)}
                        </a>
                      ))}
                    </div>
                  )}

                  {profile.bio && (
                    <p className="text-base text-black max-w-2xl mx-auto leading-relaxed drop-shadow px-4 break-words">
                      {profile.bio}
                    </p>
                  )}
                </div>
                
                {/* Profile Info - Desktop */}
                <div className="hidden md:block text-center px-8 pb-8">
                  <div className="flex justify-center gap-2 mb-6">
                    {isOwnProfile && (
                      <Link to="/profile/edit">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    <ShareProfileButton username={profile.username} />
                  </div>

                  <h1 className="text-4xl font-bold mb-4 text-foreground">
                    {profile.display_name || profile.full_name || profile.username}
                  </h1>
                  
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                      {socialLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackLinkClick(link.url, 'social')}
                          className="p-3 rounded-full hover:scale-110 transition-all border-2"
                          style={{ 
                            borderColor: profile.theme_color,
                            ...(profile.social_icons_color !== true ? { filter: 'grayscale(100%)' } : {})
                          }}
                          title={link.platform}
                        >
                          {getSocialIcon(link.platform, profile.social_icons_color === true)}
                        </a>
                      ))}
                    </div>
                  )}

                  {profile.bio && (
                    <p className="text-lg max-w-2xl mx-auto leading-relaxed break-words text-foreground">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Draggable Content Sections */}
            <div className="px-4 pb-32">
              <SortableContext items={sortedElements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                {sortedElements.map((element) => {
                  const content = renderElement(element.element_type);
                  
                  if (!content) return null;
                  
                  return (
                    <DraggableElement
                      key={element.id}
                      id={element.id}
                      isVisible={element.is_visible}
                    >
                      {content}
                    </DraggableElement>
                  );
                })}
              </SortableContext>
            </div>
            
            {/* Menu Bar */}
            {!isEditMode && (
              <ProfileMenuBar 
                counts={menuCounts}
                activeSection={activeMenuSection}
                onSectionClick={handleMenuSectionClick}
              />
            )}
          </main>
        </div>
      </DndContext>
      
      {isOwnProfile && <PageBuilderToolbar />}
    </>
  );
};

const Profile = () => {
  const { username } = useParams();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      if (!username) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (data) {
        setUserId(data.id);
      }
    };

    fetchUserId();
  }, [username]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageBuilderProvider userId={userId}>
      <ProfileContent />
    </PageBuilderProvider>
  );
};

export default Profile;
