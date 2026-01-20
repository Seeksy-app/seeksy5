/**
 * Advertiser API
 * Handles advertiser account management, campaigns, and ad scripts
 */

export interface AdScript {
  id: string;
  campaignId: string;
  brandName: string;
  title: string;
  scriptText: string;
  readLengthSeconds: number;
  tags: string[];
}

export interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  status: "draft" | "active" | "paused";
  targeting: string[];
  budget?: number;
}

export interface AdvertiserAccount {
  id: string;
  companyName: string;
  contactEmail: string;
  createdAt: Date;
}

/**
 * Create a new advertiser account
 */
export const createAdvertiserAccount = async (
  accountData: Omit<AdvertiserAccount, 'id' | 'createdAt'>
): Promise<{ account: AdvertiserAccount }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const account: AdvertiserAccount = {
    id: `advertiser_${Date.now()}`,
    ...accountData,
    createdAt: new Date(),
  };

  console.log('[Advertiser API] Account created:', account.id);
  
  return { account };
};

/**
 * Create a new advertising campaign
 */
export const createCampaign = async (
  advertiserId: string,
  campaignData: Omit<Campaign, 'id'>
): Promise<{ campaign: Campaign }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const campaign: Campaign = {
    id: `campaign_${Date.now()}`,
    ...campaignData,
  };

  console.log('[Advertiser API] Campaign created:', campaign.id);
  
  return { campaign };
};

/**
 * Upload a new ad script for a campaign
 */
export const uploadAdScript = async (
  campaignId: string,
  scriptData: Omit<AdScript, 'id'>
): Promise<{ adScript: AdScript }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const adScript: AdScript = {
    id: `script_${Date.now()}`,
    ...scriptData,
  };

  console.log('[Advertiser API] Ad script uploaded:', adScript.id);
  
  return { adScript };
};

/**
 * List all ad scripts for a specific show
 */
export const listAdScriptsForShow = async (showId: string): Promise<{ scripts: AdScript[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data - would filter by showId in production
  const scripts: AdScript[] = [
    {
      id: 'script_1',
      campaignId: 'campaign_1',
      brandName: 'TechCorp',
      title: 'New Product Launch',
      scriptText: 'This episode is brought to you by TechCorp. Discover our revolutionary new product that will transform your workflow. Visit techcorp.com and use code PODCAST20 for 20% off your first order.',
      readLengthSeconds: 30,
      tags: ['technology', 'productivity'],
    },
    {
      id: 'script_2',
      campaignId: 'campaign_2',
      brandName: 'HealthPlus',
      title: 'Wellness Program',
      scriptText: 'Today\'s episode is sponsored by HealthPlus. Join millions who have transformed their health with our personalized wellness program. Get started today at healthplus.com.',
      readLengthSeconds: 25,
      tags: ['health', 'wellness'],
    },
  ];

  console.log('[Advertiser API] Ad scripts listed for show:', showId, scripts.length);
  
  return { scripts };
};

/**
 * List all available ad scripts (for testing/development)
 */
export const listAdScriptsForAllShows = async (): Promise<{ scripts: AdScript[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const scripts: AdScript[] = [
    {
      id: 'script_1',
      campaignId: 'campaign_1',
      brandName: 'TechCorp',
      title: 'New Product Launch',
      scriptText: 'This episode is brought to you by TechCorp. Discover our revolutionary new product that will transform your workflow. Visit techcorp.com and use code PODCAST20 for 20% off your first order.',
      readLengthSeconds: 30,
      tags: ['technology', 'productivity'],
    },
    {
      id: 'script_2',
      campaignId: 'campaign_2',
      brandName: 'HealthPlus',
      title: 'Wellness Program',
      scriptText: 'Today\'s episode is sponsored by HealthPlus. Join millions who have transformed their health with our personalized wellness program. Get started today at healthplus.com.',
      readLengthSeconds: 25,
      tags: ['health', 'wellness'],
    },
    {
      id: 'script_3',
      campaignId: 'campaign_1',
      brandName: 'EduLearn',
      title: 'Online Courses Special',
      scriptText: 'This podcast is brought to you by EduLearn. Master any skill with expert-led courses. Sign up today and get your first month free. Visit edulearn.com/podcast.',
      readLengthSeconds: 20,
      tags: ['education', 'learning'],
    },
  ];

  console.log('[Advertiser API] All ad scripts listed:', scripts.length);
  
  return { scripts };
};

/**
 * Attach an ad script to an episode at a specific timestamp
 */
export const attachAdScriptToEpisode = async (
  episodeId: string,
  adScriptId: string,
  timestamp: number
): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('[Advertiser API] Ad script attached to episode:', {
    episodeId,
    adScriptId,
    timestamp,
  });
  
  return { success: true };
};

/**
 * List all campaigns for an advertiser
 */
export const listCampaigns = async (advertiserId: string): Promise<{ campaigns: Campaign[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data
  const campaigns: Campaign[] = [
    {
      id: 'campaign_1',
      advertiserId,
      name: 'Q1 Product Launch',
      status: 'active',
      targeting: ['technology', 'business'],
      budget: 5000,
    },
    {
      id: 'campaign_2',
      advertiserId,
      name: 'Brand Awareness',
      status: 'active',
      targeting: ['lifestyle', 'wellness'],
      budget: 3000,
    },
    {
      id: 'campaign_3',
      advertiserId,
      name: 'Holiday Special',
      status: 'draft',
      targeting: ['general'],
      budget: 2000,
    },
  ];

  console.log('[Advertiser API] Campaigns listed:', campaigns.length);
  
  return { campaigns };
};

/**
 * Get campaign details by ID
 */
export const getCampaignById = async (campaignId: string): Promise<{ campaign: Campaign }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data
  const campaign: Campaign = {
    id: campaignId,
    advertiserId: 'advertiser_1',
    name: 'Q1 Product Launch',
    status: 'active',
    targeting: ['technology', 'business'],
    budget: 5000,
  };

  console.log('[Advertiser API] Campaign retrieved:', campaignId);
  
  return { campaign };
};

/**
 * List all ad scripts for a campaign
 */
export const listAdScriptsForCampaign = async (campaignId: string): Promise<{ scripts: AdScript[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data - filter by campaignId
  const allScripts = await listAdScriptsForAllShows();
  const scripts = allScripts.scripts.filter(s => s.campaignId === campaignId);

  console.log('[Advertiser API] Ad scripts for campaign:', campaignId, scripts.length);
  
  return { scripts };
};
