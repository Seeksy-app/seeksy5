// Custom database types for user's existing Supabase project
// This bypasses the auto-generated types which are empty for Lovable Cloud

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action_type: string
          action_description: string
          related_entity_type: string | null
          related_entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          action_description: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          action_description?: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          id: string
          name: string
          status: string
          cpm_bid: number
          total_budget: number
          total_spent: number | null
          total_impressions: number | null
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          status?: string
          cpm_bid: number
          total_budget: number
          total_spent?: number | null
          total_impressions?: number | null
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          status?: string
          cpm_bid?: number
          total_budget?: number
          total_spent?: number | null
          total_impressions?: number | null
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      podcast_campaign_selections: {
        Row: {
          id: string
          podcast_id: string
          campaign_id: string
          created_at: string
        }
        Insert: {
          id?: string
          podcast_id: string
          campaign_id: string
          created_at?: string
        }
        Update: {
          id?: string
          podcast_id?: string
          campaign_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_template_folders: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      saved_email_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          html_content: string
          folder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject: string
          html_content: string
          folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string
          html_content?: string
          folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string | null
          email: string | null
          phone: string | null
          company: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string | null
          end_time: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          cover_image_url: string | null
          rss_url: string | null
          minimum_cpm: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          rss_url?: string | null
          minimum_cpm?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          rss_url?: string | null
          minimum_cpm?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clips: {
        Row: {
          id: string
          user_id: string
          title: string | null
          description: string | null
          video_url: string | null
          thumbnail_url: string | null
          duration: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          content: string | null
          excerpt: string | null
          seo_title: string | null
          seo_description: string | null
          status: string
          is_ai_generated: boolean | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          content?: string | null
          excerpt?: string | null
          seo_title?: string | null
          seo_description?: string | null
          status?: string
          is_ai_generated?: boolean | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          content?: string | null
          excerpt?: string | null
          seo_title?: string | null
          seo_description?: string | null
          status?: string
          is_ai_generated?: boolean | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          user_id: string | null
          ticket_number: string
          title: string
          description: string | null
          status: string
          priority: string
          category: string | null
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          ticket_number?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          category?: string | null
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          ticket_number?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          category?: string | null
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_date: string | null
          end_date: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          module_events_enabled: boolean | null
          module_signup_sheets_enabled: boolean | null
          module_polls_enabled: boolean | null
          module_qr_codes_enabled: boolean | null
          module_awards_enabled: boolean | null
          module_media_enabled: boolean | null
          module_civic_enabled: boolean | null
          module_advertiser_enabled: boolean | null
          module_team_chat_enabled: boolean | null
          module_marketing_enabled: boolean | null
          module_sms_enabled: boolean | null
          my_page_enabled: boolean | null
          ai_assistant_enabled: boolean | null
          meetings_enabled: boolean | null
          contacts_enabled: boolean | null
          podcasts_enabled: boolean | null
          sms_meeting_confirmations: boolean | null
          sms_event_registrations: boolean | null
          sms_ticket_assignments: boolean | null
          sms_meeting_reminders: boolean | null
          sms_maintenance_alerts: boolean | null
          sms_feature_updates: boolean | null
          sms_follower_requests: boolean | null
          sms_new_account_alerts: boolean | null
          my_page_video_type: string | null
          my_page_video_id: string | null
          my_page_video_loop: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_events_enabled?: boolean | null
          module_signup_sheets_enabled?: boolean | null
          module_polls_enabled?: boolean | null
          module_qr_codes_enabled?: boolean | null
          module_awards_enabled?: boolean | null
          module_media_enabled?: boolean | null
          module_civic_enabled?: boolean | null
          module_advertiser_enabled?: boolean | null
          module_team_chat_enabled?: boolean | null
          module_marketing_enabled?: boolean | null
          module_sms_enabled?: boolean | null
          my_page_enabled?: boolean | null
          ai_assistant_enabled?: boolean | null
          meetings_enabled?: boolean | null
          contacts_enabled?: boolean | null
          podcasts_enabled?: boolean | null
          sms_meeting_confirmations?: boolean | null
          sms_event_registrations?: boolean | null
          sms_ticket_assignments?: boolean | null
          sms_meeting_reminders?: boolean | null
          sms_maintenance_alerts?: boolean | null
          sms_feature_updates?: boolean | null
          sms_follower_requests?: boolean | null
          sms_new_account_alerts?: boolean | null
          my_page_video_type?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_events_enabled?: boolean | null
          module_signup_sheets_enabled?: boolean | null
          module_polls_enabled?: boolean | null
          module_qr_codes_enabled?: boolean | null
          module_awards_enabled?: boolean | null
          module_media_enabled?: boolean | null
          module_civic_enabled?: boolean | null
          module_advertiser_enabled?: boolean | null
          module_team_chat_enabled?: boolean | null
          module_marketing_enabled?: boolean | null
          module_sms_enabled?: boolean | null
          my_page_enabled?: boolean | null
          ai_assistant_enabled?: boolean | null
          meetings_enabled?: boolean | null
          contacts_enabled?: boolean | null
          podcasts_enabled?: boolean | null
          sms_meeting_confirmations?: boolean | null
          sms_event_registrations?: boolean | null
          sms_ticket_assignments?: boolean | null
          sms_meeting_reminders?: boolean | null
          sms_maintenance_alerts?: boolean | null
          sms_feature_updates?: boolean | null
          sms_follower_requests?: boolean | null
          sms_new_account_alerts?: boolean | null
          my_page_video_type?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_slots: {
        Row: {
          id: string
          podcast_id: string
          slot_type: string
          start_time: number | null
          end_time: number | null
          created_at: string
        }
        Insert: {
          id?: string
          podcast_id: string
          slot_type: string
          start_time?: number | null
          end_time?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          podcast_id?: string
          slot_type?: string
          start_time?: number | null
          end_time?: number | null
          created_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          account_type: string | null
          active_account_type: string | null
          account_types_enabled: string[] | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          is_creator: boolean | null
          is_advertiser: boolean | null
          preferred_role: string | null
          my_page_video_type: string | null
          my_page_video_id: string | null
          my_page_video_loop: boolean | null
          account_full_name: string | null
          account_avatar_url: string | null
          advertiser_onboarding_completed: boolean | null
          username: string | null
          bio: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          account_type?: string | null
          active_account_type?: string | null
          account_types_enabled?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          is_creator?: boolean | null
          is_advertiser?: boolean | null
          preferred_role?: string | null
          my_page_video_type?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          account_full_name?: string | null
          account_avatar_url?: string | null
          advertiser_onboarding_completed?: boolean | null
          username?: string | null
          bio?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          account_type?: string | null
          active_account_type?: string | null
          account_types_enabled?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          is_creator?: boolean | null
          is_advertiser?: boolean | null
          preferred_role?: string | null
          my_page_video_type?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          account_full_name?: string | null
          account_avatar_url?: string | null
          advertiser_onboarding_completed?: boolean | null
          username?: string | null
          bio?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'moderator' | 'user' | 'super_admin' | 'advertiser'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'moderator' | 'user' | 'super_admin' | 'advertiser'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'user' | 'super_admin' | 'advertiser'
          created_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: Json | null
          data_mode: string | null
          holiday_mode: boolean | null
          holiday_snow: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          data_mode?: string | null
          holiday_mode?: boolean | null
          holiday_snow?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          data_mode?: string | null
          holiday_mode?: boolean | null
          holiday_snow?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seeksyai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      seeksyai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      theme_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          id: string
          user_id: string
          feature_type: string
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature_type: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature_type?: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_media_accounts: {
        Row: {
          id: string
          user_id: string
          platform: string
          account_name: string | null
          account_id: string | null
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          account_name?: string | null
          account_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          account_name?: string | null
          account_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          id: string
          user_id: string | null
          file_name: string
          file_url: string
          file_type: string | null
          file_size: number | null
          duration_seconds: number | null
          thumbnail_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          file_name: string
          file_url: string
          file_type?: string | null
          file_size?: number | null
          duration_seconds?: number | null
          thumbnail_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          file_name?: string
          file_url?: string
          file_type?: string | null
          file_size?: number | null
          duration_seconds?: number | null
          thumbnail_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          id: string
          user_id: string | null
          job_type: string
          status: string
          input_data: Json | null
          output_data: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          job_type: string
          status?: string
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          job_type?: string
          status?: string
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      advertisers: {
        Row: {
          id: string
          user_id: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          website: string | null
          website_url: string | null
          industry: string | null
          budget: number | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          website_url?: string | null
          industry?: string | null
          budget?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          website_url?: string | null
          industry?: string | null
          budget?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      advertiser_transactions: {
        Row: {
          id: string
          advertiser_id: string | null
          amount: number
          transaction_type: string
          description: string | null
          reference_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          advertiser_id?: string | null
          amount: number
          transaction_type: string
          description?: string | null
          reference_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          advertiser_id?: string | null
          amount?: number
          transaction_type?: string
          description?: string | null
          reference_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      audio_ads: {
        Row: {
          id: string
          user_id: string | null
          campaign_name: string
          script: string | null
          audio_url: string | null
          duration_seconds: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          campaign_name: string
          script?: string | null
          audio_url?: string | null
          duration_seconds?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          campaign_name?: string
          script?: string | null
          audio_url?: string | null
          duration_seconds?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      aar_media: {
        Row: {
          id: string
          user_id: string | null
          file_url: string
          file_type: string | null
          caption: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          file_url: string
          file_type?: string | null
          caption?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          file_url?: string
          file_type?: string | null
          caption?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      email_folders: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          name: string
          subject: string
          html_content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          name: string
          subject: string
          html_content: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          name?: string
          subject?: string
          html_content?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_packages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          price: number | null
          features: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          price?: number | null
          features?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          price?: number | null
          features?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          id: string
          user_id: string
          module_name: string
          is_enabled: boolean | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          module_name: string
          is_enabled?: boolean | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          module_name?: string
          is_enabled?: boolean | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_feature_usage: {
        Args: {
          _user_id: string
          _feature_type: string
          _increment: number
        }
        Returns: void
      }
    }
    Enums: {
      app_role: 'admin' | 'moderator' | 'user' | 'super_admin' | 'advertiser'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
