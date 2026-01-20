import { ReactNode, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BoardSidebar } from './BoardSidebar';
import { BoardFooter } from './BoardFooter';
import { BoardAIChat } from './BoardAIChat';
import { BoardOnboardingTour } from './BoardOnboardingTour';
import { BoardDataModeProvider } from '@/contexts/BoardDataModeContext';
import { MeetingFocusModeProvider } from '@/contexts/MeetingFocusModeContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { useTheme } from 'next-themes';
interface BoardLayoutProps {
  children: ReactNode;
}

export function BoardLayout({ children }: BoardLayoutProps) {
  const { setTheme, resolvedTheme } = useTheme();

  // Force light theme for board portal main content - only run once
  useEffect(() => {
    if (resolvedTheme !== 'light') {
      setTheme('light');
    }
  }, [resolvedTheme, setTheme]);

  return (
    <TenantProvider>
      <BoardDataModeProvider>
        <MeetingFocusModeProvider>
          <SidebarProvider defaultOpen={true}>
            <div className="flex h-screen w-screen overflow-hidden">
              {/* Dark sidebar - fixed width, always visible */}
              <BoardSidebar />
              
              {/* Light content area - fills all remaining space */}
              <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50">
                <main className="flex-1 overflow-y-auto w-full">
                  {/* Content container - no Suspense, no transitions, instant render */}
                  <div className="w-full px-6 lg:px-8 py-6 pb-20">
                    {children}
                  </div>
                  <BoardFooter />
                </main>
              </div>
            </div>
            
            {/* Board AI Chat Widget */}
            <BoardAIChat />
            
            {/* Onboarding Tour */}
            <BoardOnboardingTour />
          </SidebarProvider>
        </MeetingFocusModeProvider>
      </BoardDataModeProvider>
    </TenantProvider>
  );
}
