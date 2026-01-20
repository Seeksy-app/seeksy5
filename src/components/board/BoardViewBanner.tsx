import { useBoardViewMode } from '@/hooks/useBoardViewMode';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BoardViewBanner() {
  const { isViewingAsBoard, canToggleBoardView, toggleBoardView, isToggling } = useBoardViewMode();
  const navigate = useNavigate();

  if (!canToggleBoardView || !isViewingAsBoard) return null;

  const handleReturn = async () => {
    try {
      await toggleBoardView();
      navigate('/admin');
    } catch (error) {
      console.error('Failed to exit board view:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur-sm text-black px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">
            Board View (Preview Mode) — You are viewing the app as a Board Member.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturn}
          disabled={isToggling}
          className="bg-white/20 border-black/20 hover:bg-white/30 text-black"
        >
          <X className="w-4 h-4 mr-1" />
          Return to Admin View
        </Button>
      </div>
    </div>
  );
}
