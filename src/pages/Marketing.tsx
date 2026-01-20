import { useState } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Mail, 
  ShoppingCart, 
  Gift, 
  Calendar, 
  TrendingUp,
  Users,
  Sparkles,
  Heart,
  Zap,
  Star,
  Megaphone,
  FileText,
  Clock,
  Eye,
  Send,
  Briefcase,
  DollarSign,
  MessageCircle
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmailTemplateCustomizer } from "@/components/EmailTemplateCustomizer";
import { EmailTemplateFullScreenEditor } from "@/components/EmailTemplateFullScreenEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Folder as FolderIcon, Trash2, Edit2 } from "lucide-react";

type TemplateCategory = 'all' | 'daily' | 'welcome' | 'promotional' | 'transactional' | 'newsletter' | 'event' | 'ecommerce' | 'reengagement';

interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  thumbnail: string;
  icon: any;
  previewHtml: string;
  isPremium?: boolean;
}

const Marketing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [fullScreenEditorOpen, setFullScreenEditorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'templates' | 'saved'>('templates');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: savedTemplates } = useQuery({
    queryKey: ["saved-email-templates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_email_templates")
        .select("*, email_template_folders(name, color)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: folders } = useQuery({
    queryKey: ["email-template-folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("email_template_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false});
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const categories = [
    { id: 'all', label: 'All Templates', icon: Sparkles, count: 32 },
    { id: 'daily', label: 'Daily Business', icon: Briefcase, count: 8 },
    { id: 'welcome', label: 'Welcome & Onboarding', icon: Users, count: 4 },
    { id: 'promotional', label: 'Promotional', icon: Megaphone, count: 6 },
    { id: 'transactional', label: 'Transactional', icon: FileText, count: 5 },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, count: 3 },
    { id: 'event', label: 'Events', icon: Calendar, count: 2 },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, count: 3 },
    { id: 'reengagement', label: 'Re-engagement', icon: Zap, count: 1 },
  ];

  const templates: EmailTemplate[] = [
    // Daily Business Templates
    {
      id: 'daily-proposal',
      name: 'Business Proposal',
      category: 'daily',
      description: 'Professional proposal email with logo and signature',
      thumbnail: 'bg-gradient-to-br from-slate-700 to-slate-900',
      icon: FileText,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(207, 90%, 54%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(207, 90%, 54%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Dear {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for considering our services. Attached is our proposal for {{project.NAME}} which outlines our approach, timeline, and investment details.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Key highlights of our proposal:
            </p>
            <ul style="font-size: 16px; color: #4a5568; line-height: 1.8; margin: 0 0 24px 0;">
              <li>Comprehensive strategy tailored to your goals</li>
              <li>Clear timeline with milestones</li>
              <li>Transparent pricing structure</li>
            </ul>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              I'm available to discuss any questions you may have. Would you be available for a call this week?
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Best regards,</p>
            <div style="border-left: 3px solid hsl(207, 90%, 54%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
              <p style="font-size: 14px; color: hsl(207, 90%, 54%); margin: 0;">{{company.WEBSITE}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-followup',
      name: 'Follow-Up',
      category: 'daily',
      description: 'Professional follow-up email for meetings or proposals',
      thumbnail: 'bg-gradient-to-br from-blue-600 to-cyan-600',
      icon: Clock,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(207, 90%, 54%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(207, 90%, 54%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Hi {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              I wanted to follow up on our conversation last {{meeting.DAY}}. It was great discussing {{topic.NAME}} with you.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              As promised, I've prepared the information we discussed. Please find it attached.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              What are your thoughts on the next steps? I'd be happy to schedule another call at your convenience.
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Looking forward to hearing from you,</p>
            <div style="border-left: 3px solid hsl(207, 90%, 54%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-reminder',
      name: 'Meeting Reminder',
      category: 'daily',
      description: 'Friendly reminder for upcoming meetings',
      thumbnail: 'bg-gradient-to-br from-green-600 to-emerald-600',
      icon: Calendar,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(142, 71%, 45%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(142, 71%, 45%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Hi {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              This is a friendly reminder about our upcoming meeting:
            </p>
            <div style="background: #f7fafc; border-left: 4px solid hsl(142, 71%, 45%); padding: 20px; margin: 24px 0; border-radius: 4px;">
              <p style="font-size: 18px; font-weight: 600; color: #2d3748; margin: 0 0 12px 0;">{{meeting.TITLE}}</p>
              <p style="font-size: 15px; color: #4a5568; margin: 0 0 8px 0;">📅 {{meeting.DATE}} at {{meeting.TIME}}</p>
              <p style="font-size: 15px; color: #4a5568; margin: 0;">📍 {{meeting.LOCATION}}</p>
            </div>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Looking forward to our discussion!
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Best,</p>
            <div style="border-left: 3px solid hsl(142, 71%, 45%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-introduction',
      name: 'Introduction Email',
      category: 'daily',
      description: 'Professional introduction to new contacts',
      thumbnail: 'bg-gradient-to-br from-purple-600 to-indigo-600',
      icon: Users,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(262, 83%, 58%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(262, 83%, 58%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Hello {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              I hope this email finds you well. My name is {{sender.NAME}}, and I'm {{sender.TITLE}} at {{company.NAME}}.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              I came across your profile and was impressed by your work in {{industry.NAME}}. I believe there could be valuable synergies between our companies.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Would you be open to a brief call to explore potential collaboration opportunities?
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Best regards,</p>
            <div style="border-left: 3px solid hsl(262, 83%, 58%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
              <p style="font-size: 14px; color: hsl(262, 83%, 58%); margin: 0;">{{company.WEBSITE}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-thankyou',
      name: 'Thank You Note',
      category: 'daily',
      description: 'Genuine thank you email for clients',
      thumbnail: 'bg-gradient-to-br from-pink-600 to-rose-600',
      icon: Heart,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(346, 77%, 50%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(346, 77%, 50%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Dear {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              I wanted to take a moment to personally thank you for choosing {{company.NAME}}.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Your trust and partnership mean the world to us. We're committed to delivering exceptional results and exceeding your expectations.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              If there's anything we can do to enhance your experience, please don't hesitate to reach out.
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">With gratitude,</p>
            <div style="border-left: 3px solid hsl(346, 77%, 50%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-status',
      name: 'Status Update',
      category: 'daily',
      description: 'Project status update for clients',
      thumbnail: 'bg-gradient-to-br from-amber-600 to-orange-600',
      icon: TrendingUp,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(38, 92%, 50%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(38, 92%, 50%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Hi {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Here's your weekly update on {{project.NAME}}:
            </p>
            <div style="background: #fffbeb; border-left: 4px solid hsl(38, 92%, 50%); padding: 20px; margin: 24px 0; border-radius: 4px;">
              <p style="font-size: 16px; font-weight: 600; color: #78350f; margin: 0 0 12px 0;">✅ Completed This Week:</p>
              <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #92400e; line-height: 1.8;">
                <li>{{task.COMPLETED_1}}</li>
                <li>{{task.COMPLETED_2}}</li>
              </ul>
              <p style="font-size: 16px; font-weight: 600; color: #78350f; margin: 0 0 12px 0;">🚀 Next Steps:</p>
              <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.8;">
                <li>{{task.NEXT_1}}</li>
                <li>{{task.NEXT_2}}</li>
              </ul>
            </div>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              We're on track to meet our deadline. Let me know if you have any questions!
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Best,</p>
            <div style="border-left: 3px solid hsl(38, 92%, 50%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-invoice',
      name: 'Invoice Reminder',
      category: 'daily',
      description: 'Polite invoice payment reminder',
      thumbnail: 'bg-gradient-to-br from-teal-600 to-cyan-600',
      icon: DollarSign,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(173, 58%, 39%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(173, 58%, 39%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Dear {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              This is a friendly reminder that invoice {{invoice.NUMBER}} for {{project.NAME}} is due on {{invoice.DUE_DATE}}.
            </p>
            <div style="background: #ecfdf5; border-left: 4px solid hsl(173, 58%, 39%); padding: 20px; margin: 24px 0; border-radius: 4px;">
              <p style="font-size: 15px; color: #065f46; margin: 0 0 8px 0;"><strong>Invoice #:</strong> {{invoice.NUMBER}}</p>
              <p style="font-size: 15px; color: #065f46; margin: 0 0 8px 0;"><strong>Amount:</strong> {{invoice.AMOUNT}}</p>
              <p style="font-size: 15px; color: #065f46; margin: 0;"><strong>Due Date:</strong> {{invoice.DUE_DATE}}</p>
            </div>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Please find the invoice attached. If you have any questions or concerns, I'm here to help.
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Thank you,</p>
            <div style="border-left: 3px solid hsl(173, 58%, 39%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'daily-check-in',
      name: 'Client Check-in',
      category: 'daily',
      description: 'Casual check-in with clients',
      thumbnail: 'bg-gradient-to-br from-indigo-600 to-blue-600',
      icon: MessageCircle,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 30px 40px; border-bottom: 3px solid hsl(231, 48%, 48%);">
            <div style="font-size: 24px; font-weight: 700; color: hsl(231, 48%, 48%);">{{company.LOGO}}</div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">Hi {{contact.FIRSTNAME}},</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              I hope you're doing well! I wanted to check in and see how things are going with {{project.NAME}}.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Do you have any feedback or questions about the work we've delivered so far? I'm always here to help ensure everything meets your expectations.
            </p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.6; margin: 0 0 24px 0;">
              Looking forward to hearing from you!
            </p>
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 8px 0;">Cheers,</p>
            <div style="border-left: 3px solid hsl(231, 48%, 48%); padding-left: 16px; margin: 24px 0 0 0;">
              <p style="font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 4px 0;">{{sender.NAME}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0 0 4px 0;">{{sender.TITLE}}</p>
              <p style="font-size: 14px; color: #718096; margin: 0;">{{sender.PHONE}} | {{sender.EMAIL}}</p>
            </div>
          </div>
        </div>
      `
    },
    
    // Welcome & Onboarding
    {
      id: 'welcome-modern',
      name: 'Modern Welcome',
      category: 'welcome',
      description: 'Clean and modern welcome email with hero image and clear CTA',
      thumbnail: 'bg-gradient-to-br from-blue-500 to-purple-600',
      icon: Users,
      isPremium: true,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; font-size: 32px; margin: 0 0 16px 0; font-weight: 700;">Welcome to Seeksy! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;">We're thrilled to have you here</p>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0 0 24px 0;">
              Hi {{contact.FIRSTNAME}},<br><br>
              Thank you for joining Seeksy! You're now part of a community that's revolutionizing the way creators connect with their audience.
            </p>
            <div style="background: #f7fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px;">Quick Start Guide:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4a5568; line-height: 1.8;">
                <li>Complete your profile</li>
                <li>Connect your social accounts</li>
                <li>Create your first campaign</li>
                <li>Explore our template library</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                Get Started
              </a>
            </div>
            <p style="font-size: 14px; color: #718096; margin: 32px 0 0 0; text-align: center;">
              Need help? <a href="{{support_url}}" style="color: #667eea; text-decoration: none;">Contact our support team</a>
            </p>
          </div>
        </div>
      `
    },
    {
      id: 'welcome-minimal',
      name: 'Minimal Welcome',
      category: 'welcome',
      description: 'Simple, elegant welcome message focused on clarity',
      thumbnail: 'bg-gradient-to-br from-gray-800 to-gray-900',
      icon: Sparkles,
      previewHtml: `
        <div style="max-width: 500px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 60px 20px;">
          <h1 style="font-size: 42px; font-weight: 700; margin: 0 0 16px 0; color: #1a202c; text-align: center;">Welcome</h1>
          <p style="font-size: 18px; color: #718096; text-align: center; margin: 0 0 40px 0;">
            We're excited to have you on board, {{contact.FIRSTNAME}}
          </p>
          <div style="background: #1a202c; color: white; padding: 40px; border-radius: 12px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Your account is ready. Let's build something amazing together.
            </p>
            <a href="{{dashboard_url}}" style="display: inline-block; background: white; color: #1a202c; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 8px 0;">
              Open Dashboard
            </a>
          </div>
        </div>
      `
    },
    
    // Promotional
    {
      id: 'promo-sale',
      name: 'Flash Sale',
      category: 'promotional',
      description: 'Eye-catching promotional email for limited-time offers',
      thumbnail: 'bg-gradient-to-br from-red-500 to-pink-600',
      icon: TrendingUp,
      isPremium: true,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
            <span style="background: white; color: #f5576c; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; display: inline-block;">
              ⚡ FLASH SALE
            </span>
          </div>
          <div style="background: white; padding: 40px;">
            <h1 style="font-size: 42px; font-weight: 800; margin: 0 0 16px 0; color: #1a202c; text-align: center;">
              50% OFF<br/>Everything
            </h1>
            <p style="font-size: 18px; color: #4a5568; text-align: center; margin: 0 0 32px 0;">
              Limited time only • Ends in 24 hours
            </p>
            <div style="background: #fef5e7; border-left: 4px solid #f5576c; padding: 20px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; color: #744210; font-size: 15px;">
                <strong>Exclusive for {{contact.FIRSTNAME}}:</strong> Use code <span style="background: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: 700;">FLASH50</span> at checkout
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                Shop Now →
              </a>
            </div>
            <p style="font-size: 13px; color: #a0aec0; text-align: center; margin: 24px 0 0 0;">
              *Offer expires {{params.EXPIRY_DATE}}. Terms and conditions apply.
            </p>
          </div>
        </div>
      `
    },
    {
      id: 'promo-product-launch',
      name: 'Product Launch',
      category: 'promotional',
      description: 'Stunning product announcement template with imagery',
      thumbnail: 'bg-gradient-to-br from-indigo-600 to-blue-500',
      icon: Gift,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: white;">
              <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Introducing</span>
              <h1 style="font-size: 52px; font-weight: 800; margin: 16px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                {{params.PRODUCT_NAME}}
              </h1>
            </div>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 20px; line-height: 1.6; color: #2d3748; margin: 0 0 24px 0;">
              We're excited to announce our latest innovation designed to transform how you {{params.BENEFIT}}.
            </p>
            <div style="background: #f7fafc; padding: 32px; border-radius: 12px; margin: 24px 0;">
              <h3 style="margin: 0 0 20px 0; color: #2d3748; font-size: 22px;">Key Features:</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-size: 16px;">✓ Feature one that solves problem</li>
                <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-size: 16px;">✓ Feature two for better results</li>
                <li style="padding: 12px 0; color: #4a5568; font-size: 16px;">✓ Feature three that saves time</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{product_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px;">
                Learn More
              </a>
            </div>
          </div>
        </div>
      `
    },
    
    // Transactional
    {
      id: 'trans-receipt',
      name: 'Order Receipt',
      category: 'transactional',
      description: 'Professional order confirmation with tracking',
      thumbnail: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: FileText,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 40px; border-bottom: 3px solid #10b981;">
            <h1 style="margin: 0 0 8px 0; color: #1a202c; font-size: 28px;">Order Confirmed</h1>
            <p style="margin: 0; color: #718096; font-size: 16px;">Order #{{params.ORDER_ID}}</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 24px 0;">
              Hi {{contact.FIRSTNAME}},<br><br>
              Thank you for your order! We're preparing your items for shipment.
            </p>
            <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #065f46; font-weight: 600;">Expected Delivery:</span>
                <span style="color: #065f46;">{{params.DELIVERY_DATE}}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #065f46; font-weight: 600;">Tracking Number:</span>
                <span style="color: #065f46; font-family: monospace;">{{params.TRACKING}}</span>
              </div>
            </div>
            <h3 style="margin: 32px 0 16px 0; color: #2d3748; font-size: 18px;">Order Summary</h3>
            <div style="border-top: 1px solid #e2e8f0; padding: 16px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #4a5568;">Subtotal:</span>
                <span style="color: #2d3748; font-weight: 600;">{{params.SUBTOTAL}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #4a5568;">Shipping:</span>
                <span style="color: #2d3748; font-weight: 600;">{{params.SHIPPING}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #e2e8f0;">
                <span style="color: #1a202c; font-weight: 700; font-size: 18px;">Total:</span>
                <span style="color: #1a202c; font-weight: 700; font-size: 18px;">{{params.TOTAL}}</span>
              </div>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{tracking_url}}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Track Your Order
              </a>
            </div>
          </div>
        </div>
      `
    },
    
    // Newsletter
    {
      id: 'newsletter-modern',
      name: 'Modern Newsletter',
      category: 'newsletter',
      description: 'Multi-section newsletter with featured content',
      thumbnail: 'bg-gradient-to-br from-orange-500 to-yellow-500',
      icon: Mail,
      isPremium: true,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7fafc;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; font-size: 32px; margin: 0; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              {{params.NEWSLETTER_NAME}}
            </h1>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px;">
              {{params.ISSUE_DATE}} • Issue #{{params.ISSUE_NUMBER}}
            </p>
          </div>
          <div style="background: white; padding: 40px; margin: 24px 0;">
            <h2 style="color: #1a202c; font-size: 26px; margin: 0 0 20px 0; font-weight: 700;">Featured Story</h2>
            <div style="background: #4a5568; height: 200px; border-radius: 12px; margin: 0 0 20px 0;"></div>
            <h3 style="color: #2d3748; font-size: 22px; margin: 0 0 12px 0;">{{params.FEATURE_TITLE}}</h3>
            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0;">
              {{params.FEATURE_EXCERPT}}
            </p>
            <a href="{{params.FEATURE_URL}}" style="color: #f56565; text-decoration: none; font-weight: 600;">Read More →</a>
          </div>
          <div style="background: white; padding: 40px;">
            <h2 style="color: #1a202c; font-size: 22px; margin: 0 0 24px 0;">This Week's Highlights</h2>
            <div style="margin: 0 0 24px 0; padding: 0 0 24px 0; border-bottom: 1px solid #e2e8f0;">
              <h4 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">Story Title One</h4>
              <p style="color: #718096; margin: 0; font-size: 14px; line-height: 1.5;">Brief description of the story content...</p>
            </div>
            <div style="margin: 0 0 24px 0; padding: 0 0 24px 0; border-bottom: 1px solid #e2e8f0;">
              <h4 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">Story Title Two</h4>
              <p style="color: #718096; margin: 0; font-size: 14px; line-height: 1.5;">Brief description of the story content...</p>
            </div>
          </div>
        </div>
      `
    },
    
    // E-commerce
    {
      id: 'ecom-abandoned-cart',
      name: 'Abandoned Cart Recovery',
      category: 'ecommerce',
      description: 'Persuasive abandoned cart reminder with urgency',
      thumbnail: 'bg-gradient-to-br from-purple-600 to-pink-500',
      icon: ShoppingCart,
      isPremium: true,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 40px; text-align: center;">
            <div style="font-size: 64px; margin: 0 0 16px 0;">🛒</div>
            <h1 style="color: #1a202c; font-size: 32px; margin: 0 0 12px 0; font-weight: 700;">You Left Something Behind</h1>
            <p style="color: #718096; font-size: 18px; margin: 0;">Your items are still waiting for you, {{contact.FIRSTNAME}}</p>
          </div>
          <div style="padding: 0 40px 40px 40px;">
            <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px;">Your Cart:</h3>
              <div style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #4a5568;">Item Name</span>
                  <span style="color: #2d3748; font-weight: 600;">$XX.XX</span>
                </div>
              </div>
              <div style="padding: 16px 0; margin-top: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #1a202c; font-weight: 700; font-size: 18px;">Total:</span>
                  <span style="color: #1a202c; font-weight: 700; font-size: 18px;">{{params.CART_TOTAL}}</span>
                </div>
              </div>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="color: white; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">
                ⚡ SPECIAL OFFER
              </p>
              <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 15px;">
                Complete your order in the next 24 hours and get <strong>15% OFF</strong>
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{cart_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Complete My Order
              </a>
            </div>
            <p style="font-size: 13px; color: #a0aec0; text-align: center; margin: 24px 0 0 0;">
              Items in your cart are reserved for 24 hours
            </p>
          </div>
        </div>
      `
    },
    
    // Re-engagement
    {
      id: 'reeng-comeback',
      name: 'We Miss You',
      category: 'reengagement',
      description: 'Win-back campaign for inactive users',
      thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      icon: Heart,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="padding: 60px 40px; text-align: center;">
            <div style="font-size: 72px; margin: 0 0 24px 0;">💙</div>
            <h1 style="color: #1a202c; font-size: 36px; margin: 0 0 16px 0; font-weight: 700;">
              We Miss You, {{contact.FIRSTNAME}}
            </h1>
            <p style="color: #4a5568; font-size: 18px; line-height: 1.6; margin: 0;">
              It's been a while since we've seen you. We've made some exciting updates and would love to have you back.
            </p>
          </div>
          <div style="padding: 0 40px 40px 40px;">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; border-radius: 12px; padding: 32px; margin: 0 0 32px 0;">
              <h3 style="margin: 0 0 20px 0; font-size: 22px;">What's New:</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 2;">
                <li>New features you'll love</li>
                <li>Improved performance and speed</li>
                <li>Fresh content just for you</li>
                <li>Enhanced user experience</li>
              </ul>
            </div>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; color: #78350f; font-size: 16px;">
                <strong>Special Welcome Back Offer:</strong> Get 30 days of premium features for free!
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px;">
                Welcome Me Back
              </a>
            </div>
            <p style="font-size: 14px; color: #718096; text-align: center; margin: 24px 0 0 0;">
              This offer expires in 7 days
            </p>
          </div>
        </div>
      `
    },
    
    // Event
    {
      id: 'event-invitation',
      name: 'Event Invitation',
      category: 'event',
      description: 'Elegant event invitation with RSVP',
      thumbnail: 'bg-gradient-to-br from-violet-600 to-purple-600',
      icon: Calendar,
      isPremium: true,
      previewHtml: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 60px 40px; text-align: center;">
            <span style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">
              You're Invited
            </span>
            <h1 style="color: white; font-size: 38px; margin: 0 0 16px 0; font-weight: 800;">
              {{params.EVENT_NAME}}
            </h1>
            <p style="color: rgba(255,255,255,0.95); font-size: 18px; margin: 0;">
              Join us for an unforgettable experience
            </p>
          </div>
          <div style="padding: 40px;">
            <div style="background: #f7fafc; border-radius: 12px; padding: 32px; margin: 0 0 32px 0;">
              <div style="margin: 0 0 20px 0;">
                <div style="color: #718096; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Date & Time</div>
                <div style="color: #1a202c; font-size: 18px; font-weight: 600;">{{params.EVENT_DATE}}</div>
                <div style="color: #4a5568; font-size: 16px;">{{params.EVENT_TIME}}</div>
              </div>
              <div style="margin: 20px 0;">
                <div style="color: #718096; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Location</div>
                <div style="color: #1a202c; font-size: 18px; font-weight: 600;">{{params.EVENT_LOCATION}}</div>
                <div style="color: #4a5568; font-size: 16px;">{{params.EVENT_ADDRESS}}</div>
              </div>
            </div>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
              Dear {{contact.FIRSTNAME}},<br><br>
              We would be delighted if you could join us for this special occasion. Your presence would make the event even more memorable.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{rsvp_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                RSVP Now
              </a>
            </div>
            <p style="font-size: 13px; color: #a0aec0; text-align: center; margin: 24px 0 0 0;">
              Please RSVP by {{params.RSVP_DEADLINE}}
            </p>
          </div>
        </div>
      `
    },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFullScreenEditorOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCustomizerOpen(true);
  };

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
              <BreadcrumbPage>Marketing</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Email Marketing</h1>
            <p className="text-muted-foreground text-lg">
              World-class templates • Advanced automation • Campaign analytics
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Campaign
          </Button>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="templates">
              All Templates
            </TabsTrigger>
            <TabsTrigger value="saved">
              <FolderIcon className="h-4 w-4 mr-2" />
              My Templates ({savedTemplates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="sequences">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-6">
            {folders && folders.length > 0 && (
              <div className="space-y-4">
                {folders.map((folder) => {
                  const folderTemplates = savedTemplates?.filter(t => t.folder_id === folder.id) || [];
                  
                  return (
                    <Card key={folder.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <FolderIcon className="h-5 w-5" style={{ color: folder.color }} />
                            <h3 className="font-semibold text-lg">{folder.name}</h3>
                            <Badge variant="secondary">{folderTemplates.length}</Badge>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {folderTemplates.map((savedTemplate) => (
                            <Card key={savedTemplate.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                                <div 
                                  className="scale-[0.3] origin-top-left w-[333%] h-[333%]"
                                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(savedTemplate.customized_html) }}
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="font-medium mb-1">{savedTemplate.name}</h4>
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <Send className="h-3 w-3 mr-1" />
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Templates without folder */}
            {savedTemplates && savedTemplates.filter(t => !t.folder_id).length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FolderIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Uncategorized</h3>
                    <Badge variant="secondary">
                      {savedTemplates.filter(t => !t.folder_id).length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedTemplates.filter(t => !t.folder_id).map((savedTemplate) => (
                      <Card key={savedTemplate.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          <div 
                            className="scale-[0.3] origin-top-left w-[333%] h-[333%]"
                            dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(savedTemplate.customized_html) }}
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium mb-1">{savedTemplate.name}</h4>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!savedTemplates || savedTemplates.length === 0) && (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No saved templates yet</h3>
                <p className="text-muted-foreground mb-6">
                  Customize and save templates to access them here
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id as TemplateCategory)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                    <Badge variant="secondary" className="ml-1">{category.count}</Badge>
                  </Button>
                );
              })}
            </div>

            {/* Templates Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="h-64 relative overflow-hidden bg-muted">
                      {/* Email Preview */}
                      <div 
                        className="w-full h-full transform scale-[0.3] origin-top-left"
                        style={{ width: '333%', height: '333%' }}
                      >
                        <div 
                          className="bg-white"
                          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(template.previewHtml.replace(/\{\{[^}]+\}\}/g, (match) => {
                            const placeholders: Record<string, string> = {
                              '{{company.LOGO}}': 'Your Company',
                              '{{contact.FIRSTNAME}}': 'John',
                              '{{contact.NAME}}': 'John Smith',
                              '{{params.EVENT_NAME}}': 'Annual Gala',
                              '{{params.EVENT_DATE}}': 'December 15, 2025',
                              '{{params.EVENT_TIME}}': '7:00 PM',
                              '{{params.EVENT_LOCATION}}': 'Grand Ballroom',
                              '{{params.PRODUCT_NAME}}': 'Premium Plan',
                              '{{params.DISCOUNT_CODE}}': 'SAVE20'
                            };
                            return placeholders[match] || 'Sample Text';
                          })) }} 
                        />
                      </div>
                      {template.isPremium && (
                        <Badge className="absolute top-3 right-3 bg-yellow-500 text-black z-10">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleUseTemplate(template)}
                        >
                          Use Template
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first email campaign to get started
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sequences" className="space-y-6">
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No automation sequences</h3>
              <p className="text-muted-foreground mb-6">
                Set up automated email sequences to nurture your audience
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Sequence
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Sent</span>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Open Rate</span>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground mt-1">Average</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Click Rate</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground mt-1">Average</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Conversions</span>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <EmailTemplateCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        template={selectedTemplate}
      />
      
      {selectedTemplate && (
        <EmailTemplateFullScreenEditor
          open={fullScreenEditorOpen}
          onOpenChange={setFullScreenEditorOpen}
          template={selectedTemplate}
        />
      )}
    </div>
  );
};

export default Marketing;
