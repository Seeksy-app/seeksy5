import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { AdminNotesDrawer } from './AdminNotesDrawer';
import { cn } from '@/lib/utils';

interface AdminNotesFloatingButtonProps {
  className?: string;
}

export function AdminNotesFloatingButton({ className }: AdminNotesFloatingButtonProps) {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 shadow-lg gap-2",
          "bg-primary hover:bg-primary/90",
          className
        )}
        size="lg"
      >
        <FileText className="h-4 w-4" />
        Notes
        <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-primary-foreground/20 rounded">
          ⌘K
        </kbd>
      </Button>

      <AdminNotesDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
