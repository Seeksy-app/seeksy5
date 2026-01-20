/**
 * Full-Screen Onboarding Flow
 * Complete redesign with real images, no dashboard/sidebar visible
 * 
 * CRITICAL FLOW:
 * 1. User completes onboarding steps
 * 2. On completion: Create workspace FIRST based on manageFocus
 * 3. THEN install selected Seekies into that workspace
 * 4. THEN redirect to /my-day with workspace active
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronRight, Check, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleVerifiedBadge } from '@/components/ui/google-verified-badge';
import confetti from 'canvas-confetti';
import { ONBOARDING_IMAGES, getImageForFocus } from './OnboardingImages';
import { OnboardingFeedbackWidget } from '@/components/feedback/OnboardingFeedbackWidget';
import { getSeeksyConfigForFocus } from '@/utils/onboardingSeeksyMapper';

// Types
type Purpose = 'work' | 'personal' | 'school' | 'nonprofits' | null;
type Role = 'business_owner' | 'team_leader' | 'team_member' | 'freelancer' | 'director' | 'c_level' | 'vp' | 'creator' | 'podcaster' | null;
type TeamSize = 'only_me' | '2-5' | '6-10' | '11-15' | '16-25' | '26-50' | '51-100' | '101-500' | null;
type CompanySize = '1-19' | '20-49' | '50-99' | '100-250' | '251-500' | '501-1500' | '1500+' | null;

interface OnboardingData {
  purpose: Purpose;
  role: Role;
  teamSize: TeamSize;
  companySize: CompanySize;
  manageFocus: string | null;
  workflowFocus: string | null;
  howHeard: string[];
  integrationType: 'google_email' | 'google_calendar' | 'skip' | null;
}

const MANAGE_FOCUS_OPTIONS = [
  'Podcasting',
  'Content Creation',
  'Events & Meetings',
  'Marketing & CRM',
  'Monetization',
  'Analytics',
  'Social Media',
  'Team Collaboration',
  'Other',
];

const WORKFLOW_FOCUS_OPTIONS: Record<string, string[]> = {
  'Podcasting': ['Record episodes', 'Podcast hosting', 'Guest scheduling', 'Transcript generation', 'AI clips'],
  'Content Creation': ['Video editing', 'AI clips', 'Social publishing', 'Media library', 'Analytics'],
  'Events & Meetings': ['Meeting scheduling', 'Event ticketing', 'Calendar sync', 'Reminders', 'Virtual events'],
  'Marketing & CRM': ['Email campaigns', 'Contact management', 'Lead capture', 'Newsletters', 'Automations'],
  'Monetization': ['Brand deals', 'Sponsorships', 'Revenue tracking', 'Proposals', 'Invoicing'],
  'Analytics': ['Social analytics', 'Performance tracking', 'Audience insights', 'Revenue reports', 'Growth metrics'],
  'Social Media': ['Social connect', 'Post scheduling', 'Cross-platform sync', 'Engagement tracking', 'Content calendar'],
  'Team Collaboration': ['Team chat', 'Task management', 'Shared workspaces', 'Permissions', 'Activity logs'],
  'Other': ['Explore features', 'Custom setup', 'Help me decide', 'Talk to support'],
};

const HOW_HEARD_OPTIONS = [
  'Facebook / Instagram',
  'Consultant',
  'Software Review Site',
  'AI Chatbots (ChatGPT, Claude)',
  'Online search (Google, Bing)',
  'News publications',
  'Friend',
  'Podcast',
  'TV / Streaming',
  'Events/conferences',
  'LinkedIn',
  'YouTube',
  'Outdoors ad',
  'Email',
  'Audio streaming',
  'Other',
];

// Pill button component
function PillButton({ 
  label, 
  selected, 
  onClick 
}: { 
  label: string; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border-2",
        selected 
          ? "bg-foreground text-background border-foreground shadow-md" 
          : "bg-background text-foreground border-border hover:border-foreground/50 hover:shadow-sm"
      )}
    >
      {label}
    </motion.button>
  );
}

// Checkbox pill for multi-select
function CheckboxPill({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border-2",
        checked 
          ? "bg-foreground text-background border-foreground shadow-md" 
          : "bg-background text-foreground border-border hover:border-foreground/50 hover:shadow-sm"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
        checked ? "bg-background border-background" : "border-current"
      )}>
        {checked && <Check className="h-3 w-3 text-foreground" />}
      </div>
      {label}
    </motion.button>
  );
}

export function FullScreenOnboarding() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confettiPlayed, setConfettiPlayed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  
  // Check if force mode is active (dev testing)
  const isForceMode = searchParams.get('force') === 'true';
  
  // If force mode, clear any previous localStorage data to start fresh
  useEffect(() => {
    if (isForceMode) {
      console.log('[FullScreenOnboarding] Force mode active - clearing stored data');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_data');
    }
  }, [isForceMode]);
  
  // Restore step and data from localStorage to persist across OAuth redirects
  // But reset if force mode is active
  const [step, setStep] = useState(() => {
    if (isForceMode) return 1;
    const saved = localStorage.getItem('onboarding_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [data, setData] = useState<OnboardingData>(() => {
    // Reset if force mode
    if (searchParams.get('force') === 'true') {
      return {
        purpose: null,
        role: null,
        teamSize: null,
        companySize: null,
        manageFocus: null,
        workflowFocus: null,
        howHeard: [],
        integrationType: null,
      };
    }
    const saved = localStorage.getItem('onboarding_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          purpose: null,
          role: null,
          teamSize: null,
          companySize: null,
          manageFocus: null,
          workflowFocus: null,
          howHeard: [],
          integrationType: null,
        };
      }
    }
    return {
      purpose: null,
      role: null,
      teamSize: null,
      companySize: null,
      manageFocus: null,
      workflowFocus: null,
      howHeard: [],
      integrationType: null,
    };
  });

  // Persist step and data to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding_step', step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem('onboarding_data', JSON.stringify(data));
  }, [data]);

  const totalSteps = 6;

  // Check for Google connection success from URL params
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'gmail_connected') {
      setGoogleConnected(true);
      toast.success('Google account connected successfully!');
      // Update integrationType in data
      setData(prev => ({ ...prev, integrationType: 'google_email' }));
      // Clean up the URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch user first name
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setFirstName(profile.full_name.split(' ')[0]);
        } else if (user.email) {
          setFirstName(user.email.split('@')[0]);
        }
      }
    };
    fetchUser();
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Get current image based on step and focus
  const getCurrentImage = () => {
    if (data.manageFocus) {
      return getImageForFocus(data.manageFocus);
    }
    
    switch (step) {
      case 1: return ONBOARDING_IMAGES.step1;
      case 2: return ONBOARDING_IMAGES.step2;
      case 3: return ONBOARDING_IMAGES.step3;
      case 4: return ONBOARDING_IMAGES.step4;
      case 5: return ONBOARDING_IMAGES.step5;
      case 6: return ONBOARDING_IMAGES.step6;
      default: return ONBOARDING_IMAGES.step1;
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1: return !!data.purpose && !!data.role;
      case 2: return !!data.teamSize && !!data.companySize;
      case 3: return !!data.manageFocus;
      case 4: return !!data.workflowFocus;
      case 5: return data.howHeard.length > 0;
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleHowHeard = (option: string) => {
    setData(prev => ({
      ...prev,
      howHeard: prev.howHeard.includes(option)
        ? prev.howHeard.filter(h => h !== option)
        : [...prev.howHeard, option]
    }));
  };

  const handleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine account type based on answers
      type AccountTypeValue = 'creator' | 'podcaster' | 'brand' | 'agency' | 'advertiser' | 'event_planner' | 'studio_team' | 'admin';
      let accountType: AccountTypeValue = 'creator';
      if (data.role === 'podcaster') accountType = 'podcaster';
      else if (data.role === 'business_owner' || data.role === 'c_level') accountType = 'brand';
      else if (data.role === 'team_leader' || data.role === 'director') accountType = 'agency';
      else if (data.role === 'freelancer' || data.role === 'creator') accountType = 'creator';

      // CRITICAL: Get workspace config based on manageFocus
      const seeksyConfig = getSeeksyConfigForFocus(data.manageFocus);
      
      console.log('[Onboarding] Creating workspace:', seeksyConfig.workspaceName);
      console.log('[Onboarding] Installing modules:', seeksyConfig.moduleIds);

      // Step 1: Create workspace FIRST
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('custom_packages')
        .insert({
          user_id: user.id,
          name: seeksyConfig.workspaceName,
          slug: `${seeksyConfig.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
          modules: seeksyConfig.moduleIds,
          is_default: true,
          icon_color: '#2C6BED',
        })
        .select()
        .single();

      if (workspaceError) {
        console.error('[Onboarding] Workspace creation error:', workspaceError);
        throw workspaceError;
      }

      console.log('[Onboarding] Workspace created:', workspaceData.id);

      // Step 2: Install Seekies (workspace_modules)
      if (seeksyConfig.moduleIds.length > 0 && workspaceData) {
        const moduleInserts = seeksyConfig.moduleIds.map((moduleId, index) => ({
          workspace_id: workspaceData.id,
          module_id: moduleId,
          position: index,
        }));

        const { error: modulesError } = await supabase
          .from('workspace_modules')
          .insert(moduleInserts);

        if (modulesError) {
          console.error('[Onboarding] Modules install error:', modulesError);
          // Don't throw - workspace is created, modules can be added later
        } else {
          console.log('[Onboarding] Modules installed:', seeksyConfig.moduleIds.length);
        }
      }

      // Step 3: Save active workspace ID to user preferences
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        onboarding_completed: true,
        user_type: accountType,
        active_workspace_id: workspaceData.id,
      }, { onConflict: 'user_id' });
      
      // Also save to localStorage for immediate context pickup
      localStorage.setItem('currentWorkspaceId', workspaceData.id);

      // Step 4: Save onboarding data to profile
      const { error: profileError } = await supabase.from('profiles').update({
        onboarding_completed: true,
        account_type: accountType,
        onboarding_data: {
          ...data,
          workspaceId: workspaceData.id,
          workspaceName: seeksyConfig.workspaceName,
          installedModules: seeksyConfig.moduleIds,
          completedAt: new Date().toISOString(),
        }
      }).eq('id', user.id);

      if (profileError) {
        console.error('[Onboarding] Profile update error:', profileError);
        // Don't throw - non-critical
      }

      // Clear localStorage after successful completion
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_data');
      
      // Set a flag to prevent OnboardingGuard from redirecting back
      sessionStorage.setItem('onboarding_just_completed', 'true');

      // Trigger confetti only once
      if (!confettiPlayed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setConfettiPlayed(true);
      }

      // Show success toast
      toast.success(`Welcome to Seeksy!`, {
        description: `Your ${seeksyConfig.workspaceName} is ready with ${seeksyConfig.moduleIds.length} apps installed.`,
      });

      // CRITICAL: Navigate directly to /my-day - no intermediate screen
      // Use window.location for a full page reload to ensure fresh WorkspaceContext
      window.location.href = '/my-day';
      
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete setup. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Removed handleWelcomeContinue - no longer needed
  // Removed showWelcome screen - we go directly to /my-day

  // Step renderers
  const renderStep1 = () => (
    <div className="space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Hey there,<br />what brings you here today?
        </h1>
        <div className="flex flex-wrap gap-3">
          <PillButton label="Work" selected={data.purpose === 'work'} onClick={() => setData(prev => ({ ...prev, purpose: 'work' }))} />
          <PillButton label="Personal" selected={data.purpose === 'personal'} onClick={() => setData(prev => ({ ...prev, purpose: 'personal' }))} />
          <PillButton label="School" selected={data.purpose === 'school'} onClick={() => setData(prev => ({ ...prev, purpose: 'school' }))} />
          <PillButton label="Nonprofits" selected={data.purpose === 'nonprofits'} onClick={() => setData(prev => ({ ...prev, purpose: 'nonprofits' }))} />
        </div>
      </motion.div>

      <AnimatePresence>
        {data.purpose && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              What best describes your current role?
            </h2>
            <div className="flex flex-wrap gap-3">
              <PillButton label="Business owner" selected={data.role === 'business_owner'} onClick={() => setData(prev => ({ ...prev, role: 'business_owner' }))} />
              <PillButton label="Team leader" selected={data.role === 'team_leader'} onClick={() => setData(prev => ({ ...prev, role: 'team_leader' }))} />
              <PillButton label="Team member" selected={data.role === 'team_member'} onClick={() => setData(prev => ({ ...prev, role: 'team_member' }))} />
              <PillButton label="Freelancer" selected={data.role === 'freelancer'} onClick={() => setData(prev => ({ ...prev, role: 'freelancer' }))} />
              <PillButton label="Director" selected={data.role === 'director'} onClick={() => setData(prev => ({ ...prev, role: 'director' }))} />
              <PillButton label="C-Level" selected={data.role === 'c_level'} onClick={() => setData(prev => ({ ...prev, role: 'c_level' }))} />
              <PillButton label="VP" selected={data.role === 'vp'} onClick={() => setData(prev => ({ ...prev, role: 'vp' }))} />
              <PillButton label="Creator" selected={data.role === 'creator'} onClick={() => setData(prev => ({ ...prev, role: 'creator' }))} />
              <PillButton label="Podcaster" selected={data.role === 'podcaster'} onClick={() => setData(prev => ({ ...prev, role: 'podcaster' }))} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          How many people are on your team?
        </h1>
        <div className="flex flex-wrap gap-3">
          {['Only me', '2-5', '6-10', '11-15', '16-25', '26-50', '51-100', '101-500'].map((size) => (
            <PillButton 
              key={size}
              label={size} 
              selected={data.teamSize === size.toLowerCase().replace(' ', '_') as TeamSize} 
              onClick={() => setData(prev => ({ ...prev, teamSize: size.toLowerCase().replace(' ', '_') as TeamSize }))} 
            />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {data.teamSize && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              How many people work at your company?
            </h2>
            <div className="flex flex-wrap gap-3">
              {['1-19', '20-49', '50-99', '100-250', '251-500', '501-1500', '1500+'].map((size) => (
                <PillButton 
                  key={size}
                  label={size} 
                  selected={data.companySize === size as CompanySize} 
                  onClick={() => setData(prev => ({ ...prev, companySize: size as CompanySize }))} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Select what you'd like to manage first
        </h1>
        <p className="text-muted-foreground text-lg">You can always add more in the future</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {MANAGE_FOCUS_OPTIONS.map((option) => (
          <PillButton 
            key={option}
            label={option} 
            selected={data.manageFocus === option} 
            onClick={() => setData(prev => ({ ...prev, manageFocus: option, workflowFocus: null }))} 
          />
        ))}
      </motion.div>
    </div>
  );

  const renderStep4 = () => {
    const workflowOptions = data.manageFocus ? WORKFLOW_FOCUS_OPTIONS[data.manageFocus] || [] : [];
    
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Select what you'd like to focus on first
          </h1>
          <p className="text-muted-foreground text-lg">Help us tailor the best experience for you</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          {workflowOptions.map((option) => (
            <PillButton 
              key={option}
              label={option} 
              selected={data.workflowFocus === option} 
              onClick={() => setData(prev => ({ ...prev, workflowFocus: option }))} 
            />
          ))}
        </motion.div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          One last question, how did you hear about us?
        </h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {HOW_HEARD_OPTIONS.map((option) => (
          <CheckboxPill 
            key={option}
            label={option} 
            checked={data.howHeard.includes(option)} 
            onChange={() => toggleHowHeard(option)} 
          />
        ))}
      </motion.div>
    </div>
  );

  const handleGoogleConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Don't show error toast - just skip silently
        console.log('[Onboarding] No session for Google connect, skipping');
        setData(prev => ({ ...prev, integrationType: 'skip' }));
        return;
      }

      const suggestedIntegration = ['Events & Meetings', 'Podcasting'].includes(data.manageFocus || '') ? 'calendar' : 'email';
      
      // Call the gmail-auth edge function to get OAuth URL
      const response = await supabase.functions.invoke('gmail-auth', {
        body: { returnPath: '/onboarding' }
      });

      if (response.error) {
        // Don't show error toast - just skip silently
        console.log('[Onboarding] Gmail auth error, skipping:', response.error);
        setData(prev => ({ ...prev, integrationType: 'skip' }));
        return;
      }

      if (response.data?.authUrl) {
        // Store that we're connecting, then redirect
        setData(prev => ({ ...prev, integrationType: suggestedIntegration === 'email' ? 'google_email' : 'google_calendar' }));
        window.location.href = response.data.authUrl;
      } else {
        // Don't show error toast - just skip silently
        console.log('[Onboarding] No auth URL returned, skipping');
        setData(prev => ({ ...prev, integrationType: 'skip' }));
      }
    } catch (error) {
      // Don't show error toast - just skip silently
      console.log('[Onboarding] Google connect error, skipping:', error);
      setData(prev => ({ ...prev, integrationType: 'skip' }));
    }
  };

  const renderStep6 = () => {
    const suggestedIntegration = ['Events & Meetings', 'Podcasting'].includes(data.manageFocus || '') ? 'calendar' : 'email';
    
    // Show connected state if Google was just connected
    if (googleConnected || data.integrationType === 'google_email' || data.integrationType === 'google_calendar') {
      return (
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  You're connected to Google!
                </h1>
                <p className="text-muted-foreground">Your account is ready to sync</p>
              </div>
            </div>
            <div className="space-y-1 text-muted-foreground mt-4 pl-15">
              <p className="flex items-center gap-2"><span>✅</span> Email syncing enabled</p>
              <p className="flex items-center gap-2"><span>✅</span> Contacts will be imported automatically</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 max-w-md"
          >
            <p className="text-sm text-muted-foreground">
              Click "Get Started" below to complete your setup and start exploring Seeksy.
            </p>
          </motion.div>
        </div>
      );
    }
    
    // Default view - emphasize that this is optional
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            You're all set! 🎉
          </h1>
          <p className="text-lg text-muted-foreground">
            Your workspace is ready. You can optionally connect Google now, or do it later from Settings.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 max-w-md"
        >
          {/* Optional Google connect - secondary style */}
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <GoogleVerifiedBadge variant="pill" />
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {suggestedIntegration === 'email' 
                ? 'Connect Gmail to sync contacts and track emails.'
                : 'Connect Google Calendar to sync meetings and events.'
              }
            </p>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleGoogleConnect}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Google
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Click <strong>"Get Started"</strong> below to enter your dashboard.
          </p>
        </motion.div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen flex fixed inset-0 bg-background z-50 overflow-auto">
      {/* Left side - Questions */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-background overflow-y-auto">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl">Seeksy</span>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < step ? "bg-primary flex-1" : i === step - 1 ? "bg-primary flex-[2]" : "bg-border flex-1"
                )}
              />
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {step < totalSteps ? (
            <Button 
              onClick={handleNext}
              disabled={!canContinue()}
              className={cn(
                "gap-2 transition-all",
                canContinue() 
                  ? "bg-primary hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Setting up...' : 'Get Started'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`image-${step}-${data.manageFocus}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={getCurrentImage()}
              alt="Onboarding"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Widget */}
      <OnboardingFeedbackWidget />
    </div>
  );
}
