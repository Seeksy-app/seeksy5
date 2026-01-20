export interface SponsorshipPackage {
  name: string;
  price: number;
  highlights: string[];
}

export interface Sponsorship {
  id: string;
  title: string;
  type: 'event' | 'awards';
  hostName: string;
  hostAvatarUrl: string;
  eventDate: string;
  dateRange?: string;
  location: string;
  estimatedAttendees: number;
  estimatedOnlineReach: number;
  audienceSummary: string;
  packages: SponsorshipPackage[];
  linkedCreatorIds?: string[];
  description: string;
  includedMedia: string[];
}

export const demoSponsorships: Sponsorship[] = [
  // Event Sponsorships
  {
    id: 'sp-event-1',
    title: 'Creator Summit Live 2025',
    type: 'event',
    hostName: 'Seeksy Events',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SE',
    eventDate: '2025-03-15',
    dateRange: 'March 15-17, 2025',
    location: 'Austin, TX',
    estimatedAttendees: 2500,
    estimatedOnlineReach: 150000,
    audienceSummary: 'Marketing leaders, brand managers & content creators',
    description: 'The premier gathering for content creators, podcasters, and digital entrepreneurs. Three days of keynotes, workshops, and networking opportunities.',
    packages: [
      { name: 'Platinum', price: 25000, highlights: ['Main stage naming rights', 'VIP lounge sponsorship', '10 creator podcast mentions', 'Premium booth location'] },
      { name: 'Gold', price: 15000, highlights: ['Stage mention', 'Logo on step & repeat', '5 creator podcast mentions', 'Standard booth'] },
      { name: 'Silver', price: 7500, highlights: ['Logo on event materials', '2 creator podcast mentions', 'Digital presence'] },
    ],
    linkedCreatorIds: ['cr-1', 'cr-2', 'cr-3'],
    includedMedia: ['Podcast ad bundle (5 shows)', 'Social media posts (10 creators)', 'Event livestream mentions'],
  },
  {
    id: 'sp-event-2',
    title: 'Podcast Awards Night',
    type: 'event',
    hostName: 'Audio Creators Guild',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ACG',
    eventDate: '2025-04-22',
    location: 'Los Angeles, CA',
    estimatedAttendees: 800,
    estimatedOnlineReach: 500000,
    audienceSummary: 'Podcast industry professionals & audio content enthusiasts',
    description: 'Celebrate the best in podcasting at this prestigious awards ceremony honoring top shows, hosts, and producers.',
    packages: [
      { name: 'Title Sponsor', price: 50000, highlights: ['Event naming rights', 'Award category sponsorship', 'Red carpet branding', '15 podcast ad reads'] },
      { name: 'Gold', price: 20000, highlights: ['Stage branding', 'VIP table', '8 podcast ad reads', 'Press release inclusion'] },
      { name: 'Silver', price: 10000, highlights: ['Logo placement', '4 podcast ad reads', 'Social media mentions'] },
    ],
    linkedCreatorIds: ['cr-4', 'cr-5'],
    includedMedia: ['Award show livestream ads', 'Nominee podcast features', 'Post-event highlight reel'],
  },
  {
    id: 'sp-event-3',
    title: 'Veteran Voices Live Tour',
    type: 'event',
    hostName: 'Veterans Media Network',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=VMN',
    eventDate: '2025-05-10',
    dateRange: 'May 10 - June 15, 2025',
    location: 'Multi-city Tour (5 cities)',
    estimatedAttendees: 5000,
    estimatedOnlineReach: 250000,
    audienceSummary: 'Veterans, military families & patriotic audiences',
    description: 'A touring live podcast experience featuring veteran creators sharing stories of service, transition, and entrepreneurship.',
    packages: [
      { name: 'Tour Sponsor', price: 75000, highlights: ['All 5 cities branding', 'Meet & greet access', '20 podcast episodes', 'Documentary feature'] },
      { name: 'City Sponsor', price: 18000, highlights: ['Single city naming', 'Local media coverage', '4 podcast episodes', 'VIP tickets'] },
      { name: 'Supporter', price: 5000, highlights: ['Logo on tour materials', '2 podcast mentions', 'Social recognition'] },
    ],
    linkedCreatorIds: ['cr-6'],
    includedMedia: ['Tour documentary series', 'Veteran podcast network ads', 'Social media campaign'],
  },
  {
    id: 'sp-event-4',
    title: 'Tech Influencer Summit',
    type: 'event',
    hostName: 'Future Tech Media',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FTM',
    eventDate: '2025-06-20',
    dateRange: 'June 20-21, 2025',
    location: 'San Francisco, CA',
    estimatedAttendees: 1200,
    estimatedOnlineReach: 800000,
    audienceSummary: 'Tech enthusiasts, developers & SaaS founders',
    description: 'Where tech creators meet innovation. Product launches, hands-on demos, and creator collaborations.',
    packages: [
      { name: 'Innovation Partner', price: 40000, highlights: ['Product demo stage', 'Creator reviews (10)', 'Booth + lounge', 'Keynote slot'] },
      { name: 'Gold', price: 18000, highlights: ['Demo booth', 'Creator reviews (5)', 'Panel sponsorship'] },
      { name: 'Bronze', price: 8000, highlights: ['Logo placement', 'Creator reviews (2)', 'Networking access'] },
    ],
    linkedCreatorIds: ['cr-7', 'cr-8'],
    includedMedia: ['Tech YouTube reviews', 'Podcast deep-dives', 'Live unboxing streams'],
  },
  // Awards Sponsorships
  {
    id: 'sp-awards-1',
    title: 'Seeksy Creator Awards 2025',
    type: 'awards',
    hostName: 'Seeksy',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Seeksy',
    eventDate: '2025-09-15',
    location: 'Virtual + NYC Gala',
    estimatedAttendees: 500,
    estimatedOnlineReach: 2000000,
    audienceSummary: 'Content creators, brands & digital media professionals',
    description: 'The ultimate recognition for content excellence. Honoring top creators across podcasting, video, and social media.',
    packages: [
      { name: 'Presenting Sponsor', price: 100000, highlights: ['Awards show naming', 'All category presence', '50 creator mentions', 'Gala hosting rights'] },
      { name: 'Category Sponsor', price: 30000, highlights: ['Award category naming', '10 creator mentions', 'VIP gala access', 'Winner announcement'] },
      { name: 'Supporting Sponsor', price: 12000, highlights: ['Logo on broadcast', '3 creator mentions', 'Gala tickets'] },
    ],
    linkedCreatorIds: ['cr-1', 'cr-2', 'cr-3', 'cr-4'],
    includedMedia: ['Awards ceremony broadcast', 'Winner announcement campaigns', 'Year-long "Presented by" branding'],
  },
  {
    id: 'sp-awards-2',
    title: 'Top Podcast of the Year',
    type: 'awards',
    hostName: 'Podcast Industry Association',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=PIA',
    eventDate: '2025-11-08',
    location: 'Chicago, IL',
    estimatedAttendees: 600,
    estimatedOnlineReach: 750000,
    audienceSummary: 'Podcast hosts, producers & audio industry executives',
    description: 'Recognizing excellence in podcast content, production, and audience engagement across all genres.',
    packages: [
      { name: 'Grand Sponsor', price: 45000, highlights: ['Event naming rights', '3 category sponsorships', 'Keynote opportunity', 'Industry report feature'] },
      { name: 'Gold', price: 22000, highlights: ['Category sponsorship', 'Panel moderation', '8 podcast features'] },
      { name: 'Silver', price: 9000, highlights: ['Logo visibility', '3 podcast features', 'Reception sponsorship'] },
    ],
    linkedCreatorIds: ['cr-5', 'cr-6'],
    includedMedia: ['Nominee podcast ad rotation', 'Industry newsletter features', 'Award winner interviews'],
  },
  {
    id: 'sp-awards-3',
    title: 'Rising Star Creators Awards',
    type: 'awards',
    hostName: 'New Creator Collective',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NCC',
    eventDate: '2025-08-20',
    location: 'Virtual Event',
    estimatedAttendees: 0,
    estimatedOnlineReach: 500000,
    audienceSummary: 'Emerging creators, Gen-Z audiences & creator economy investors',
    description: 'Celebrating breakthrough creators who are shaping the future of digital content and community building.',
    packages: [
      { name: 'Champion Sponsor', price: 35000, highlights: ['All categories naming', 'Creator grant funding', 'Mentorship program access', 'Year-long partnership'] },
      { name: 'Supporter', price: 15000, highlights: ['2 category sponsorships', 'Creator shoutouts (20)', 'Social campaign'] },
      { name: 'Friend', price: 6000, highlights: ['Logo placement', 'Creator shoutouts (5)', 'Newsletter feature'] },
    ],
    linkedCreatorIds: ['cr-7', 'cr-8'],
    includedMedia: ['Rising star creator campaigns', 'TikTok/Reels features', 'Cross-platform promotion'],
  },
  {
    id: 'sp-awards-4',
    title: 'Business Podcast Excellence Awards',
    type: 'awards',
    hostName: 'B2B Audio Network',
    hostAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=B2B',
    eventDate: '2025-10-12',
    location: 'New York, NY',
    estimatedAttendees: 400,
    estimatedOnlineReach: 300000,
    audienceSummary: 'Business executives, entrepreneurs & B2B marketers',
    description: 'Honoring podcasts that drive business conversations, thought leadership, and professional development.',
    packages: [
      { name: 'Executive Sponsor', price: 55000, highlights: ['Gala title sponsor', 'CEO roundtable access', 'Industry report sponsorship', '15 B2B podcast features'] },
      { name: 'Gold', price: 25000, highlights: ['Award category naming', 'Networking dinner host', '8 podcast features'] },
      { name: 'Silver', price: 11000, highlights: ['Brand visibility', '4 podcast features', 'Attendee list access'] },
    ],
    linkedCreatorIds: ['cr-1', 'cr-4'],
    includedMedia: ['B2B podcast ad series', 'Executive interview series', 'LinkedIn thought leadership'],
  },
];

export const getSponsorshipById = (id: string): Sponsorship | undefined => {
  return demoSponsorships.find(s => s.id === id);
};

export const getEventSponsorships = (): Sponsorship[] => {
  return demoSponsorships.filter(s => s.type === 'event');
};

export const getAwardsSponsorships = (): Sponsorship[] => {
  return demoSponsorships.filter(s => s.type === 'awards');
};
