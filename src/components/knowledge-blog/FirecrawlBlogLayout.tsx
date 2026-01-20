import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PortalType, BLOG_CATEGORIES, PORTAL_LABELS } from '@/types/knowledge-blog';
import { BookOpen, ChevronRight, Search, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FirecrawlBlogLayoutProps {
  portal: PortalType;
  children: ReactNode;
  currentCategory?: string | null;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  tableOfContents?: { id: string; text: string; level: number }[];
  onTocClick?: (id: string) => void;
  sourceUrl?: string | null;
}

export function FirecrawlBlogLayout({ 
  portal, 
  children, 
  currentCategory,
  onSearch,
  searchQuery = '',
  tableOfContents = [],
  onTocClick,
  sourceUrl
}: FirecrawlBlogLayoutProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const basePath = `/knowledge/${portal}`;

  return (
    <div className="h-full bg-background">
      {/* Simple Header - No full page takeover */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          >
            {leftSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link to={basePath} className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>{PORTAL_LABELS[portal]}</span>
          </Link>
          
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100%-3rem)]">
        {/* Left Sidebar - Categories */}
        <aside 
          className={cn(
            "w-56 shrink-0 border-r bg-muted/20 overflow-hidden transition-all lg:block",
            leftSidebarOpen ? "block" : "hidden"
          )}
        >
          <ScrollArea className="h-full">
            <nav className="p-4 space-y-1">
              <Link
                to={basePath}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors font-medium",
                  !currentCategory
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                All Articles
              </Link>
              
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Categories
                </span>
              </div>
              
              {BLOG_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to={`${basePath}?category=${encodeURIComponent(category)}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    currentCategory === category
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ChevronRight className="h-3 w-3" />
                  {category}
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>

        {/* Right Sidebar - Table of Contents / Source */}
        {(tableOfContents.length > 0 || sourceUrl) && (
          <aside className="w-52 shrink-0 border-l bg-muted/10 hidden xl:block overflow-auto">
            <div className="p-4">
              {/* Source Link */}
              {sourceUrl && (
                <div className="mb-6">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Source
                  </div>
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Read original
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    On this page
                  </div>
                  
                  <nav className="space-y-0.5">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onTocClick?.(item.id)}
                        className={cn(
                          "block w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-muted",
                          item.level === 2 
                            ? "text-foreground font-medium" 
                            : "text-muted-foreground pl-4 text-xs"
                        )}
                      >
                        {item.text}
                      </button>
                    ))}
                  </nav>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
