export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aar_media: {
        Row: {
          caption: string | null
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          advertiser_id: string | null
          cpm_bid: number | null
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          targeting: Json | null
          total_budget: number | null
          total_impressions: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id?: string | null
          cpm_bid?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          targeting?: Json | null
          total_budget?: number | null
          total_impressions?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string | null
          cpm_bid?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          targeting?: Json | null
          total_budget?: number | null
          total_impressions?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          audio_ad_id: string | null
          campaign_id: string | null
          created_at: string | null
          creative_type: string | null
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          audio_ad_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          creative_type?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_ad_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          creative_type?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_slot_id: string | null
          campaign_id: string | null
          completed: boolean | null
          created_at: string | null
          creator_id: string | null
          duration_listened: number | null
          episode_id: string | null
          id: string
          impression_type: string | null
          listener_id: string | null
          podcast_id: string | null
        }
        Insert: {
          ad_slot_id?: string | null
          campaign_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          duration_listened?: number | null
          episode_id?: string | null
          id?: string
          impression_type?: string | null
          listener_id?: string | null
          podcast_id?: string | null
        }
        Update: {
          ad_slot_id?: string | null
          campaign_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          duration_listened?: number | null
          episode_id?: string | null
          id?: string
          impression_type?: string | null
          listener_id?: string | null
          podcast_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_slot_id_fkey"
            columns: ["ad_slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          assigned_campaign_id: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          end_time: number | null
          episode_id: string | null
          id: string
          manual_audio_url: string | null
          podcast_id: string | null
          position_seconds: number | null
          slot_type: string
          start_time: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_campaign_id?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          end_time?: number | null
          episode_id?: string | null
          id?: string
          manual_audio_url?: string | null
          podcast_id?: string | null
          position_seconds?: number | null
          slot_type: string
          start_time?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_campaign_id?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          end_time?: number | null
          episode_id?: string | null
          id?: string
          manual_audio_url?: string | null
          podcast_id?: string | null
          position_seconds?: number | null
          slot_type?: string
          start_time?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_slots_assigned_campaign_id_fkey"
            columns: ["assigned_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_slots_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_slots_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_transactions: {
        Row: {
          advertiser_id: string | null
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          advertiser_id?: string | null
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          advertiser_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_transactions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisers: {
        Row: {
          budget: number | null
          business_description: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          industry: string | null
          notes: string | null
          owner_profile_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          budget?: number | null
          business_description?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          owner_profile_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          budget?: number | null
          business_description?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          owner_profile_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ai_edit_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          job_id: string | null
          metadata: Json | null
          timestamp_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          timestamp_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          timestamp_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_edit_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_edited_assets: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          metadata: Json | null
          output_type: string | null
          storage_path: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          output_type?: string | null
          storage_path?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          output_type?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_edited_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          source_media_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          source_media_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          source_media_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_audio_descriptions: {
        Row: {
          app_id: string
          app_name: string
          audio_url: string | null
          avatar_url: string | null
          created_at: string | null
          id: string
          script: string | null
          updated_at: string | null
          voice_id: string | null
        }
        Insert: {
          app_id: string
          app_name: string
          audio_url?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          script?: string | null
          updated_at?: string | null
          voice_id?: string | null
        }
        Update: {
          app_id?: string
          app_name?: string
          audio_url?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          script?: string | null
          updated_at?: string | null
          voice_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          data_mode: string | null
          holiday_mode: boolean | null
          holiday_snow: boolean | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          data_mode?: string | null
          holiday_mode?: boolean | null
          holiday_snow?: boolean | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          data_mode?: string | null
          holiday_mode?: boolean | null
          holiday_snow?: boolean | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      audio_ads: {
        Row: {
          ad_type: string | null
          advertiser_id: string | null
          audio_url: string | null
          campaign_id: string | null
          campaign_name: string
          conversation_config: Json | null
          created_at: string | null
          duration_seconds: number | null
          elevenlabs_agent_id: string | null
          id: string
          phone_number: string | null
          phone_number_type: string | null
          script: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          voice_id: string | null
          voice_name: string | null
        }
        Insert: {
          ad_type?: string | null
          advertiser_id?: string | null
          audio_url?: string | null
          campaign_id?: string | null
          campaign_name: string
          conversation_config?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          elevenlabs_agent_id?: string | null
          id?: string
          phone_number?: string | null
          phone_number_type?: string | null
          script?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_id?: string | null
          voice_name?: string | null
        }
        Update: {
          ad_type?: string | null
          advertiser_id?: string | null
          audio_url?: string | null
          campaign_id?: string | null
          campaign_name?: string
          conversation_config?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          elevenlabs_agent_id?: string | null
          id?: string
          phone_number?: string | null
          phone_number_type?: string | null
          script?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_id?: string | null
          voice_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_ads_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_packages: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      email_template_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          folder_id: string | null
          html_content: string
          id: string
          name: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          html_content: string
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          html_content?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean | null
          podcast_id: string | null
          publish_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean | null
          podcast_id?: string | null
          publish_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean | null
          podcast_id?: string | null
          publish_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          rss_feed_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          rss_feed_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          rss_feed_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_avatar_url: string | null
          account_full_name: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          account_types_enabled: string[] | null
          active_account_type:
            | Database["public"]["Enums"]["account_type"]
            | null
          advertiser_onboarding_completed: boolean | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_advertiser: boolean | null
          is_creator: boolean | null
          my_page_ad_id: string | null
          my_page_cta_button_text: string | null
          my_page_cta_phone_number: string | null
          my_page_cta_text_keyword: string | null
          my_page_video_id: string | null
          my_page_video_loop: boolean | null
          my_page_video_type: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          preferred_role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          account_avatar_url?: string | null
          account_full_name?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          account_types_enabled?: string[] | null
          active_account_type?:
            | Database["public"]["Enums"]["account_type"]
            | null
          advertiser_onboarding_completed?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_advertiser?: boolean | null
          is_creator?: boolean | null
          my_page_ad_id?: string | null
          my_page_cta_button_text?: string | null
          my_page_cta_phone_number?: string | null
          my_page_cta_text_keyword?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          my_page_video_type?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          preferred_role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          account_avatar_url?: string | null
          account_full_name?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          account_types_enabled?: string[] | null
          active_account_type?:
            | Database["public"]["Enums"]["account_type"]
            | null
          advertiser_onboarding_completed?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_advertiser?: boolean | null
          is_creator?: boolean | null
          my_page_ad_id?: string | null
          my_page_cta_button_text?: string | null
          my_page_cta_phone_number?: string | null
          my_page_cta_text_keyword?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          my_page_video_type?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          preferred_role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      saved_email_templates: {
        Row: {
          created_at: string | null
          customization_data: Json | null
          customized_html: string | null
          folder_id: string | null
          id: string
          name: string
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customization_data?: Json | null
          customized_html?: string | null
          folder_id?: string | null
          id?: string
          name: string
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customization_data?: Json | null
          customized_html?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_email_templates_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_template_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          ticket_number: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          ticket_number?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          ticket_number?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          total_earned: number | null
          total_purchased: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earned?: number | null
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earned?: number | null
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_name: string
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          notifications_enabled: boolean | null
          preferences: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _feature_type: string; _increment: number; _user_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_type:
        | "creator"
        | "advertiser"
        | "agency"
        | "podcaster"
        | "event_planner"
        | "brand"
        | "studio_team"
        | "admin"
        | "influencer"
      app_role:
        | "super_admin"
        | "admin"
        | "support_admin"
        | "support_agent"
        | "creator"
        | "advertiser"
        | "influencer"
        | "agency"
        | "subscriber"
        | "board_member"
        | "board_admin"
        | "read_only_analyst"
        | "team_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: [
        "creator",
        "advertiser",
        "agency",
        "podcaster",
        "event_planner",
        "brand",
        "studio_team",
        "admin",
        "influencer",
      ],
      app_role: [
        "super_admin",
        "admin",
        "support_admin",
        "support_agent",
        "creator",
        "advertiser",
        "influencer",
        "agency",
        "subscriber",
        "board_member",
        "board_admin",
        "read_only_analyst",
        "team_manager",
      ],
    },
  },
} as const
