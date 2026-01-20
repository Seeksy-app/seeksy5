import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountType, type AccountType } from '@/hooks/useAccountType';
import { useUserRoles } from '@/hooks/useUserRoles';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { PersonalizedQuestionsStep } from './steps/PersonalizedQuestionsStep';
import { RecommendedToolsStep } from './steps/RecommendedToolsStep';
import { DashboardPreviewStep } from './steps/DashboardPreviewStep';
import { CompletionStep } from './steps/CompletionStep';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

// Map display tool names to module IDs
const TOOL_TO_MODULE_MAP: Record<string, string> = {
  'Studio & Recording': 'studio',
  'Social Analytics': 'social-analytics',
  'Media Library': 'content-library',
  'My Page Builder': 'my-page',
  'Clips & Editing': 'clips',
  'Podcasts': 'podcasts',
  'Social Connect': 'social-connect',
  'Contacts & Audience': 'contacts',
  'Campaigns': 'campaigns',
  'Segments': 'segments',
  'Events': 'events',
  'Forms': 'forms',
  'Automations': 'automations',
  'SMS': 'sms',
  'Team & Collaboration': 'team',
  'Proposals': 'proposals',
  'Identity & Verification': 'identity',
  'Video Studio': 'video-studio',
  'Brand Deals': 'brand-campaigns',
  'Meetings': 'meetings',
  'Email': 'email',
  'Awards': 'awards',
  'Marketing': 'marketing',
  'Revenue Tracking': 'revenue-tracking',
};

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [recommendedTools, setRecommendedTools] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const { completeOnboarding, isCompletingOnboarding } = useAccountType();
  const { isAdmin } = useUserRoles();
  const navigate = useNavigate();

  const totalSteps = 5;

  // Check if admin is previewing
  useEffect(() => {
    if (isAdmin) {
      setIsAdminPreview(true);
    }
  }, [isAdmin]);

  const handleRoleSelect = (type: AccountType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleQuestionsComplete = (data: Record<string, any>) => {
    setOnboardingData(data);
    // Generate recommended tools based on account type
    const tools = getRecommendedTools(selectedType!, data);
    setRecommendedTools(tools);
    setStep(3);
  };

  const handleToolsConfirmed = () => {
    setStep(4);
  };

  const handlePreviewComplete = () => {
    setStep(5);
  };

  const handleFinish = async () => {
    if (!selectedType) return;

    // Admin preview mode - skip database writes
    if (isAdminPreview) {
      toast.success('Admin Preview Complete', {
        description: 'Skipped database writes. Redirecting to admin dashboard.',
      });
      navigate('/admin');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Convert tool names to module IDs and insert into user_modules
      const moduleIds = recommendedTools
        .map(tool => TOOL_TO_MODULE_MAP[tool])
        .filter(Boolean);
      
      if (moduleIds.length > 0) {
        const modulesToInsert = moduleIds.map(moduleId => ({
          user_id: user.id,
          module_id: moduleId,
          granted_at: new Date().toISOString()
        }));

        const { error: modulesError } = await supabase
          .from('user_modules')
          .upsert(modulesToInsert, { onConflict: 'user_id,module_id' });
        
        if (modulesError) {
          console.error('Error activating modules:', modulesError);
        }

        // Check if user has a workspace, create one if not
        const { data: existingWorkspaces } = await supabase
          .from('custom_packages')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        let workspaceId: string;

        if (!existingWorkspaces || existingWorkspaces.length === 0) {
          // Create default workspace with the selected modules
          const workspaceName = selectedType === 'podcaster' ? 'My Podcast Workspace' :
                               selectedType === 'creator' ? 'My Creator Workspace' :
                               selectedType === 'agency' ? 'My Agency Workspace' :
                               'My Workspace';
          
          const { data: newWorkspace, error: workspaceError } = await supabase
            .from('custom_packages')
            .insert({
              user_id: user.id,
              name: workspaceName,
              slug: `workspace-${Date.now().toString(36)}`,
              modules: moduleIds,
              is_default: true,
              icon_color: '#2C6BED',
            })
            .select()
            .single();

          if (workspaceError) {
            console.error('Error creating workspace:', workspaceError);
          } else {
            workspaceId = newWorkspace.id;
          }
        } else {
          workspaceId = existingWorkspaces[0].id;
        }

        // Add modules to workspace_modules table
        if (workspaceId) {
          const workspaceModulesToInsert = moduleIds.map((moduleId, index) => ({
            workspace_id: workspaceId,
            module_id: moduleId,
            position: index,
          }));

          const { error: wsModulesError } = await supabase
            .from('workspace_modules')
            .upsert(workspaceModulesToInsert, { 
              onConflict: 'workspace_id,module_id',
              ignoreDuplicates: true 
            });

          if (wsModulesError) {
            console.error('Error adding modules to workspace:', wsModulesError);
          }
        }
      }

      await completeOnboarding({
        account_type: selectedType,
        onboarding_data: { ...onboardingData, recommendedTools, activatedModules: moduleIds },
      }, {
        onSuccess: () => {
          const redirects: Record<AccountType, string> = {
            creator: '/dashboard',
            podcaster: '/podcasts',
            advertiser: '/advertiser',
            agency: '/agency',
            event_planner: '/events',
            brand: '/apps?view=modules',
            studio_team: '/studio',
            admin: '/admin',
            influencer: '/dashboard',
          };
          
          navigate(redirects[selectedType] || '/dashboard');
        },
        onError: (error) => {
          console.error('Onboarding error:', error);
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            toast.error('Failed to complete setup', {
              description: `Retrying... (Attempt ${retryCount + 1}/3)`,
              action: {
                label: 'Retry Now',
                onClick: handleFinish,
              },
            });
          } else {
            toast.error('Setup failed after multiple attempts', {
              description: 'Please refresh the page and try again, or contact support if the issue persists.',
            });
          }
        },
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong', {
        description: 'Please try again or contact support.',
        action: {
          label: 'Retry',
          onClick: handleFinish,
        },
      });
    }
  };

  const getRecommendedTools = (type: AccountType, data: Record<string, any>): string[] => {
    const toolMap: Record<AccountType, string[]> = {
      creator: ['Studio & Recording', 'Social Analytics', 'Media Library', 'My Page Builder', 'Clips & Editing'],
      podcaster: ['Studio & Recording', 'Podcasts', 'Media Library', 'Social Connect', 'Clips & Editing'],
      influencer: ['Social Analytics', 'My Page Builder', 'Media Library', 'Clips & Editing', 'Identity & Verification'],
      advertiser: ['Campaigns', 'Contacts & Audience', 'Social Analytics', 'Segments'],
      agency: ['Contacts & Audience', 'Campaigns', 'Team & Collaboration', 'Proposals'],
      event_planner: ['Events', 'Contacts & Audience', 'Forms', 'Automations', 'SMS'],
      brand: ['Social Connect', 'Social Analytics', 'Campaigns'],
      studio_team: ['Studio & Recording', 'Media Library', 'Team & Collaboration', 'Clips & Editing'],
      admin: ['Team & Collaboration', 'Contacts & Audience'],
    };
    return toolMap[type] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Admin preview banner */}
        {isAdminPreview && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm text-center"
          >
            🔧 Admin Preview Mode — database writes will be skipped
          </motion.div>
        )}

        {/* Progress indicator with smooth animation */}
        <div className="flex justify-center mb-6 gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const num = idx + 1;
            return (
              <motion.div
                key={num}
                className="h-2 rounded-full bg-muted overflow-hidden"
                initial={false}
                animate={{
                  width: num === step ? 48 : 32,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: num <= step ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: num === step ? 0.1 : 0 }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Step label */}
        <div className="text-center mb-4">
          <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
        </div>

        {/* Steps with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RoleSelectionStep onSelect={handleRoleSelect} />
            </motion.div>
          )}
          {step === 2 && selectedType && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PersonalizedQuestionsStep
                accountType={selectedType}
                onComplete={handleQuestionsComplete}
                onBack={() => setStep(1)}
              />
            </motion.div>
          )}
          {step === 3 && selectedType && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RecommendedToolsStep
                tools={recommendedTools}
                onContinue={handleToolsConfirmed}
                onBack={() => setStep(2)}
              />
            </motion.div>
          )}
          {step === 4 && selectedType && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardPreviewStep
                accountType={selectedType}
                tools={recommendedTools}
                onContinue={handlePreviewComplete}
                onBack={() => setStep(3)}
              />
            </motion.div>
          )}
          {step === 5 && selectedType && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CompletionStep
                accountType={selectedType}
                onFinish={handleFinish}
                isLoading={isCompletingOnboarding}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
