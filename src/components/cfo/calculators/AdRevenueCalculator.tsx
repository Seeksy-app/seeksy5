import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw, Save, Radio, Video, Mail, Monitor, Handshake, Info } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { CFO_ASSUMPTIONS_SCHEMA } from '@/lib/cfo-assumptions-schema';

interface Props {
  onSave?: (data?: Record<string, any>) => void;
}

const AD_SCHEMA = CFO_ASSUMPTIONS_SCHEMA.advertising;
const IMP_SCHEMA = CFO_ASSUMPTIONS_SCHEMA.impressions;

export function AdRevenueCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // CPMs from schema
  const [audioHostReadCPM, setAudioHostReadCPM] = useState(AD_SCHEMA.audio_cpm_hostread.default);
  const [audioProgrammaticCPM, setAudioProgrammaticCPM] = useState(AD_SCHEMA.audio_cpm_programmatic.default);
  const [videoCPM, setVideoCPM] = useState(AD_SCHEMA.video_cpm.default);
  const [newsletterCPM, setNewsletterCPM] = useState(AD_SCHEMA.newsletter_cpm.default);
  const [displayCPM, setDisplayCPM] = useState(AD_SCHEMA.display_cpm.default);

  // Fill rates from schema
  const [audioFillRate, setAudioFillRate] = useState(AD_SCHEMA.audio_fill_rate.default);
  const [videoFillRate, setVideoFillRate] = useState(AD_SCHEMA.video_fill_rate.default);
  const [newsletterFillRate, setNewsletterFillRate] = useState(AD_SCHEMA.newsletter_fill_rate.default);
  const [displayFillRate, setDisplayFillRate] = useState(AD_SCHEMA.display_fill_rate.default);

  // Impressions (based on mid-tier creator defaults from schema)
  const [audioImpressions, setAudioImpressions] = useState(IMP_SCHEMA.podcaster_mid.default * 2); // 50K monthly
  const [videoImpressions, setVideoImpressions] = useState(IMP_SCHEMA.video_mid.default); // 100K monthly
  const [newsletterImpressions, setNewsletterImpressions] = useState(50000);
  const [displayImpressions, setDisplayImpressions] = useState(100000);

  // Brand Deals
  const [brandDeals, setBrandDeals] = useState(50);
  const [brandDealValue, setBrandDealValue] = useState(5000);

  // Platform shares from schema
  const [hostreadPlatformShare, setHostreadPlatformShare] = useState(AD_SCHEMA.hostread_platform_share.default);
  const [programmaticPlatformShare, setProgrammaticPlatformShare] = useState(AD_SCHEMA.programmatic_platform_share.default);
  const [brandDealPlatformShare, setBrandDealPlatformShare] = useState(AD_SCHEMA.brand_deal_platform_share.default);

  // Load saved values - only run once on mount
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    setAudioHostReadCPM(getEffectiveValue('audio_cpm_hostread') || AD_SCHEMA.audio_cpm_hostread.default);
    setAudioProgrammaticCPM(getEffectiveValue('audio_cpm_programmatic') || AD_SCHEMA.audio_cpm_programmatic.default);
    setVideoCPM(getEffectiveValue('video_cpm') || AD_SCHEMA.video_cpm.default);
    setNewsletterCPM(getEffectiveValue('newsletter_cpm') || AD_SCHEMA.newsletter_cpm.default);
    setDisplayCPM(getEffectiveValue('display_cpm') || AD_SCHEMA.display_cpm.default);
    setAudioFillRate(getEffectiveValue('audio_fill_rate') || AD_SCHEMA.audio_fill_rate.default);
    setVideoFillRate(getEffectiveValue('video_fill_rate') || AD_SCHEMA.video_fill_rate.default);
    setNewsletterFillRate(getEffectiveValue('newsletter_fill_rate') || AD_SCHEMA.newsletter_fill_rate.default);
    setDisplayFillRate(getEffectiveValue('display_fill_rate') || AD_SCHEMA.display_fill_rate.default);
    setHostreadPlatformShare(getEffectiveValue('hostread_platform_share') || AD_SCHEMA.hostread_platform_share.default);
    setProgrammaticPlatformShare(getEffectiveValue('programmatic_platform_share') || AD_SCHEMA.programmatic_platform_share.default);
    setBrandDealPlatformShare(getEffectiveValue('brand_deal_platform_share') || AD_SCHEMA.brand_deal_platform_share.default);
    setInitialized(true);
  }, [getEffectiveValue, initialized]);

  // Calculate revenue per channel
  const calculateChannelRevenue = (impressions: number, cpm: number, fillRate: number) => {
    return (impressions * (fillRate / 100) * cpm) / 1000;
  };

  const audioHostReadRevenue = calculateChannelRevenue(audioImpressions, audioHostReadCPM, audioFillRate);
  const audioProgrammaticRevenue = calculateChannelRevenue(audioImpressions, audioProgrammaticCPM, audioFillRate);
  const videoRevenue = calculateChannelRevenue(videoImpressions, videoCPM, videoFillRate);
  const newsletterRevenue = calculateChannelRevenue(newsletterImpressions, newsletterCPM, newsletterFillRate);
  const displayRevenue = calculateChannelRevenue(displayImpressions, displayCPM, displayFillRate);
  const brandDealsRevenue = brandDeals * brandDealValue;

  // Platform vs creator shares
  const hostreadPlatformRevenue = audioHostReadRevenue * (hostreadPlatformShare / 100);
  const programmaticPlatformRevenue = audioProgrammaticRevenue * (programmaticPlatformShare / 100);
  const brandDealPlatformRevenue = brandDealsRevenue * (brandDealPlatformShare / 100);

  const totalGrossRevenue = audioHostReadRevenue + audioProgrammaticRevenue + videoRevenue + newsletterRevenue + displayRevenue + brandDealsRevenue;
  const avgPlatformShare = 30; // Simplified average for display/newsletter
  const totalPlatformRevenue = hostreadPlatformRevenue + programmaticPlatformRevenue + brandDealPlatformRevenue + 
    (videoRevenue + newsletterRevenue + displayRevenue) * (avgPlatformShare / 100);
  const totalCreatorPayout = totalGrossRevenue - totalPlatformRevenue;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatImpressions = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const handleReset = () => {
    setAudioHostReadCPM(AD_SCHEMA.audio_cpm_hostread.default);
    setAudioProgrammaticCPM(AD_SCHEMA.audio_cpm_programmatic.default);
    setVideoCPM(AD_SCHEMA.video_cpm.default);
    setNewsletterCPM(AD_SCHEMA.newsletter_cpm.default);
    setDisplayCPM(AD_SCHEMA.display_cpm.default);
    setAudioFillRate(AD_SCHEMA.audio_fill_rate.default);
    setVideoFillRate(AD_SCHEMA.video_fill_rate.default);
    setNewsletterFillRate(AD_SCHEMA.newsletter_fill_rate.default);
    setDisplayFillRate(AD_SCHEMA.display_fill_rate.default);
    setAudioImpressions(50000);
    setVideoImpressions(100000);
    setNewsletterImpressions(50000);
    setDisplayImpressions(100000);
    setBrandDeals(50);
    setBrandDealValue(5000);
    setHostreadPlatformShare(AD_SCHEMA.hostread_platform_share.default);
    setProgrammaticPlatformShare(AD_SCHEMA.programmatic_platform_share.default);
    setBrandDealPlatformShare(AD_SCHEMA.brand_deal_platform_share.default);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'audio_cpm_hostread', value: audioHostReadCPM },
      { metric_key: 'audio_cpm_programmatic', value: audioProgrammaticCPM },
      { metric_key: 'video_cpm', value: videoCPM },
      { metric_key: 'newsletter_cpm', value: newsletterCPM },
      { metric_key: 'display_cpm', value: displayCPM },
      { metric_key: 'audio_fill_rate', value: audioFillRate },
      { metric_key: 'video_fill_rate', value: videoFillRate },
      { metric_key: 'newsletter_fill_rate', value: newsletterFillRate },
      { metric_key: 'display_fill_rate', value: displayFillRate },
      { metric_key: 'hostread_platform_share', value: hostreadPlatformShare },
      { metric_key: 'programmatic_platform_share', value: programmaticPlatformShare },
      { metric_key: 'brand_deal_platform_share', value: brandDealPlatformShare },
    ]);
    onSave?.({
      audioHostReadCPM, audioProgrammaticCPM, videoCPM, newsletterCPM, displayCPM,
      audioFillRate, videoFillRate, newsletterFillRate, displayFillRate,
      brandDeals, brandDealValue,
      hostreadPlatformShare, programmaticPlatformShare, brandDealPlatformShare,
      totalGrossRevenue, totalPlatformRevenue, totalCreatorPayout,
    });
  };

  const channels = [
    { 
      name: AD_SCHEMA.audio_cpm_hostread.label, 
      icon: Radio, 
      impressions: audioImpressions,
      setImpressions: setAudioImpressions,
      cpm: audioHostReadCPM,
      setCpm: setAudioHostReadCPM,
      cpmConfig: AD_SCHEMA.audio_cpm_hostread,
      fillRate: audioFillRate,
      setFillRate: setAudioFillRate,
      revenue: audioHostReadRevenue,
    },
    { 
      name: AD_SCHEMA.audio_cpm_programmatic.label, 
      icon: Radio, 
      impressions: audioImpressions,
      setImpressions: setAudioImpressions,
      cpm: audioProgrammaticCPM,
      setCpm: setAudioProgrammaticCPM,
      cpmConfig: AD_SCHEMA.audio_cpm_programmatic,
      fillRate: audioFillRate,
      setFillRate: setAudioFillRate,
      revenue: audioProgrammaticRevenue,
    },
    { 
      name: AD_SCHEMA.video_cpm.label, 
      icon: Video, 
      impressions: videoImpressions,
      setImpressions: setVideoImpressions,
      cpm: videoCPM,
      setCpm: setVideoCPM,
      cpmConfig: AD_SCHEMA.video_cpm,
      fillRate: videoFillRate,
      setFillRate: setVideoFillRate,
      revenue: videoRevenue,
    },
    { 
      name: AD_SCHEMA.newsletter_cpm.label, 
      icon: Mail, 
      impressions: newsletterImpressions,
      setImpressions: setNewsletterImpressions,
      cpm: newsletterCPM,
      setCpm: setNewsletterCPM,
      cpmConfig: AD_SCHEMA.newsletter_cpm,
      fillRate: newsletterFillRate,
      setFillRate: setNewsletterFillRate,
      revenue: newsletterRevenue,
    },
    { 
      name: AD_SCHEMA.display_cpm.label, 
      icon: Monitor, 
      impressions: displayImpressions,
      setImpressions: setDisplayImpressions,
      cpm: displayCPM,
      setCpm: setDisplayCPM,
      cpmConfig: AD_SCHEMA.display_cpm,
      fillRate: displayFillRate,
      setFillRate: setDisplayFillRate,
      revenue: displayRevenue,
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              Ad Revenue Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust these sliders to update CFO assumptions. Click 'Save to Pro Forma' to apply them to all board forecasts.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Multi-Channel
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Channel Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {channels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-muted rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(channel.revenue)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Impressions</span>
                    <span>{formatImpressions(channel.impressions)}</span>
                  </div>
                  <Slider
                    value={[channel.impressions]}
                    onValueChange={([v]) => channel.setImpressions(v)}
                    min={5000}
                    max={10000000}
                    step={10000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">CPM</span>
                      <span>${channel.cpm}</span>
                    </div>
                    <Slider
                      value={[channel.cpm]}
                      onValueChange={([v]) => channel.setCpm(v)}
                      min={channel.cpmConfig.min}
                      max={channel.cpmConfig.max}
                      step={channel.cpmConfig.step}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Fill Rate</span>
                      <span>{channel.fillRate}%</span>
                    </div>
                    <Slider
                      value={[channel.fillRate]}
                      onValueChange={([v]) => channel.setFillRate(v)}
                      min={AD_SCHEMA.audio_fill_rate.min}
                      max={AD_SCHEMA.audio_fill_rate.max}
                      step={AD_SCHEMA.audio_fill_rate.step}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Brand Deals - Special Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-sm">Brand Deals</span>
              </div>
              <span className="text-sm font-bold text-amber-800">{formatCurrency(brandDealsRevenue)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700"># Deals/Year</span>
                <span>{brandDeals}</span>
              </div>
              <Slider
                value={[brandDeals]}
                onValueChange={([v]) => setBrandDeals(v)}
                min={10}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700">Avg Deal Value</span>
                <span>${brandDealValue.toLocaleString()}</span>
              </div>
              <Slider
                value={[brandDealValue]}
                onValueChange={([v]) => setBrandDealValue(v)}
                min={250}
                max={50000}
                step={250}
              />
            </div>
          </motion.div>
        </div>

        {/* Platform Shares */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-muted rounded-lg">
            <Label className="flex items-center justify-between mb-2 text-sm">
              <span>{AD_SCHEMA.hostread_platform_share.label}</span>
              <span className="font-medium">{hostreadPlatformShare}%</span>
            </Label>
            <Slider
              value={[hostreadPlatformShare]}
              onValueChange={([v]) => setHostreadPlatformShare(v)}
              min={AD_SCHEMA.hostread_platform_share.min}
              max={AD_SCHEMA.hostread_platform_share.max}
              step={AD_SCHEMA.hostread_platform_share.step}
            />
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <Label className="flex items-center justify-between mb-2 text-sm">
              <span>{AD_SCHEMA.programmatic_platform_share.label}</span>
              <span className="font-medium">{programmaticPlatformShare}%</span>
            </Label>
            <Slider
              value={[programmaticPlatformShare]}
              onValueChange={([v]) => setProgrammaticPlatformShare(v)}
              min={AD_SCHEMA.programmatic_platform_share.min}
              max={AD_SCHEMA.programmatic_platform_share.max}
              step={AD_SCHEMA.programmatic_platform_share.step}
            />
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <Label className="flex items-center justify-between mb-2 text-sm">
              <span>{AD_SCHEMA.brand_deal_platform_share.label}</span>
              <span className="font-medium">{brandDealPlatformShare}%</span>
            </Label>
            <Slider
              value={[brandDealPlatformShare]}
              onValueChange={([v]) => setBrandDealPlatformShare(v)}
              min={AD_SCHEMA.brand_deal_platform_share.min}
              max={AD_SCHEMA.brand_deal_platform_share.max}
              step={AD_SCHEMA.brand_deal_platform_share.step}
            />
          </div>
        </div>

        {/* Helper Text */}
        <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg mb-4">
          <Info className="w-4 h-4 text-purple-600 mt-0.5" />
          <p className="text-sm text-purple-800">
            Channel CPM and fill rates are seeded from industry benchmarks. Platform vs creator share drives gross margin in the Pro Forma.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-100 to-slate-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Gross Ad Revenue</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGrossRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-purple-600">Platform Share</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalPlatformRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-emerald-600">Creator Payout</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCreatorPayout)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
