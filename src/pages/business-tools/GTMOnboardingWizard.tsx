import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Target, User, Goal, DollarSign, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardData {
  businessName: string;
  businessType: string;
  location: string;
  audienceLocations: string[];
  goals: string[];
  timeframe: string;
  budgetRange: string;
  weeklyHours: number;
  teamType: string;
  channels: string[];
  excludedChannels: string;
}

const STEPS = [
  { id: 1, title: 'About Your Business', icon: User },
  { id: 2, title: 'Goals & Timeframe', icon: Goal },
  { id: 3, title: 'Budget & Capacity', icon: DollarSign },
  { id: 4, title: 'Channel Preferences', icon: Megaphone },
  { id: 5, title: 'Review & Create', icon: Check },
];

const BUSINESS_TYPES = [
  'Podcast host',
  'Podcast guest',
  'Influencer',
  'Speaker',
  'Agency',
  'Brand',
  'Other',
];

const GOALS = [
  { id: 'launch_podcast', label: 'Launch a new podcast' },
  { id: 'grow_downloads', label: 'Grow existing podcast downloads' },
  { id: 'guest_invitations', label: 'Get more guest invitations' },
  { id: 'sell_sponsorships', label: 'Sell more sponsorships' },
  { id: 'event_bookings', label: 'Grow event bookings / speaking' },
  { id: 'email_list', label: 'Grow email list' },
  { id: 'brand_awareness', label: 'Increase overall brand awareness' },
];

const TIMEFRAMES = [
  { value: '0-3', label: '0–3 months' },
  { value: '3-6', label: '3–6 months' },
  { value: '6-12', label: '6–12 months' },
  { value: '12+', label: '12+ months' },
];

const BUDGET_RANGES = [
  { value: '0-500', label: '$0 – $500/month' },
  { value: '500-2000', label: '$500 – $2,000/month' },
  { value: '2000-5000', label: '$2,000 – $5,000/month' },
  { value: '5000-10000', label: '$5,000 – $10,000/month' },
  { value: '10000+', label: '$10,000+/month' },
];

const TEAM_TYPES = [
  { value: 'solo', label: 'Solo / Just me' },
  { value: 'small_team', label: 'Small internal team (2-5 people)' },
  { value: 'agency', label: 'Working with an agency' },
  { value: 'mixed', label: 'Mix of internal + agency support' },
];

const CHANNELS = [
  { id: 'podcast_host', label: 'Podcast interviews (as host)' },
  { id: 'podcast_guest', label: 'Podcast guesting' },
  { id: 'short_video', label: 'Short-form video (Reels/TikTok/Shorts)' },
  { id: 'long_video', label: 'Long-form video (YouTube)' },
  { id: 'email', label: 'Email newsletters' },
  { id: 'social', label: 'Social media (IG/Twitter/LinkedIn)' },
  { id: 'events', label: 'Events / speaking' },
  { id: 'paid_ads', label: 'Paid ads' },
];

export default function GTMOnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    businessType: '',
    location: '',
    audienceLocations: [],
    goals: [],
    timeframe: '',
    budgetRange: '',
    weeklyHours: 5,
    teamType: '',
    channels: [],
    excludedChannels: '',
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'goals' | 'channels' | 'audienceLocations', item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('gtm_projects')
        .insert([{
          owner_user_id: user.id,
          mode: 'business_tool',
          name: data.businessName || 'My GTM Plan',
          description: `GTM plan for ${data.businessType}`,
          primary_goal: data.goals[0] || null,
          target_market: {
            audienceLocations: data.audienceLocations,
            businessType: data.businessType,
          },
          budget_range: data.budgetRange,
          timeframe: data.timeframe,
          status: 'draft',
          onboarding_data: data as any,
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Seed channels based on selections
      if (data.channels.length > 0) {
        const channelsToInsert = data.channels.map((channel, index) => ({
          gtm_project_id: project.id,
          channel_type: channel,
          priority: index < 3 ? 5 - index : 3,
          notes: null,
        }));

        await supabase.from('gtm_project_channels').insert(channelsToInsert);
      }

      // Seed default assumptions
      const defaultAssumptions = [
        { category: 'traffic', label: 'Monthly website visitors', value_numeric: 1000, is_key_assumption: true },
        { category: 'conversion', label: 'Visitor to subscriber rate', value_numeric: 3, is_key_assumption: true },
        { category: 'audience', label: 'Target audience size', value_text: data.audienceLocations.join(', '), is_key_assumption: false },
      ];

      await supabase.from('gtm_assumptions').insert(
        defaultAssumptions.map(a => ({ ...a, gtm_project_id: project.id }))
      );

      return project;
    },
    onSuccess: (project) => {
      toast.success('GTM plan created successfully!');
      navigate(`/business-tools/gtm/${project.id}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to create GTM plan: ' + error.message);
    },
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.businessName && data.businessType;
      case 2:
        return data.goals.length > 0 && data.timeframe;
      case 3:
        return data.budgetRange && data.teamType;
      case 4:
        return data.channels.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      createProjectMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isCompleted && "border-primary bg-primary/20 text-primary",
                  !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "hidden sm:block w-12 md:w-24 h-0.5 mx-2",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your business so we can tailor your GTM plan."}
              {currentStep === 2 && "What are you trying to achieve and when?"}
              {currentStep === 3 && "Help us understand your resources and capacity."}
              {currentStep === 4 && "Which marketing channels do you want to focus on?"}
              {currentStep === 5 && "Review your selections and create your plan."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: About Your Business */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business or show name *</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g., The Marketing Podcast"
                    value={data.businessName}
                    onChange={(e) => updateData('businessName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>What best describes you? *</Label>
                  <RadioGroup
                    value={data.businessType}
                    onValueChange={(value) => updateData('businessType', value)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {BUSINESS_TYPES.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type} className="cursor-pointer">{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Where are you primarily located?</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, USA"
                    value={data.location}
                    onChange={(e) => updateData('location', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Where is your audience located?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['US', 'UK', 'Canada', 'Australia', 'Europe', 'Global'].map(loc => (
                      <div key={loc} className="flex items-center space-x-2">
                        <Checkbox
                          id={`loc-${loc}`}
                          checked={data.audienceLocations.includes(loc)}
                          onCheckedChange={() => toggleArrayItem('audienceLocations', loc)}
                        />
                        <Label htmlFor={`loc-${loc}`} className="cursor-pointer">{loc}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Goals & Timeframe */}
            {currentStep === 2 && (
              <>
                <div className="space-y-3">
                  <Label>What are your top 1–3 goals for the next 3–12 months? *</Label>
                  <div className="space-y-2">
                    {GOALS.map(goal => (
                      <div key={goal.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={goal.id}
                          checked={data.goals.includes(goal.id)}
                          onCheckedChange={() => toggleArrayItem('goals', goal.id)}
                          disabled={!data.goals.includes(goal.id) && data.goals.length >= 3}
                        />
                        <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                      </div>
                    ))}
                  </div>
                  {data.goals.length >= 3 && (
                    <p className="text-sm text-muted-foreground">Maximum 3 goals selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Desired timeframe *</Label>
                  <Select value={data.timeframe} onValueChange={(v) => updateData('timeframe', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Budget & Capacity */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label>What's your approximate monthly marketing budget? *</Label>
                  <Select value={data.budgetRange} onValueChange={(v) => updateData('budgetRange', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_RANGES.map(br => (
                        <SelectItem key={br.value} value={br.value}>{br.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>How many hours per week can you or your team actually execute?</Label>
                  <div className="px-2">
                    <Slider
                      value={[data.weeklyHours]}
                      onValueChange={([value]) => updateData('weeklyHours', value)}
                      min={1}
                      max={40}
                      step={1}
                    />
                  </div>
                  <p className="text-center text-lg font-semibold">{data.weeklyHours} hours/week</p>
                </div>

                <div className="space-y-2">
                  <Label>Do you have an internal team, agency, or are you solo? *</Label>
                  <RadioGroup
                    value={data.teamType}
                    onValueChange={(value) => updateData('teamType', value)}
                    className="space-y-2"
                  >
                    {TEAM_TYPES.map(type => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={type.value} id={type.value} />
                        <Label htmlFor={type.value} className="cursor-pointer">{type.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* Step 4: Channel Preferences */}
            {currentStep === 4 && (
              <>
                <div className="space-y-3">
                  <Label>Which channels do you want to focus on? *</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CHANNELS.map(channel => (
                      <div key={channel.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={channel.id}
                          checked={data.channels.includes(channel.id)}
                          onCheckedChange={() => toggleArrayItem('channels', channel.id)}
                        />
                        <Label htmlFor={channel.id} className="cursor-pointer">{channel.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excludedChannels">Any channels you absolutely do NOT want to use?</Label>
                  <Textarea
                    id="excludedChannels"
                    placeholder="e.g., I don't want to do TikTok..."
                    value={data.excludedChannels}
                    onChange={(e) => updateData('excludedChannels', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Business</h4>
                    <p className="text-muted-foreground">{data.businessName}</p>
                    <p className="text-sm text-muted-foreground">{data.businessType}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Timeframe</h4>
                    <p className="text-muted-foreground">
                      {TIMEFRAMES.find(t => t.value === data.timeframe)?.label || '-'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Goals</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      {data.goals.map(g => (
                        <li key={g}>• {GOALS.find(goal => goal.id === g)?.label}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Budget & Team</h4>
                    <p className="text-muted-foreground text-sm">
                      {BUDGET_RANGES.find(b => b.value === data.budgetRange)?.label}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {data.weeklyHours} hours/week
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {TEAM_TYPES.find(t => t.value === data.teamType)?.label}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <h4 className="font-semibold mb-2">Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.channels.map(c => (
                        <span key={c} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                          {CHANNELS.find(ch => ch.id === c)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || createProjectMutation.isPending}
            className="gap-2"
          >
            {currentStep === 5 ? (
              createProjectMutation.isPending ? 'Creating...' : 'Create GTM Plan'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
