import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type AccountType } from '@/hooks/useAccountType';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PersonalizedQuestionsStepProps {
  accountType: AccountType;
  onComplete: (data: Record<string, any>) => void;
  onBack: () => void;
}

const accountTypeLabels: Record<AccountType, string> = {
  creator: 'Content Creator',
  podcaster: 'Podcaster',
  advertiser: 'Brand / Advertiser',
  agency: 'Agency / Manager',
  event_planner: 'Event Host / Speaker',
  brand: 'Explorer',
  studio_team: 'Studio / Production',
  admin: 'Administrator',
  influencer: 'Influencer',
};

export function PersonalizedQuestionsStep({ 
  accountType, 
  onComplete, 
  onBack 
}: PersonalizedQuestionsStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    onComplete(formData);
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const CheckboxGroup = ({ 
    label, 
    options, 
    fieldKey 
  }: { 
    label: string; 
    options: string[]; 
    fieldKey: string;
  }) => (
    <div className="space-y-4">
      <Label className="text-base sm:text-lg font-bold text-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <motion.div 
            key={option} 
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
              (formData[fieldKey] || []).includes(option)
                ? "bg-primary/10 border-primary/50 shadow-sm"
                : "bg-muted/30 border-border hover:border-primary/30 hover:bg-muted/50"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              const current = formData[fieldKey] || [];
              if (current.includes(option)) {
                updateField(fieldKey, current.filter((p: string) => p !== option));
              } else {
                updateField(fieldKey, [...current, option]);
              }
            }}
          >
            <Checkbox
              checked={(formData[fieldKey] || []).includes(option)}
              className="pointer-events-none h-5 w-5"
            />
            <label className="text-sm sm:text-base cursor-pointer font-medium">{option}</label>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderQuestions = () => {
    switch (accountType) {
      case 'creator':
      case 'podcaster':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Do you have an existing podcast?</Label>
              <Select onValueChange={(v) => updateField('hasPodcast', v)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I have a podcast</SelectItem>
                  <SelectItem value="no">No, I'm starting fresh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.hasPodcast === 'yes' && (
              <div className="space-y-3">
                <Label className="text-base sm:text-lg font-bold text-foreground">RSS Feed URL (optional)</Label>
                <Input
                  className="h-12 text-base"
                  placeholder="https://feeds.example.com/podcast.rss"
                  onChange={(e) => updateField('rssFeedUrl', e.target.value)}
                />
              </div>
            )}

            <CheckboxGroup
              label="Where do you publish content?"
              options={['YouTube', 'Spotify', 'Apple Podcasts', 'TikTok', 'Instagram', 'Twitter/X']}
              fieldKey="platforms"
            />
          </div>
        );

      case 'influencer':
        return (
          <div className="space-y-8">
            <CheckboxGroup
              label="What's your main platform?"
              options={['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Twitch']}
              fieldKey="platforms"
            />

            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Follower range</Label>
              <Select onValueChange={(v) => updateField('followerRange', v)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<10k">Under 10K</SelectItem>
                  <SelectItem value="10k-100k">10K - 100K</SelectItem>
                  <SelectItem value="100k-1m">100K - 1M</SelectItem>
                  <SelectItem value="1m+">1M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CheckboxGroup
              label="What are your goals?"
              options={['Brand Deals', 'Grow Audience', 'Monetize Content', 'AI Clips', 'Build Community', 'Events']}
              fieldKey="goals"
            />
          </div>
        );

      case 'advertiser':
      case 'brand':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Company Name</Label>
              <Input
                className="h-12 text-base"
                placeholder="Your company name"
                onChange={(e) => updateField('companyName', e.target.value)}
              />
            </div>

            <CheckboxGroup
              label="Advertising Goals"
              options={['Brand Awareness', 'Lead Generation', 'Podcast Ads', 'Creator Sponsorships', 'Event Promotion']}
              fieldKey="goals"
            />

            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Budget Range (optional)</Label>
              <Select onValueChange={(v) => updateField('budgetRange', v)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select budget range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1k">Less than $1,000/month</SelectItem>
                  <SelectItem value="1k-5k">$1,000 - $5,000/month</SelectItem>
                  <SelectItem value="5k-25k">$5,000 - $25,000/month</SelectItem>
                  <SelectItem value="25k+">$25,000+/month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'agency':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Agency Name</Label>
              <Input
                className="h-12 text-base"
                placeholder="Your agency name"
                onChange={(e) => updateField('agencyName', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">How many creators do you manage?</Label>
              <Select onValueChange={(v) => updateField('creatorCount', v)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 creators</SelectItem>
                  <SelectItem value="6-20">6-20 creators</SelectItem>
                  <SelectItem value="21-50">21-50 creators</SelectItem>
                  <SelectItem value="51+">51+ creators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Team Members' Emails (optional)</Label>
              <Textarea
                className="text-base min-h-[100px]"
                placeholder="john@example.com&#10;jane@example.com"
                rows={3}
                onChange={(e) => updateField('teamEmails', e.target.value)}
              />
            </div>
          </div>
        );

      case 'event_planner':
        return (
          <div className="space-y-8">
            <CheckboxGroup
              label="Event Type"
              options={['Virtual', 'Hybrid', 'In-Person']}
              fieldKey="eventTypes"
            />

            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Expected Attendee Size</Label>
              <Select onValueChange={(v) => updateField('attendeeSize', v)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select size..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<50">Less than 50</SelectItem>
                  <SelectItem value="50-200">50-200</SelectItem>
                  <SelectItem value="200-1000">200-1,000</SelectItem>
                  <SelectItem value="1000+">1,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'studio_team':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-base sm:text-lg font-bold text-foreground">Team/Studio Name</Label>
              <Input
                className="h-12 text-base"
                placeholder="Your studio name"
                onChange={(e) => updateField('studioName', e.target.value)}
              />
            </div>

            <CheckboxGroup
              label="What do you produce?"
              options={['Podcasts', 'Videos', 'Live Streams', 'Social Content', 'Ads', 'Events']}
              fieldKey="productions"
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="inline-flex p-5 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg">
              Great choice! Click Continue to see your personalized workspace.
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="p-6 sm:p-8 shadow-xl border-border/50 bg-gradient-to-br from-card to-muted/20 rounded-2xl">
      <div className="space-y-6">
        {/* Gradient header */}
        <div className="relative text-center">
          <div className="absolute inset-0 -mx-8 -mt-8 h-24 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-t-2xl" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4"
            >
              {accountTypeLabels[accountType]}
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold">Tell us more</h2>
            <p className="text-muted-foreground text-base mt-2">
              Help us personalize your experience
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pt-4"
        >
          {renderQuestions()}
        </motion.div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack} size="lg" className="h-12 px-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} size="lg" className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
