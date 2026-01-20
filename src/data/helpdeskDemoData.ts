// Demo data for Help Desk tickets

export interface DemoTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "archived";
  priority: "urgent" | "high" | "medium" | "low";
  category: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  // Optional fields to match DB schema
  ai_summary?: string | null;
  first_response_at?: string | null;
  device_info?: string | null;
  browser_info?: string | null;
}

// Generate dates relative to now
const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const demoTickets: DemoTicket[] = [
  {
    id: "demo-ticket-1",
    ticket_number: "TKT-001247",
    title: "Can't upload podcast episode",
    description: "I've been trying to upload my latest episode for the past hour but keep getting a timeout error. The file is 45MB MP3.",
    status: "open",
    priority: "urgent",
    category: "Technical",
    requester_name: "Sarah Mitchell",
    requester_email: "sarah.mitchell@gmail.com",
    created_at: hoursAgo(2),
    updated_at: hoursAgo(1),
    last_activity_at: hoursAgo(1),
  },
  {
    id: "demo-ticket-2",
    ticket_number: "TKT-001246",
    title: "Billing question about subscription",
    description: "I was charged twice this month for my Pro subscription. Can you please investigate and refund the duplicate charge?",
    status: "in_progress",
    priority: "high",
    category: "Billing",
    requester_name: "Mike Johnson",
    requester_email: "mike.j@techcorp.io",
    created_at: hoursAgo(5),
    updated_at: hoursAgo(3),
    last_activity_at: hoursAgo(3),
  },
  {
    id: "demo-ticket-3",
    ticket_number: "TKT-001245",
    title: "Need help adding ad to my podcast",
    description: "I accepted an ad campaign but I'm not sure how to insert the ad into my episode. Can someone walk me through the process?",
    status: "open",
    priority: "medium",
    category: "How-To",
    requester_name: "Emma Davis",
    requester_email: "emma.davis@creator.co",
    created_at: hoursAgo(8),
    updated_at: hoursAgo(6),
    last_activity_at: hoursAgo(6),
  },
  {
    id: "demo-ticket-4",
    ticket_number: "TKT-001244",
    title: "Creator not receiving verification email",
    description: "I've tried resending the verification email 5 times but nothing arrives. Checked spam folder too. Email: john@example.com",
    status: "open",
    priority: "high",
    category: "Authentication",
    requester_name: "John Peterson",
    requester_email: "john.peterson@example.com",
    created_at: daysAgo(1),
    updated_at: hoursAgo(12),
    last_activity_at: hoursAgo(12),
  },
  {
    id: "demo-ticket-5",
    ticket_number: "TKT-001243",
    title: "Analytics dashboard showing wrong numbers",
    description: "My podcast analytics are showing 0 downloads for the past week, but I know people are listening based on comments.",
    status: "in_progress",
    priority: "medium",
    category: "Analytics",
    requester_name: "Lisa Park",
    requester_email: "lisa.park@wellness.io",
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    last_activity_at: daysAgo(1),
  },
  {
    id: "demo-ticket-6",
    ticket_number: "TKT-001242",
    title: "Request for enterprise pricing",
    description: "We're a podcast network with 25+ shows and would like to discuss enterprise pricing and features. Please contact us.",
    status: "resolved",
    priority: "low",
    category: "Sales",
    requester_name: "Alex Chen",
    requester_email: "alex.chen@podcastnetwork.com",
    created_at: daysAgo(2),
    updated_at: daysAgo(1),
    last_activity_at: daysAgo(1),
  },
  {
    id: "demo-ticket-7",
    ticket_number: "TKT-001241",
    title: "Voice certification failed unexpectedly",
    description: "I completed all the voice verification steps but got a generic 'verification failed' error at the end. No details provided.",
    status: "open",
    priority: "urgent",
    category: "Voice Identity",
    requester_name: "Jordan Lee",
    requester_email: "jordan.lee@gaming.tv",
    created_at: daysAgo(3),
    updated_at: daysAgo(2),
    last_activity_at: daysAgo(2),
  },
];

// Dashboard summary stats
export const demoTicketStats = {
  open: demoTickets.filter(t => t.status === "open").length,
  inProgress: demoTickets.filter(t => t.status === "in_progress").length,
  resolved: demoTickets.filter(t => t.status === "resolved").length,
  urgent: demoTickets.filter(t => t.priority === "urgent").length,
  avgResponseTime: "2.4 hours",
  resolutionRate: "94%",
};
