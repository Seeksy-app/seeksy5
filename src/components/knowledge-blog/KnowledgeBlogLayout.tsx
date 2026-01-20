import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PortalType, PORTAL_SECTIONS, PORTAL_LABELS } from '@/types/knowledge-blog';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface KnowledgeBlogLayoutProps {
  portal: PortalType;
  children: ReactNode;
  currentSection?: string | null;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function KnowledgeBlogLayout({ 
  portal, 
  children, 
  currentSection,
  onSearch,
  searchQuery = ''
}: KnowledgeBlogLayoutProps) {
  const location = useLocation();
  const sections = PORTAL_SECTIONS[portal];
  const basePath = `/knowledge/${portal}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6 gap-4">
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

      <div className="flex">
        {/* Left Sidebar - Section Navigation */}
        <aside className="w-56 shrink-0 border-r bg-muted/30 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="p-4 space-y-1">
            <Link
              to={basePath}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                !currentSection
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All Articles
            </Link>
            
            <div className="pt-2 pb-1 px-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sections
              </span>
            </div>
            
            {sections.map((section) => (
              <Link
                key={section}
                to={`${basePath}?section=${encodeURIComponent(section)}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                  currentSection === section
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ChevronRight className="h-3 w-3" />
                {section}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
