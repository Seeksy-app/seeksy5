import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMyPageVideo = (profile: any) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'own' | 'ad' | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!profile?.my_page_video_type) {
        setVideoUrl(null);
        return;
      }

      if (profile.my_page_video_type === 'own' && profile.my_page_video_id) {
        const { data } = await supabase
          .from('media_files')
          .select('file_url')
          .eq('id', profile.my_page_video_id)
          .single();
        
        setVideoUrl(data?.file_url || null);
        setVideoType('own');
      } else if (profile.my_page_video_type === 'ad' && profile.my_page_ad_id) {
        // Fetch from audio_ads table (which contains video ads too)
        const { data } = await supabase
          .from('audio_ads')
          .select('audio_url')
          .eq('id', profile.my_page_ad_id)
          .single();
        
        setVideoUrl(data?.audio_url || null);
        setVideoType('ad');
      }
    };

    fetchVideo();
  }, [profile?.my_page_video_type, profile?.my_page_video_id, profile?.my_page_ad_id]);

  const trackImpression = async () => {
    if (!profile || !videoType) return;

    const videoId = videoType === 'ad' ? profile.my_page_ad_id : profile.my_page_video_id;
    if (!videoId) return;

    await supabase.functions.invoke('track-my-page-video-impression', {
      body: {
        profileId: profile.id,
        videoType,
        videoId,
      },
    });
  };

  return { videoUrl, videoType, trackImpression, shouldLoop: profile?.my_page_video_loop !== false };
};