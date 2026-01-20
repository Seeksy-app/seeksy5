import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface BlogLoadMoreProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export const BlogLoadMore = ({ onLoadMore, isLoading, hasMore }: BlogLoadMoreProps) => {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center mt-12">
      <Button
        variant="outline"
        size="lg"
        onClick={onLoadMore}
        disabled={isLoading}
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          'View More'
        )}
      </Button>
    </div>
  );
};
