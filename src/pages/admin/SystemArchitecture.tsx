import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Layers, 
  Database, 
  Cloud, 
  Shield, 
  Zap,
  ArrowRight,
  Server,
  Lock,
  Bell,
  Brain,
  HardDrive,
  Globe,
  CreditCard,
  Mic,
  Video,
  Calendar,
  Mail,
  MessageSquare,
  BarChart3,
  Megaphone,
  HeadphonesIcon,
  FileText,
  Rss,
  Bot
} from "lucide-react";

const userRoles = [
  { name: "Creator", color: "bg-emerald-500", description: "Content creators, podcasters, influencers" },
  { name: "Advertiser", color: "bg-blue-500", description: "Brands, agencies running campaigns" },
  { name: "Board Member", color: "bg-purple-500", description: "Investors, stakeholders with read-only access" },
  { name: "Admin", color: "bg-orange-500", description: "Platform administrators" },
  { name: "Support", color: "bg-pink-500", description: "Customer support agents" },
  { name: "CFO", color: "bg-yellow-500", description: "Financial modeling and forecasting" },
];

const coreModules = [
  { name: "Meetings", icon: Calendar, description: "Scheduling, booking, video calls" },
  { name: "Podcasting", icon: Mic, description: "RSS hosting, distribution, analytics" },
  { name: "Studio", icon: Video, description: "Recording, streaming, clips" },
  { name: "Creator Hub", icon: Users, description: "Profile, My Page, identity" },
  { name: "Monetization", icon: CreditCard, description: "Ads, sponsorships, revenue" },
  { name: "Advertiser Engine", icon: Megaphone, description: "Campaigns, creatives, targeting" },
  { name: "Help Desk", icon: HeadphonesIcon, description: "Tickets, support, automation" },
  { name: "R&D Intelligence", icon: Brain, description: "Market research, KB, feeds" },
  { name: "Billing & Credits", icon: CreditCard, description: "Subscriptions, usage, payments" },
  { name: "Identity & Rights", icon: Shield, description: "Voice/face verification, blockchain" },
];

const sharedServices = [
  { name: "RBAC", icon: Lock, description: "Role-based access control" },
  { name: "Notifications", icon: Bell, description: "Email, SMS, push alerts" },
  { name: "Billing Engine", icon: CreditCard, description: "Stripe integration" },
  { name: "AI Agents", icon: Bot, description: "Board AI, Support AI, Creator AI" },
  { name: "Knowledge Base", icon: FileText, description: "kb_chunks retrieval" },
  { name: "Storage Buckets", icon: HardDrive, description: "Media, avatars, documents" },
  { name: "Realtime", icon: Zap, description: "WebSocket subscriptions" },
  { name: "Edge Functions", icon: Server, description: "Serverless compute" },
];

const dataFlows = [
  { from: "Creator", to: "Advertiser", via: "Revenue", description: "Content monetization flow" },
  { from: "AI Agents", to: "KB", via: "Memory", description: "Agent context retrieval" },
  { from: "Help Desk", to: "Email", via: "Tickets", description: "Support automation" },
  { from: "Meeting", to: "Studio", via: "Recording", description: "Simple studio integration" },
];

const externalIntegrations = [
  { name: "Stripe", category: "Payments" },
  { name: "Resend", category: "Email" },
  { name: "YouTube", category: "Social" },
  { name: "RSS Ingestion", category: "Podcasting" },
  { name: "Apple Podcasts", category: "Distribution" },
  { name: "Spotify", category: "Distribution" },
  { name: "OpenAI", category: "AI" },
  { name: "ElevenLabs", category: "Voice" },
  { name: "Polygon", category: "Blockchain" },
];

export default function SystemArchitecture() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Seeksy Platform Architecture</h1>
        <p className="text-muted-foreground">
          High-level system architecture diagram covering all platform layers, modules, and integrations.
        </p>
      </div>

      {/* User Layer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            1. User Layer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {userRoles.map((role) => (
              <div key={role.name} className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
                <div className={`w-12 h-12 rounded-full ${role.color} flex items-center justify-center mb-2`}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium">{role.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{role.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            2. Core Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {coreModules.map((module) => {
              const Icon = module.icon;
              return (
                <div key={module.name} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">{module.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shared Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            3. Shared Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sharedServices.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.name} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-sm">{service.name}</span>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Flows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            4. Data Flows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataFlows.map((flow, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <Badge variant="outline" className="min-w-[100px] justify-center">{flow.from}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="min-w-[80px] justify-center">{flow.via}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="min-w-[100px] justify-center">{flow.to}</Badge>
                <span className="text-sm text-muted-foreground ml-4">{flow.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            5. External Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {externalIntegrations.map((integration) => (
              <Badge key={integration.name} variant="outline" className="px-3 py-1">
                <span className="font-medium">{integration.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">({integration.category})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm">
            <pre className="overflow-x-auto whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│   ┌─────────┐  ┌──────────┐  ┌───────┐  ┌───────┐  ┌─────────┐  ┌─────┐    │
│   │ Creator │  │Advertiser│  │ Board │  │ Admin │  │ Support │  │ CFO │    │
│   └────┬────┘  └────┬─────┘  └───┬───┘  └───┬───┘  └────┬────┘  └──┬──┘    │
└────────┼────────────┼────────────┼──────────┼───────────┼──────────┼────────┘
         │            │            │          │           │          │
         ▼            ▼            ▼          ▼           ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE MODULES                                      │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐            │
│  │ Meetings │ │Podcasts │ │ Studio │ │Creator   │ │Monetization│            │
│  └──────────┘ └─────────┘ └────────┘ │Hub       │ │Center      │            │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ └──────────┘ └────────────┘            │
│  │Advertiser│ │Help Desk│ │  R&D   │ ┌──────────┐ ┌────────────┐            │
│  │Engine    │ │         │ │ Intel  │ │ Billing  │ │Identity &  │            │
│  └──────────┘ └─────────┘ └────────┘ │& Credits │ │Rights      │            │
│                                      └──────────┘ └────────────┘            │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SHARED SERVICES                                     │
│  ┌──────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐ ┌────┐ ┌────────┐         │
│  │ RBAC │ │Notifications││ Billing │ │AI Agents │ │ KB │ │Storage │         │
│  └──────┘ └───────────┘ │ Engine  │ └──────────┘ └────┘ │Buckets │         │
│  ┌──────────┐ ┌─────────┴─────────┐                     └────────┘         │
│  │ Realtime │ │  Edge Functions   │                                         │
│  └──────────┘ └───────────────────┘                                         │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL INTEGRATIONS                                  │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Stripe │ │ Resend │ │ YouTube │ │RSS Feeds│ │Apple/    │ │ OpenAI/   │  │
│  │        │ │        │ │         │ │         │ │Spotify   │ │ ElevenLabs│  │
│  └────────┘ └────────┘ └─────────┘ └─────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                      │
│                     ┌───────────────────────┐                                │
│                     │   Supabase Postgres   │                                │
│                     │   + Realtime + Auth   │                                │
│                     └───────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}