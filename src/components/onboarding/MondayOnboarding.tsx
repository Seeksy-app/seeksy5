import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, ChevronRight, Copy, Check, Mail, Calendar, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleVerifiedBadge } from '@/components/ui/google-verified-badge';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Step data types
type Purpose = 'work' | 'personal' | 'school' | 'nonprofits' | null;
type Role = 'business_owner' | 'team_leader' | 'team_member' | 'freelancer' | 'director' | 'c_level' | 'vp' | 'creator' | 'podcaster' | null;
type TeamSize = 'only_me' | '2-5' | '6-10' | '11-15' | '16-25' | '26-50' | '51-100' | '101-500' | null;
type CompanySize = '1-19' | '20-49' | '50-99' | '100-250' | '251-500' | '501-1500' | '1500+' | null;
type ManageFocus = string | null;
type WorkflowFocus = string | null;
type HowHeard = string[];
type IntegrationType = 'google_email' | 'google_calendar' | 'skip' | null;

interface OnboardingData {
  purpose: Purpose;
  role: Role;
  teamSize: TeamSize;
  companySize: CompanySize;
  manageFocus: ManageFocus;
  workflowFocus: WorkflowFocus;
  howHeard: HowHeard;
  inviteEmails: string[];
  integrationType: IntegrationType;
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

export function MondayOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    purpose: null,
    role: null,
    teamSize: null,
    companySize: null,
    manageFocus: null,
    workflowFocus: null,
    howHeard: [],
    inviteEmails: ['', ''],
    integrationType: null,
  });

  const totalSteps = 6;

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

  const updateInviteEmail = (index: number, value: string) => {
    setData(prev => {
      const newEmails = [...prev.inviteEmails];
      newEmails[index] = value;
      return { ...prev, inviteEmails: newEmails };
    });
  };

  const addEmailField = () => {
    setData(prev => ({
      ...prev,
      inviteEmails: [...prev.inviteEmails, '']
    }));
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/signup?ref=team`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Invite link copied!');
  };

  const handleComplete = async () => {
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

      // Save onboarding data
      const { error: profileError } = await supabase.from('profiles').update({
        onboarding_completed: true,
        account_type: accountType,
        onboarding_data: {
          ...data,
          completedAt: new Date().toISOString(),
        }
      }).eq('id', user.id);

      if (profileError) throw profileError;

      // Save to user_preferences
      const { error: prefsError } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        onboarding_completed: true,
        user_type: accountType,
      }, { onConflict: 'user_id' });

      if (prefsError) console.error('Preferences error:', prefsError);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('Welcome to Seeksy!');

      // Handle integration redirect
      if (data.integrationType === 'google_email') {
        // Navigate to Google email OAuth
        navigate('/integrations/google?scope=email');
      } else if (data.integrationType === 'google_calendar') {
        // Navigate to Google calendar OAuth
        navigate('/integrations/google?scope=calendar');
      } else {
        // Navigate to dashboard
        setTimeout(() => navigate('/dashboard'), 1000);
      }
      
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine suggested integration based on workflow focus
  const getSuggestedIntegration = (): 'email' | 'calendar' => {
    const emailFocuses = ['Marketing & CRM', 'Monetization', 'Social Media'];
    const calendarFocuses = ['Events & Meetings', 'Podcasting'];
    
    if (emailFocuses.includes(data.manageFocus || '')) return 'email';
    if (calendarFocuses.includes(data.manageFocus || '')) return 'calendar';
    return 'email';
  };

  // Step 1: Purpose & Role (progressive disclosure)
  const renderStep1 = () => (
    <div className="space-y-10">
      {/* Purpose question */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Hey there, what brings you here today?
        </h1>
        <div className="flex flex-wrap gap-3">
          <PillButton label="Work" selected={data.purpose === 'work'} onClick={() => setData(prev => ({ ...prev, purpose: 'work' }))} />
          <PillButton label="Personal" selected={data.purpose === 'personal'} onClick={() => setData(prev => ({ ...prev, purpose: 'personal' }))} />
          <PillButton label="School" selected={data.purpose === 'school'} onClick={() => setData(prev => ({ ...prev, purpose: 'school' }))} />
          <PillButton label="Nonprofits" selected={data.purpose === 'nonprofits'} onClick={() => setData(prev => ({ ...prev, purpose: 'nonprofits' }))} />
        </div>
      </motion.div>

      {/* Role question - appears after purpose is selected */}
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

  // Step 2: Team & Company Size
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
              selected={data.teamSize === size.toLowerCase().replace(' ', '_').replace('-', '-') as TeamSize} 
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

  // Step 3: What to manage first
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

  // Step 4: Workflow focus
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

  // Step 5: How did you hear about us
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

  // Step 6: Integration connection
  const renderStep6 = () => {
    const suggestedIntegration = getSuggestedIntegration();
    
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {suggestedIntegration === 'email' 
              ? 'Connect your email to supercharge your workflow'
              : 'Sync your calendar to stay organized'
            }
          </h1>
          <div className="space-y-1 text-muted-foreground">
            {suggestedIntegration === 'email' ? (
              <>
                <p className="flex items-center gap-2"><span>✍️</span> Automatically populate your CRM with contacts</p>
                <p className="flex items-center gap-2"><span>🔍</span> Track email interactions within Seeksy</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2"><span>📅</span> Sync meetings and events automatically</p>
                <p className="flex items-center gap-2"><span>🔔</span> Get reminders and never miss a booking</p>
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 max-w-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <GoogleVerifiedBadge variant="pill" />
          </div>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3 h-14 text-base font-medium border-2 hover:bg-accent/50"
            onClick={() => setData(prev => ({ ...prev, integrationType: suggestedIntegration === 'email' ? 'google_email' : 'google_calendar' }))}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Connect Google Account
          </Button>

          <button
            type="button"
            onClick={() => setData(prev => ({ ...prev, integrationType: 'skip' }))}
            className="w-full text-center text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Skip for now
          </button>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Secure, Google-verified integration. <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Questions */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-background">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-gold to-brand-orange flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl">Seeksy</span>
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

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/80 to-primary items-center justify-center p-12">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Abstract illustration based on step */}
          <div className="relative w-80 h-80">
            {/* Decorative elements */}
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-2xl backdrop-blur-sm shadow-lg flex items-center justify-center"
            >
              <div className="w-36 h-8 bg-white/20 rounded-full" />
              <div className="absolute top-12 left-4 w-20 h-3 bg-green-400/60 rounded-full" />
              <div className="absolute top-20 left-4 w-32 h-3 bg-yellow-400/60 rounded-full" />
              <div className="absolute top-28 left-4 w-24 h-3 bg-red-400/60 rounded-full" />
            </motion.div>
            
            <motion.div 
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -3, 0]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-2xl backdrop-blur-sm shadow-lg"
            />

            {/* Hand illustration */}
            <motion.div
              animate={{ 
                x: [0, 5, 0],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-8 right-8 text-6xl"
            >
              👋
            </motion.div>
          </div>

          {/* Wavy line at bottom */}
          <svg 
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-12 text-white/30"
            viewBox="0 0 200 30"
            fill="none"
          >
            <path 
              d="M0 15 Q 25 5, 50 15 T 100 15 T 150 15 T 200 15" 
              stroke="currentColor" 
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
