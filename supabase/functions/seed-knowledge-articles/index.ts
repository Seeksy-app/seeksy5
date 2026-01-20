import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 10 Seed articles for the Knowledge Blog System
const seedArticles = [
  {
    portal: 'creator',
    section: 'AI Systems',
    category: 'AI Tools & Trends',
    title: "How Seeksy's AI Agents Transform Creator Productivity",
    slug: 'ai-agents-transform-creator-productivity',
    excerpt: 'Discover how AI-powered automation is revolutionizing content creation, scheduling, and audience engagement for modern creators.',
    purpose: 'Understanding AI tools is essential for creators who want to stay competitive. This article explores how Seeksy\'s AI agents can multiply your output while maintaining authenticity and quality.',
    expected_outcomes: 'After reading, you\'ll understand which AI features to prioritize, how to integrate them into your workflow, and the measurable productivity gains you can expect.',
    key_takeaways: [
      'AI agents can automate up to 60% of repetitive content tasks',
      'Voice cloning enables consistent branding across all audio content',
      'Automated scheduling increases posting consistency by 3x',
      'AI-generated show notes save 2-4 hours per episode',
      'Smart clip generation identifies viral-worthy moments automatically'
    ],
    content: `## The AI Revolution in Content Creation

The creator economy has reached an inflection point. With over 50 million people worldwide identifying as content creators, standing out requires more than just talent—it requires leverage. AI agents represent the most significant productivity multiplier available to creators today.

## Understanding Seeksy's AI Agent Architecture

Seeksy's AI system operates on three core principles: automation without losing authenticity, intelligence that learns your style, and seamless integration with existing workflows.

### Voice Identity & Cloning

Your voice is your brand. Seeksy's voice certification technology captures your unique vocal fingerprint and enables:
- Consistent ad reads across all episodes
- Automated audio responses to audience questions
- Multi-language content without re-recording
- Brand protection against voice deepfakes

### Content Intelligence Engine

The AI analyzes your content patterns to understand what resonates with your audience. It identifies:
- Optimal posting times based on engagement data
- Content themes that drive subscriber growth
- Clip moments with highest viral potential
- Topics your audience wants more of

## Practical Implementation Steps

**Week 1: Foundation Setup**
Complete voice certification and connect your primary content channels. The AI needs baseline data to begin learning your patterns.

**Week 2: Automation Activation**
Enable auto-generated show notes, transcripts, and social snippets. Monitor outputs and provide feedback to improve accuracy.

**Week 3: Advanced Features**
Activate smart scheduling, AI-powered clip generation, and automated audience engagement responses.

**Week 4: Optimization**
Review analytics, adjust AI parameters, and expand automation to additional content types.

## Measuring Success

Track these KPIs to measure AI impact:
- **Time saved per content piece**: Aim for 40-60% reduction
- **Posting consistency**: Track streak days and schedule adherence
- **Engagement rate changes**: Monitor before/after AI implementation
- **Content output volume**: Measure pieces published per week

## The Competitive Advantage

Creators using AI tools are publishing 3x more content with higher consistency. As these tools become standard, early adopters gain significant market advantage. The question isn't whether to adopt AI—it's how quickly you can integrate it effectively.`,
    execution_steps: [
      'Complete voice certification in Settings → Voice Identity',
      'Connect your primary podcast or content channel',
      'Enable auto-generated transcripts for your next episode',
      'Review AI-suggested clips and approve your first batch',
      'Set up automated posting schedule'
    ],
    questions: [
      'Which repetitive tasks consume most of your content creation time?',
      'How would 10 extra hours per week change your content strategy?',
      'What aspects of your voice and style are most important to preserve?',
      'How comfortable are you with AI making suggestions vs. automated decisions?',
      'What metrics would indicate successful AI integration for your channel?'
    ],
    screenshot_urls: ['/assets/screens/ai-dashboard.png', '/assets/screens/voice-certification.png'],
    is_published: true
  },
  {
    portal: 'board',
    section: 'Competitive Landscape',
    category: 'Industry Insights',
    title: 'The State of the Creator Economy — Insights from 2024-2025 Data',
    slug: 'state-of-creator-economy-2024-2025',
    excerpt: 'A comprehensive analysis of creator economy trends, market size projections, and strategic implications for platform positioning.',
    purpose: 'Board members need current market intelligence to make informed strategic decisions. This analysis synthesizes the latest industry data with Seeksy\'s positioning opportunities.',
    expected_outcomes: 'You\'ll gain clarity on market dynamics, competitive threats, and the specific inflection points that present strategic opportunities for Seeksy.',
    key_takeaways: [
      'Creator economy projected to reach $480B by 2027, up from $250B in 2023',
      'Audio/podcast segment growing 25% YoY, outpacing video',
      'Creator tools consolidation accelerating—acquisition activity up 40%',
      'Identity verification becoming table stakes for brand partnerships',
      'AI integration is primary differentiator for next-gen platforms'
    ],
    content: `## Executive Summary

The creator economy continues its trajectory toward mainstream economic significance. Current data indicates we're approaching two critical inflection points: AI-enabled production tools and identity/authenticity verification. Seeksy's positioning at this intersection represents significant strategic advantage.

## Market Size & Growth Trajectory

**Current Market (2024)**: $325 billion
**Projected Market (2027)**: $480 billion
**CAGR**: 14.2%

### Segment Breakdown

| Segment | 2024 Size | Growth Rate | Seeksy Relevance |
|---------|-----------|-------------|------------------|
| Podcasting | $42B | 25% | Core focus |
| Video Creation | $89B | 18% | Adjacent expansion |
| Creator Tools | $28B | 32% | Direct competition |
| Influencer Marketing | $21B | 16% | Monetization layer |

## Competitive Landscape Analysis

### Direct Competitors
- **Riverside**: Strong recording quality, weak on monetization
- **Restream**: Streaming focus, limited creator tools
- **Podmatch**: Guest matching only, no production tools

### Seeksy Differentiation Matrix

1. **Unified Platform**: Recording → Editing → Distribution → Monetization
2. **Identity Layer**: Voice + Face verification unique in market
3. **AI Integration**: Deepest AI feature set among competitors
4. **Enterprise Ready**: White-label capabilities for agency partnerships

## Strategic Inflection Points

### AI Inflection (Current)
Creators actively seeking AI tools for:
- Automated editing (83% interest)
- Content repurposing (76% interest)
- Audience analytics (71% interest)

**Seeksy Position**: First-mover advantage with integrated AI suite

### Identity Inflection (Emerging)
Brands demanding verified creators for:
- Authenticity assurance (deepfake protection)
- Contract compliance verification
- Content attribution tracking

**Seeksy Position**: Only platform with blockchain-verified identity

## Investment Implications

**Bull Case Factors**:
- Market tailwinds continue through 2027
- AI features drive 40% higher creator retention
- Identity verification becomes industry standard
- Enterprise/agency revenue accelerates

**Risk Factors**:
- Big Tech platform competition (Spotify, YouTube)
- Creator tools consolidation (acquisition pressure)
- Economic downturn impact on advertising spend`,
    execution_steps: [
      'Review quarterly competitive intelligence report',
      'Schedule strategic planning session with leadership',
      'Evaluate AI roadmap resource allocation',
      'Assess partnership pipeline against market opportunities'
    ],
    questions: [
      'How does Seeksy\'s current growth rate compare to market projections?',
      'Which competitive moats are most defensible long-term?',
      'What acquisition scenarios should we prepare for?',
      'How should we balance creator growth vs. revenue optimization?',
      'What metrics would indicate we\'re winning the AI inflection?'
    ],
    screenshot_urls: ['/assets/screens/market-analysis.png', '/assets/screens/competitive-matrix.png'],
    is_published: true
  },
  {
    portal: 'creator',
    section: 'Monetization',
    category: 'Creator Growth & Monetization',
    title: 'Top Trends in Podcast Monetization',
    slug: 'top-trends-podcast-monetization',
    excerpt: 'Explore the latest monetization strategies that successful podcasters are using to generate sustainable income from their content.',
    purpose: 'Monetization is the key to sustainable content creation. This article reveals the strategies that are actually working for podcasters in the current market.',
    expected_outcomes: 'You\'ll learn multiple revenue streams to implement, understand which monetization methods match your audience size, and have a clear action plan for increasing podcast income.',
    key_takeaways: [
      'Dynamic ad insertion increases CPM rates by 35% on average',
      'Premium subscriptions work best for podcasts with 5,000+ dedicated listeners',
      'Host-read ads command 2-3x higher rates than programmatic',
      'Merchandise success correlates with strong community engagement',
      'Multi-platform distribution expands monetization opportunities significantly'
    ],
    content: `## The Monetization Landscape in 2025

Podcast monetization has evolved dramatically. The days of needing millions of downloads to earn meaningful income are over. Today's creators have access to diverse revenue streams that work at every scale.

## Revenue Stream Breakdown

### 1. Dynamic Advertising

Dynamic ad insertion (DAI) has transformed podcast advertising. Instead of baked-in ads that stay forever, DAI allows:
- Fresh ads in back-catalog episodes
- Geo-targeted campaigns
- Real-time optimization based on performance
- Higher CPM rates through premium inventory

**Average CPM Rates (2025)**:
- Pre-roll: $18-25
- Mid-roll: $25-40
- Host-read mid-roll: $40-75

### 2. Subscription & Premium Content

Platforms like Seeksy enable creators to offer premium tiers. Successful subscription models include:
- Ad-free versions of regular episodes
- Extended cuts with bonus content
- Early access (24-48 hours ahead)
- Exclusive series for subscribers only
- Community access and direct engagement

**Conversion benchmarks**: 2-5% of regular listeners convert to paid subscribers when value proposition is clear.

### 3. Sponsorship Partnerships

Direct sponsorship deals remain the highest-earning opportunity for established podcasters:
- Niche audiences command premium rates
- Authentic host endorsement crucial
- Long-term partnerships outperform one-offs
- Package deals (podcast + newsletter + social) maximize value

## Matching Strategy to Audience Size

**0-1,000 downloads/episode**: Focus on affiliate relationships and building the audience.
**1,000-10,000 downloads/episode**: Introduce subscription tiers and seek first sponsorship deals.
**10,000-50,000 downloads/episode**: Full dynamic ad insertion, multiple sponsors per episode.
**50,000+ downloads/episode**: Enterprise sponsorships, live events, merchandise lines.`,
    execution_steps: [
      'Enable dynamic ad insertion in your podcast settings',
      'Set up a premium subscription tier with 2-3 clear benefits',
      'Research 5 potential affiliate partners in your niche',
      'Create a media kit for sponsor outreach',
      'Plan your first monetization experiment this month'
    ],
    questions: [
      'What does your current revenue per episode look like?',
      'Which monetization method aligns best with your audience relationship?',
      'How much content would you need to create for a premium tier?',
      'What products/services does your audience already buy?',
      'What\'s your 90-day revenue goal for the podcast?'
    ],
    screenshot_urls: ['/assets/screens/monetization-dashboard.png'],
    is_published: true
  },
  {
    portal: 'creator',
    section: 'Meetings',
    category: 'Meetings & Events Industry',
    title: 'Meetings & Events: What Creators Should Offer in 2025',
    slug: 'meetings-events-creators-2025',
    excerpt: 'Learn how to leverage meetings and events as a powerful creator revenue stream and audience engagement tool.',
    purpose: 'Events and meetings are underutilized by most creators. This guide shows you how to turn your expertise into bookable experiences.',
    expected_outcomes: 'You\'ll have a clear framework for creating meeting products, understand pricing strategies, and know how to promote your offerings.',
    key_takeaways: [
      'Creators offering 1:1 meetings earn 40% more than content-only creators',
      'Group workshops have the highest margin at 70-85%',
      'Automated booking reduces no-shows by 60%',
      'Event recordings become valuable premium content',
      'Community events increase listener retention by 3x'
    ],
    content: `## Why Meetings & Events Matter for Creators

Your audience wants more than content—they want access. The most successful creators in 2025 are building meeting and event offerings that create deeper connections while generating significant revenue.

## Types of Meeting Products

### 1. One-on-One Consultations
Perfect for creators with specialized expertise:
- Career coaching for aspiring podcasters
- Content strategy sessions
- Technical audio/video reviews
- Business consulting in your niche

**Pricing range**: $100-500 per hour depending on expertise level.

### 2. Group Masterclasses
Higher leverage than 1:1, with community building benefits:
- Topic-focused deep dives
- Q&A workshop formats
- Skill-building sessions
- Cohort-based programs

**Pricing range**: $50-200 per participant, 10-50 participants optimal.

### 3. Live Podcast Recordings
Transform content creation into an event:
- Audience watches recording live
- Real-time Q&A integration
- Behind-the-scenes access
- Community building opportunity

### 4. Virtual Meetups
Low-barrier community engagement:
- Monthly listener hangouts
- Topic discussion groups
- Networking sessions
- Guest meet-and-greets`,
    execution_steps: [
      'Define your primary expertise for 1:1 consultations',
      'Set up your booking calendar with availability',
      'Create a landing page for your meeting offerings',
      'Launch your first group event or workshop',
      'Collect feedback and iterate on your offerings'
    ],
    questions: [
      'What unique expertise can you offer in a meeting format?',
      'How much time can you dedicate to meetings weekly?',
      'What would your ideal client be willing to pay?',
      'How can meetings complement your existing content?',
      'What technology do you need to deliver great meetings?'
    ],
    screenshot_urls: ['/assets/screens/meeting-types.png', '/assets/screens/booking-calendar.png'],
    is_published: true
  },
  {
    portal: 'admin',
    section: 'Finance Ops',
    category: 'Industry Insights',
    title: 'Industry Breakdown: Firecrawl Data on Emerging Creator Niches',
    slug: 'firecrawl-emerging-creator-niches',
    excerpt: 'Analysis of web-scraped industry data revealing the fastest-growing creator niches and market opportunities.',
    purpose: 'Understanding emerging niches helps Seeksy prioritize features and target acquisition channels effectively.',
    expected_outcomes: 'You\'ll identify which creator segments are growing fastest and where Seeksy should focus product and marketing resources.',
    key_takeaways: [
      'AI-focused content creators growing 340% YoY',
      'Personal finance podcasters have highest advertiser demand',
      'B2B creators command premium sponsorship rates',
      'Health & wellness audio content expanding rapidly',
      'Local/community podcasts showing strong retention metrics'
    ],
    content: `## Data Collection Methodology

This analysis synthesizes data from our Firecrawl web intelligence system, aggregating insights from:
- Industry publications (TechCrunch, Podnews, Sounds Profitable)
- Social listening across major platforms
- Advertising marketplace trends
- Creator community forums and discussions

## Fastest Growing Niches

### 1. AI & Technology Commentary (340% YoY)
The explosion of AI tools has created massive demand for explainer content. Creators who can translate complex AI developments into accessible content are seeing unprecedented growth.

**Opportunity for Seeksy**: These creators need advanced AI production tools.

### 2. Personal Finance & Investing (180% YoY)
Economic uncertainty drives audiences to seek financial guidance. Podcast consumption in this category increased significantly.

**Opportunity for Seeksy**: High-value advertiser integrations.

### 3. B2B & Professional Development (125% YoY)
Remote work acceleration has professionals seeking career and industry content. These creators have smaller audiences but high-value listeners.

**Opportunity for Seeksy**: Enterprise/agency tier features.

## Advertiser Demand Analysis

| Niche | CPM Range | Brand Safety | Volume |
|-------|-----------|--------------|--------|
| Personal Finance | $45-80 | High | High |
| B2B/Professional | $35-60 | Very High | Medium |
| AI/Technology | $25-45 | Medium | Very High |
| Health/Wellness | $20-40 | Variable | High |

## Strategic Recommendations

1. **Feature prioritization**: Build tools that serve AI/tech and B2B creators
2. **Advertiser outreach**: Focus on finance and professional services brands
3. **Content marketing**: Position Seeksy as the platform for serious creators
4. **Partnership opportunities**: Integrate with industry-specific tools and communities`,
    execution_steps: [
      'Review niche-specific feature requests in product backlog',
      'Identify top creators in each emerging niche for outreach',
      'Assess current advertiser mix against high-demand categories',
      'Plan content marketing campaigns targeting emerging niches'
    ],
    questions: [
      'Which emerging niches align best with Seeksy\'s current strengths?',
      'How can we accelerate feature development for high-growth segments?',
      'What partnerships would give us access to these creator communities?',
      'How should we price features for premium B2B creators?',
      'What internal expertise do we need to serve these niches?'
    ],
    screenshot_urls: ['/assets/screens/firecrawl-dashboard.png'],
    is_published: true
  },
  {
    portal: 'creator',
    section: 'Studio Tools',
    category: 'How-To Articles',
    title: "How to Use Seeksy's Scheduling Tools to Grow Audience Trust",
    slug: 'scheduling-tools-audience-trust',
    excerpt: 'Master the art of consistent content delivery using Seeksy\'s scheduling and automation features.',
    purpose: 'Consistency builds audience trust. This guide shows you how to use Seeksy\'s tools to maintain a reliable content schedule.',
    expected_outcomes: 'You\'ll learn to set up automated workflows that ensure consistent content delivery without burning out.',
    key_takeaways: [
      'Consistent posting increases listener retention by 45%',
      'Batch recording sessions improve content quality',
      'Automated scheduling reduces missed episodes by 90%',
      'Buffer content protects against unexpected disruptions',
      'Analytics-driven timing optimizes audience engagement'
    ],
    content: `## The Power of Consistency

Audience trust is built through reliability. When listeners know exactly when to expect your content, they build it into their routines. This creates habit-forming engagement that drives long-term growth.

## Setting Up Your Content Calendar

### Step 1: Define Your Rhythm
Choose a publishing schedule you can maintain for 6+ months:
- **Daily**: High output, best for news/commentary
- **2-3x weekly**: Strong growth, sustainable for most creators
- **Weekly**: Standard for podcasters, highly manageable
- **Bi-weekly**: Works for long-form, high-production content

### Step 2: Batch Production
Record multiple episodes in single sessions:
- Reduces setup/teardown time
- Maintains consistent energy and quality
- Creates content buffer for busy periods
- Enables planned breaks without gaps

### Step 3: Schedule Automation
Use Seeksy's scheduling features to:
- Queue episodes for automatic publishing
- Set up social media cross-posting
- Schedule newsletter announcements
- Trigger automated listener notifications

## Building Your Buffer

Always maintain a 2-4 episode buffer:
- **Week 1-2**: Record current content
- **Week 3-4**: Build buffer episodes
- **Ongoing**: Maintain minimum 2-episode cushion

This buffer protects against illness, travel, equipment failures, and life events.`,
    execution_steps: [
      'Define your optimal publishing frequency',
      'Block recurring time for batch recording sessions',
      'Set up your first scheduled episode release',
      'Create your 2-episode content buffer',
      'Enable automated social posting for new episodes'
    ],
    questions: [
      'What publishing frequency can you realistically maintain?',
      'How many episodes can you record in a single batch session?',
      'What time of day do your listeners typically tune in?',
      'What backup plans do you have for unexpected disruptions?',
      'How will you measure if your schedule is working?'
    ],
    screenshot_urls: ['/assets/screens/scheduling-calendar.png', '/assets/screens/batch-recording.png'],
    is_published: true
  },
  {
    portal: 'creator',
    section: 'Branding & Identity',
    category: 'AI Tools & Trends',
    title: 'Why AI-Driven Content Verification (Voice + Face) Is the Next Big Thing',
    slug: 'ai-content-verification-voice-face',
    excerpt: 'Understand why content verification and creator identity are becoming essential for brand partnerships and audience trust.',
    purpose: 'The rise of AI-generated content creates both opportunities and challenges. Verified identity will differentiate authentic creators.',
    expected_outcomes: 'You\'ll understand why verification matters, how to complete the process, and how to leverage your verified status.',
    key_takeaways: [
      'Verified creators earn 25% higher sponsorship rates',
      'Brand safety concerns driving demand for authenticity proof',
      'Deepfake protection becoming creator insurance',
      'Blockchain certification provides permanent proof',
      'Early verification creates competitive advantage'
    ],
    content: `## The Authenticity Crisis

As AI-generated content becomes indistinguishable from human-created content, brands and audiences need proof of authenticity. This creates a massive opportunity for verified creators.

## Why Verification Matters

### For Brand Partnerships
Brands are increasingly requiring proof of creator authenticity:
- Protection against deepfake scandals
- Contract compliance verification
- FTC disclosure compliance
- Brand safety assurance

### For Audience Trust
Your audience wants to know you're real:
- Deepfake awareness is rising
- Verified badges signal authenticity
- Trust translates to engagement
- Authenticity drives loyalty

## The Verification Process

### Voice Certification
1. Record 30-second verification sample
2. AI creates unique voiceprint
3. Blockchain certification issued
4. Verification badge activated

### Face Verification
1. Upload high-quality photo
2. Complete liveness check
3. AI creates facial signature
4. Cross-reference with voice for dual verification

## Leveraging Your Verified Status

Once verified, prominently display your status:
- Add verification badge to all platforms
- Include in media kit and rate cards
- Highlight in sponsor communications
- Use verified embeds for content attribution`,
    execution_steps: [
      'Complete voice verification in Settings → Identity',
      'Add face verification for dual authentication',
      'Download your blockchain certificate',
      'Add verification badge to your media kit',
      'Update all platform bios with verified status'
    ],
    questions: [
      'How would verification impact your brand partnership opportunities?',
      'What concerns do you have about deepfakes and impersonation?',
      'How do your audience perceive authenticity and trust?',
      'What premium can you charge with verified creator status?',
      'How will you communicate your verified status to sponsors?'
    ],
    screenshot_urls: ['/assets/screens/voice-certification.png', '/assets/screens/face-verification.png'],
    is_published: true
  },
  {
    portal: 'board',
    section: 'Company Health',
    category: 'Seeksy Updates',
    title: "Board Overview: Seeksy's Multi-Layer Business Model Explained Simply",
    slug: 'seeksy-business-model-explained',
    excerpt: 'A clear breakdown of how Seeksy generates revenue across creator subscriptions, advertising, and enterprise services.',
    purpose: 'Board members need a clear understanding of the business model to evaluate strategic decisions and growth opportunities.',
    expected_outcomes: 'You\'ll understand each revenue stream, their relative contributions, and the strategic rationale behind the multi-layer approach.',
    key_takeaways: [
      'Three primary revenue streams with different growth trajectories',
      'Creator subscriptions provide predictable recurring revenue',
      'Advertising creates performance-based upside',
      'Enterprise/white-label offers high-margin expansion',
      'Each layer reinforces the others in a flywheel effect'
    ],
    content: `## Revenue Architecture Overview

Seeksy operates a multi-layer business model designed for both stability and upside. Each layer serves different market segments while creating synergies.

## Layer 1: Creator Subscriptions

**Model**: Monthly/annual SaaS subscriptions
**Target**: Individual creators and small teams
**Pricing**: $0-99/month across tiers

### Tier Structure
- **Free**: Basic recording, limited storage
- **Pro ($19/mo)**: Full features, 50GB storage
- **Business ($49/mo)**: Team features, priority support
- **Enterprise ($99/mo)**: White-label, API access

### Key Metrics
- MRR growth: 15% MoM
- Churn rate: 4.2%
- LTV:CAC ratio: 4.8:1

## Layer 2: Advertising Marketplace

**Model**: Performance-based advertising with revenue share
**Target**: Brands seeking creator audiences
**Pricing**: CPM-based with creator splits

### Revenue Share
- Platform: 30%
- Creator: 70%

### Ad Products
- Dynamic audio ads (programmatic)
- Host-read sponsorships (premium)
- Conversational AI ads (innovative)

## Layer 3: Enterprise & White-Label

**Model**: High-touch enterprise contracts
**Target**: Agencies, networks, media companies
**Pricing**: Custom contracts ($10K-100K/year)

### Offerings
- White-label platform deployment
- Custom integrations and API access
- Dedicated support and SLAs
- Custom feature development

## The Flywheel Effect

Each layer reinforces the others:
1. Free tier attracts creators → builds audience inventory
2. Audience inventory attracts advertisers → generates ad revenue
3. Ad revenue attracts premium creators → increases subscription conversion
4. Premium creators attract enterprise clients → unlocks high-margin contracts
5. Enterprise relationships provide industry credibility → attracts more creators`,
    execution_steps: [
      'Review current revenue mix by layer',
      'Assess growth trajectory for each stream',
      'Evaluate pricing optimization opportunities',
      'Monitor flywheel metrics monthly'
    ],
    questions: [
      'Which revenue layer should receive priority investment?',
      'How do we balance creator growth with monetization pressure?',
      'What enterprise partnerships would accelerate Layer 3?',
      'How should pricing evolve as the market matures?',
      'What competitive threats exist for each layer?'
    ],
    screenshot_urls: ['/assets/screens/revenue-dashboard.png', '/assets/screens/business-model.png'],
    is_published: true
  },
  {
    portal: 'admin',
    section: 'AI Systems',
    category: 'How-To Articles',
    title: 'Creator Onboarding Funnel Optimization — Data-Driven Guide',
    slug: 'creator-onboarding-optimization',
    excerpt: 'Analyze and optimize the creator onboarding funnel using behavioral data and conversion metrics.',
    purpose: 'Improving onboarding conversion directly impacts growth. This guide provides data-driven approaches to funnel optimization.',
    expected_outcomes: 'You\'ll understand current funnel performance, identify optimization opportunities, and have a testing roadmap.',
    key_takeaways: [
      'First 7 days determine 80% of long-term retention',
      'Activation milestone completion predicts paid conversion',
      'Personalized onboarding increases completion by 35%',
      'Friction points identified through drop-off analysis',
      'A/B testing framework enables continuous improvement'
    ],
    content: `## Current Funnel Analysis

Understanding the creator journey from signup to activated user is critical for growth optimization.

## Funnel Stages

### Stage 1: Registration (100%)
- Email/social signup
- Basic profile creation
- Initial preferences

**Current conversion**: 100% (baseline)

### Stage 2: Profile Completion (72%)
- Upload avatar
- Add bio and links
- Connect social accounts

**Drop-off reasons**: Friction, unclear value

### Stage 3: First Content (48%)
- Record first episode/video
- Complete studio setup
- Publish initial content

**Drop-off reasons**: Technical barriers, time investment

### Stage 4: Engagement (31%)
- Receive first listener/viewer
- Complete distribution setup
- Achieve first milestone

**Drop-off reasons**: Lack of immediate results

### Stage 5: Activation (24%)
- Publish 3+ pieces of content
- Build initial audience
- Explore monetization

**Drop-off reasons**: Sustainability concerns

## Optimization Opportunities

### Quick Wins
1. Reduce registration fields (currently 6, target 3)
2. Add progress indicators to onboarding
3. Offer templates for first content
4. Celebrate milestone achievements visibly

### Medium-Term
1. Implement AI-guided onboarding assistant
2. Create role-specific onboarding paths
3. Add social proof at decision points
4. Build creator success stories library

### Strategic
1. Develop cohort-based onboarding programs
2. Create mentorship matching system
3. Build community integration from day one
4. Implement predictive churn intervention`,
    execution_steps: [
      'Review current funnel metrics by stage',
      'Identify highest-impact drop-off points',
      'Design A/B tests for quick win opportunities',
      'Implement tracking for new optimization metrics',
      'Schedule monthly funnel review cadence'
    ],
    questions: [
      'Which funnel stage has the highest leverage for improvement?',
      'What resources are available for onboarding optimization?',
      'How do we balance conversion optimization with user experience?',
      'What cohort-based insights should we track?',
      'How does onboarding performance vary by creator type?'
    ],
    screenshot_urls: ['/assets/screens/funnel-analytics.png', '/assets/screens/onboarding-flow.png'],
    is_published: true
  },
  {
    portal: 'creator',
    section: 'Growth',
    category: 'Podcasting Industry',
    title: 'The Rise of Short-Form Video for Podcasters — What the Data Shows',
    slug: 'short-form-video-podcasters-data',
    excerpt: 'Discover how short-form video clips are driving podcast growth and learn strategies to leverage this trend.',
    purpose: 'Short-form video is the most effective podcast discovery channel. This analysis shows how to capitalize on this trend.',
    expected_outcomes: 'You\'ll understand the short-form video landscape, learn clip creation best practices, and have a distribution strategy.',
    key_takeaways: [
      'Podcast clips drive 40% of new listener discovery',
      'Vertical video outperforms horizontal by 3x for discovery',
      'Captions increase watch time by 80%',
      'First 3 seconds determine scroll-stop rate',
      'Consistent posting compounds reach over time'
    ],
    content: `## The Discovery Revolution

Short-form video has fundamentally changed how audiences discover podcasts. Understanding this shift is essential for growth.

## Platform Landscape

### TikTok
- 1B+ monthly active users
- Highest discovery potential
- Algorithm favors new creators
- 60-second sweet spot

### YouTube Shorts
- 2B+ monthly active users
- Strong podcast audience overlap
- Monetization potential
- Links to full episodes

### Instagram Reels
- 2B+ monthly active users
- Established creator audiences
- Strong engagement features
- Story integration

### LinkedIn (for B2B)
- 900M+ members
- Professional content niche
- High-value audience
- Native video growing

## Clip Strategy Framework

### Content Selection
Identify moments that work as standalone clips:
- Surprising insights or hot takes
- Emotional or funny moments
- Clear, quotable statements
- Valuable tips or advice
- Controversial opinions

### Optimization Checklist
- Hook in first 3 seconds
- Captions throughout
- Vertical format (9:16)
- Clear audio quality
- On-screen text for key points
- Call to action at end

### Posting Cadence
- **Minimum**: 3 clips per episode
- **Optimal**: 5-7 clips per episode
- **Advanced**: Daily posting schedule
- **Consistency**: Same time each day

## Measuring Success

Track these metrics:
- View-to-listen conversion rate
- Average watch time
- Share/save rate
- New subscriber attribution
- Cross-platform growth correlation`,
    execution_steps: [
      'Identify 5 clip-worthy moments from your latest episode',
      'Create your first batch of vertical clips with captions',
      'Set up accounts on TikTok, Shorts, and Reels',
      'Establish a consistent posting schedule',
      'Track attribution from clips to full episode listens'
    ],
    questions: [
      'Which moments in your content naturally lend themselves to clips?',
      'What platforms does your target audience spend time on?',
      'How will you maintain clip quality at scale?',
      'What resources do you need for consistent clip production?',
      'How will you measure clip-to-listener conversion?'
    ],
    screenshot_urls: ['/assets/screens/clip-studio.png', '/assets/screens/short-form-analytics.png'],
    is_published: true
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Seeding knowledge articles...');

    // Check if articles already exist
    const { data: existing } = await supabase
      .from('knowledge_articles')
      .select('slug')
      .in('slug', seedArticles.map(a => a.slug));

    const existingSlugs = new Set(existing?.map(e => e.slug) || []);
    const newArticles = seedArticles.filter(a => !existingSlugs.has(a.slug));

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'All seed articles already exist', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new articles
    const { data, error } = await supabase
      .from('knowledge_articles')
      .insert(newArticles)
      .select();

    if (error) {
      console.error('Error inserting articles:', error);
      throw error;
    }

    console.log(`Seeded ${data?.length || 0} knowledge articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Seeded ${data?.length || 0} new articles`,
        count: data?.length || 0,
        articles: data?.map(a => ({ id: a.id, title: a.title, portal: a.portal }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Seed error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
