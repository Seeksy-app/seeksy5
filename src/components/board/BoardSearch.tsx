import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, FileText, TrendingUp, Video, BarChart3, DollarSign, Users, Briefcase, PieChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface SearchResult {
  id: string;
  type: "page" | "metric" | "document" | "video" | "action";
  title: string;
  subtitle?: string;
  route: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const boardPages = [
  { id: "dashboard", title: "Dashboard", subtitle: "Overview & KPIs", route: "/board", icon: BarChart3, keywords: ["dashboard", "overview", "kpi", "home"] },
  { id: "business-model", title: "Business Model", subtitle: "Revenue & strategy", route: "/board/business-model", icon: Briefcase, keywords: ["business", "model", "revenue", "strategy"] },
  { id: "gtm", title: "GTM Strategy", subtitle: "Go-to-market plan", route: "/board/gtm", icon: TrendingUp, keywords: ["gtm", "go to market", "strategy", "marketing"] },
  { id: "forecasts", title: "3-Year Forecasts", subtitle: "Financial projections", route: "/board/forecasts", icon: PieChart, keywords: ["forecast", "projection", "financial", "3 year"] },
  { id: "videos", title: "Videos", subtitle: "Platform videos", route: "/board/videos", icon: Video, keywords: ["video", "presentation", "demo"] },
  { id: "docs", title: "Documents", subtitle: "PDFs & downloads", route: "/board/docs", icon: FileText, keywords: ["document", "pdf", "download", "file"] },
  { id: "proforma", title: "Pro Forma", subtitle: "Financial model", route: "/board/proforma", icon: DollarSign, keywords: ["proforma", "pro forma", "financial", "model"] },
  { id: "investor-links", title: "Investor Links", subtitle: "Shared access links", route: "/board/investor-links", icon: Users, keywords: ["investor", "share", "link", "access"] },
];

const boardMetrics = [
  { id: "mrr", title: "MRR", subtitle: "Monthly Recurring Revenue", route: "/board", keywords: ["mrr", "revenue", "monthly"] },
  { id: "creators", title: "Active Creators", subtitle: "Platform creators", route: "/board", keywords: ["creator", "active", "users"] },
  { id: "arpu", title: "ARPU", subtitle: "Average Revenue Per User", route: "/board", keywords: ["arpu", "average", "revenue"] },
  { id: "churn", title: "Churn Rate", subtitle: "Customer retention", route: "/board", keywords: ["churn", "retention", "customer"] },
  { id: "cac", title: "CAC", subtitle: "Customer Acquisition Cost", route: "/board", keywords: ["cac", "acquisition", "cost"] },
  { id: "ltv", title: "LTV", subtitle: "Lifetime Value", route: "/board", keywords: ["ltv", "lifetime", "value"] },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  page: FileText,
  metric: BarChart3,
  document: FileText,
  video: Video,
  action: TrendingUp,
};

export function BoardSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const lowerQuery = query.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search pages
      boardPages.forEach((page) => {
        if (
          page.keywords.some(k => k.includes(lowerQuery)) ||
          page.title.toLowerCase().includes(lowerQuery) ||
          page.subtitle?.toLowerCase().includes(lowerQuery)
        ) {
          allResults.push({
            id: page.id,
            type: "page",
            title: page.title,
            subtitle: page.subtitle,
            route: page.route,
            icon: page.icon,
          });
        }
      });

      // Search metrics
      boardMetrics.forEach((metric) => {
        if (
          metric.keywords.some(k => k.includes(lowerQuery)) ||
          metric.title.toLowerCase().includes(lowerQuery) ||
          metric.subtitle?.toLowerCase().includes(lowerQuery)
        ) {
          allResults.push({
            id: metric.id,
            type: "metric",
            title: metric.title,
            subtitle: metric.subtitle,
            route: metric.route,
          });
        }
      });

      setResults(allResults);
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(searchData, 150);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (route: string) => {
    navigate(route);
    setIsOpen(false);
    setQuery("");
  };

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    page: "Pages",
    metric: "Metrics",
    document: "Documents",
    video: "Videos",
    action: "Actions",
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search board portal..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 h-9 bg-muted/50 text-foreground rounded-lg border border-border focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-[400px] overflow-y-auto shadow-xl z-50 border rounded-xl bg-background">
          <div className="p-2">
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type} className="mb-3 last:mb-0">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {typeLabels[type] || type}
                </div>
                <div className="space-y-0.5">
                  {items.map((result) => {
                    const Icon = result.icon || iconMap[result.type];
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result.route)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors text-left group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isOpen && query.length >= 1 && !isLoading && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full p-4 shadow-xl z-50 border rounded-xl bg-background">
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </Card>
      )}
    </div>
  );
}
