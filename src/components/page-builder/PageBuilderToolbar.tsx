import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Eye, Save } from 'lucide-react';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { cn } from '@/lib/utils';

export const PageBuilderToolbar: React.FC = () => {
  const { isEditMode, setIsEditMode, saveLayout } = usePageBuilder();

  const handleSave = async () => {
    await saveLayout();
    setIsEditMode(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
      <Button
        onClick={() => setIsEditMode(!isEditMode)}
        variant={isEditMode ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'rounded-full',
          isEditMode && 'bg-primary text-primary-foreground'
        )}
      >
        {isEditMode ? (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Preview Mode
          </>
        ) : (
          <>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Layout
          </>
        )}
      </Button>
      {isEditMode && (
        <Button
          onClick={handleSave}
          size="sm"
          className="rounded-full bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      )}
    </div>
  );
};
