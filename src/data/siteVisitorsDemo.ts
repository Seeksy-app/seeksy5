// Demo data for Site Visitors / Website Leads

export interface SiteVisitor {
  id: string;
  name: string;
  email: string;
  company?: string;
  source: string;
  status: "new" | "contacted" | "converted" | "unresponsive";
  notes?: string;
  createdAt: string;
  pageVisited?: string;
  requestType?: string;
}

export const demoSiteVisitors: SiteVisitor[] = [
  {
    id: "sv-1",
    name: "Jennifer Adams",
    email: "jennifer.adams@startup.io",
    company: "Startup.io",
    source: "Landing Page - Pricing",
    status: "new",
    notes: "Requested enterprise pricing details",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/pricing",
    requestType: "Demo Request",
  },
  {
    id: "sv-2",
    name: "Michael Torres",
    email: "m.torres@mediagroup.com",
    company: "Media Group Inc",
    source: "Google Ads",
    status: "contacted",
    notes: "Called back, scheduling demo for next week",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/features/studio",
    requestType: "Demo Request",
  },
  {
    id: "sv-3",
    name: "Anna Kim",
    email: "anna@creativeco.com",
    company: "Creative Co",
    source: "Referral",
    status: "converted",
    notes: "Signed up for Pro plan",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/signup",
    requestType: "Sign Up",
  },
  {
    id: "sv-4",
    name: "Robert Chang",
    email: "rchang@enterprise.net",
    company: "Enterprise Net",
    source: "LinkedIn Campaign",
    status: "new",
    notes: "Interested in agency features",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/for-agencies",
    requestType: "Info Request",
  },
  {
    id: "sv-5",
    name: "Lisa Park",
    email: "lisa.park@podnetwork.fm",
    company: "Pod Network FM",
    source: "Blog Article",
    status: "contacted",
    notes: "Podcast network with 20+ shows, sent proposal",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/blog/podcast-monetization",
    requestType: "Demo Request",
  },
  {
    id: "sv-6",
    name: "David Miller",
    email: "david@influenceragency.co",
    company: "Influencer Agency Co",
    source: "Facebook Ads",
    status: "unresponsive",
    notes: "No response after 3 follow-ups",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/pricing",
    requestType: "Demo Request",
  },
  {
    id: "sv-7",
    name: "Sarah Johnson",
    email: "sarah@contentcreators.io",
    company: "Content Creators IO",
    source: "Organic Search",
    status: "new",
    notes: "Looking for voice certification features",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/features/voice-certification",
    requestType: "Info Request",
  },
  {
    id: "sv-8",
    name: "Chris Anderson",
    email: "chris@brandboost.com",
    company: "Brand Boost",
    source: "Partner Referral",
    status: "contacted",
    notes: "Referred by Acme Corp, very warm lead",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/for-brands",
    requestType: "Demo Request",
  },
  {
    id: "sv-9",
    name: "Emily Watson",
    email: "emily.w@streamstudio.tv",
    company: "Stream Studio TV",
    source: "YouTube Ad",
    status: "new",
    notes: "Interested in live streaming integration",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/features/streaming",
    requestType: "Demo Request",
  },
  {
    id: "sv-10",
    name: "James Wilson",
    email: "james@audiofirst.fm",
    company: "Audio First FM",
    source: "Twitter",
    status: "converted",
    notes: "Started free trial, upgraded to Business",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pageVisited: "/trial",
    requestType: "Free Trial",
  },
];

export const siteVisitorStats = {
  total: demoSiteVisitors.length,
  new: demoSiteVisitors.filter(v => v.status === "new").length,
  contacted: demoSiteVisitors.filter(v => v.status === "contacted").length,
  converted: demoSiteVisitors.filter(v => v.status === "converted").length,
  unresponsive: demoSiteVisitors.filter(v => v.status === "unresponsive").length,
};
