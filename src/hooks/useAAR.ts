import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AAR, AARMedia, Stakeholder, PullQuote, SpendItem } from '@/types/aar';

const defaultAAR: Partial<AAR> = {
  event_name: '',
  event_type: 'meeting',
  is_client_facing: false,
  not_designed_for_lead_gen: false,
  key_stakeholders: [],
  pull_quotes: [],
  financial_spend: [],
  total_spend: 0,
  status: 'draft',
  visibility: 'internal',
};

export function useAAR(id?: string) {
  const [aar, setAAR] = useState<Partial<AAR>>(defaultAAR);
  const [media, setMedia] = useState<AARMedia[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id && id !== 'new') {
      fetchAAR(id);
    }
  }, [id]);

  const fetchAAR = async (aarId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('aars')
        .select('*')
        .eq('id', aarId)
        .single();

      if (error) throw error;
      
      // Parse JSONB fields properly with type casting
      const parsedData = {
        ...data,
        event_type: data.event_type as AAR['event_type'],
        status: data.status as AAR['status'],
        visibility: data.visibility as AAR['visibility'],
        key_stakeholders: (data.key_stakeholders as unknown as Stakeholder[]) || [],
        pull_quotes: (data.pull_quotes as unknown as PullQuote[]) || [],
        financial_spend: (data.financial_spend as unknown as SpendItem[]) || [],
      };
      
      setAAR(parsedData as Partial<AAR>);

      // Fetch media
      const { data: mediaData } = await supabase
        .from('aar_media')
        .select('*')
        .eq('aar_id', aarId)
        .order('display_order');

      if (mediaData) {
        const parsedMedia = mediaData.map(m => ({
          ...m,
          media_type: m.media_type as AARMedia['media_type'],
          timestamp_highlights: (m.timestamp_highlights as unknown as AARMedia['timestamp_highlights']) || [],
        })) as AARMedia[];
        setMedia(parsedMedia);
      }
    } catch (err) {
      console.error('Error fetching AAR:', err);
      toast.error('Failed to load AAR');
    } finally {
      setLoading(false);
    }
  };

  const updateField = useCallback(<K extends keyof AAR>(field: K, value: AAR[K]) => {
    setAAR(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMultiple = useCallback((updates: Partial<AAR>) => {
    setAAR(prev => ({ ...prev, ...updates }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to save');
        return null;
      }

      // Calculate derived fields
      const totalSpend = (aar.financial_spend || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      const cpl = aar.leads_generated && aar.leads_generated > 0 
        ? totalSpend / aar.leads_generated 
        : null;

      // Prepare data for Supabase - using any to bypass strict typing
      const saveData: any = {
        ...aar,
        owner_id: userData.user.id,
        total_spend: totalSpend,
        cpl,
        key_stakeholders: aar.key_stakeholders || [],
        pull_quotes: aar.pull_quotes || [],
        financial_spend: aar.financial_spend || [],
      };

      let result;
      if (id && id !== 'new') {
        const { data, error } = await supabase
          .from('aars')
          .update(saveData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('AAR saved');
      } else {
        // Generate share slug
        const shareSlug = `${aar.event_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'aar'}-${Date.now().toString(36)}`;
        saveData.share_slug = shareSlug;
        
        const { data, error } = await supabase
          .from('aars')
          .insert(saveData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('AAR created');
        navigate(`/aar/${result.id}`);
      }

      setAAR(prev => ({ ...prev, ...result }));
      return result;
    } catch (err) {
      console.error('Error saving AAR:', err);
      toast.error('Failed to save AAR');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteAAR = async () => {
    if (!id || id === 'new') return;
    
    try {
      const { error } = await supabase
        .from('aars')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('AAR deleted');
      navigate('/aar');
    } catch (err) {
      console.error('Error deleting AAR:', err);
      toast.error('Failed to delete AAR');
    }
  };

  const uploadMedia = async (file: File, section?: string) => {
    if (!id || id === 'new') {
      toast.error('Please save the AAR first');
      return null;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const ext = file.name.split('.').pop();
      const path = `${userData.user.id}/${id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('aar-media')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('aar-media')
        .getPublicUrl(path);

      const mediaType = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'document';

      const { data: mediaRecord, error: insertError } = await supabase
        .from('aar_media')
        .insert({
          aar_id: id,
          media_type: mediaType,
          storage_path: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          section,
          display_order: media.length,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const parsedRecord = {
        ...mediaRecord,
        media_type: mediaRecord.media_type as AARMedia['media_type'],
        timestamp_highlights: (mediaRecord.timestamp_highlights as unknown as AARMedia['timestamp_highlights']) || [],
      } as AARMedia;

      setMedia(prev => [...prev, parsedRecord]);
      toast.success('Media uploaded');
      return mediaRecord;
    } catch (err) {
      console.error('Error uploading media:', err);
      toast.error('Failed to upload media');
      return null;
    }
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('aar_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;
      setMedia(prev => prev.filter(m => m.id !== mediaId));
      toast.success('Media deleted');
    } catch (err) {
      console.error('Error deleting media:', err);
      toast.error('Failed to delete media');
    }
  };

  // Calculate completion percentage
  const completionSections = {
    metadata: !!(aar.event_name && aar.event_type && aar.event_date_start),
    executive: !!aar.executive_summary,
    purpose: !!(aar.event_purpose || (aar.strategic_objectives?.length || 0) > 0),
    stakeholders: !!(aar.attendance_estimate || (aar.key_stakeholders?.length || 0) > 0),
    wins: !!(aar.wins_community_impact || aar.wins_relationship_building || aar.wins_business_support),
    metrics: !!((aar.financial_spend?.length || 0) > 0 || aar.attendance_count),
    recommendations: !!((aar.recommendations_repeat?.length || 0) > 0 || (aar.recommendations_improve?.length || 0) > 0),
    assessment: !!aar.final_assessment,
  };

  const completionPercentage = Math.round(
    (Object.values(completionSections).filter(Boolean).length / Object.keys(completionSections).length) * 100
  );

  return {
    aar,
    media,
    loading,
    saving,
    updateField,
    updateMultiple,
    save,
    deleteAAR,
    uploadMedia,
    deleteMedia,
    completionSections,
    completionPercentage,
  };
}
