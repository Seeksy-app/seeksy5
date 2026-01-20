import { useState } from "react";
import { ChevronDown, Video, MessageCircle, Mail, Radio, Users, Calendar, PenLine, TrendingUp, Globe, Megaphone, DollarSign, ArrowRight, Mic, BarChart3, Shield } from "lucide-react";

const colors = {
  primary: "#0031A2",
  primaryLight: "#2566FF",
  accent: "#FFCC33",
  textPrimary: "#0A0A0A",
  textSecondary: "#5A6472",
  background: "#FFFFFF",
  borderSubtle: "#E1E5ED",
};

const coreTools = [
  { icon: Video, title: "Live Streaming", description: "Broadcast town halls & rallies" },
  { icon: MessageCircle, title: "SMS Outreach", description: "Text voters & volunteers" },
  { icon: Mail, title: "Email Campaigns", description: "Newsletters & donor updates" },
  { icon: PenLine, title: "AI Speechwriter", description: "Speeches, posts & emails" },
  { icon: Globe, title: "Website Builder", description: "Launch your campaign site" },
  { icon: Users, title: "Volunteer CRM", description: "Manage your team & supporters" },
];

const useCases = [
  { icon: Mic, title: "For Local Races", description: "City council, school board, mayor" },
  { icon: BarChart3, title: "For State Races", description: "State house, senate, governor" },
  { icon: Shield, title: "For Federal Races", description: "U.S. House & Senate campaigns" },
  { icon: Megaphone, title: "For PACs & Advocacy", description: "Issue campaigns & movements" },
];

const moreItems = [
  { icon: Calendar, title: "Events & GOTV", description: "Rallies, canvassing & voter drives" },
  { icon: TrendingUp, title: "Analytics Dashboard", description: "Track campaign performance" },
  { icon: DollarSign, title: "Fundraising Tools", description: "Donation pages & tracking" },
  { icon: ArrowRight, title: "View All Solutions", description: "Explore the full platform" },
];

export function CampaignSolutionsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity py-2 px-3 rounded-full"
        style={{ 
          color: isOpen ? colors.primary : colors.textSecondary,
          backgroundColor: isOpen ? 'rgba(0, 49, 162, 0.08)' : 'transparent'
        }}
      >
        Solutions
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-[700px] rounded-xl shadow-2xl border z-[100] bg-white"
          style={{ 
            borderColor: colors.borderSubtle
          }}
        >
          <div className="grid grid-cols-3 gap-0 p-6">
            {/* Core Tools Column */}
            <div className="pr-6 border-r" style={{ borderColor: colors.borderSubtle }}>
              <h4 
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: colors.textSecondary }}
              >
                Core Tools
              </h4>
              <div className="space-y-1">
                {coreTools.map((item) => (
                  <a
                    key={item.title}
                    href="#tools"
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <item.icon 
                      className="h-5 w-5 mt-0.5 flex-shrink-0" 
                      style={{ color: colors.primary }}
                    />
                    <div>
                      <div 
                        className="text-sm font-medium group-hover:text-primary"
                        style={{ color: colors.textPrimary }}
                      >
                        {item.title}
                      </div>
                      <div 
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Use Cases Column */}
            <div className="px-6 border-r" style={{ borderColor: colors.borderSubtle }}>
              <h4 
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: colors.textSecondary }}
              >
                Use Cases
              </h4>
              <div className="space-y-1">
                {useCases.map((item) => (
                  <a
                    key={item.title}
                    href="#local"
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <item.icon 
                      className="h-5 w-5 mt-0.5 flex-shrink-0" 
                      style={{ color: colors.accent }}
                    />
                    <div>
                      <div 
                        className="text-sm font-medium group-hover:text-primary"
                        style={{ color: colors.textPrimary }}
                      >
                        {item.title}
                      </div>
                      <div 
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* More Column */}
            <div className="pl-6">
              <h4 
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: colors.textSecondary }}
              >
                More
              </h4>
              <div className="space-y-1">
                {moreItems.map((item) => (
                  <a
                    key={item.title}
                    href="#tools"
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <item.icon 
                      className="h-5 w-5 mt-0.5 flex-shrink-0" 
                      style={{ color: colors.primary }}
                    />
                    <div>
                      <div 
                        className="text-sm font-medium group-hover:text-primary"
                        style={{ color: colors.textPrimary }}
                      >
                        {item.title}
                      </div>
                      <div 
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
