import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageBuilder } from '@/contexts/PageBuilderContext';

interface DraggableElementProps {
  id: string;
  children: React.ReactNode;
  isVisible: boolean;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  id,
  children,
  isVisible,
}) => {
  const { isEditMode, toggleElementVisibility } = usePageBuilder();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!isEditMode && !isVisible) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isEditMode && 'border-2 border-dashed border-primary/30 rounded-lg p-4',
        isDragging && 'opacity-50 z-50',
        !isVisible && isEditMode && 'opacity-40'
      )}
    >
      {isEditMode && (
        <div className="absolute -top-3 left-4 z-10 flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1 shadow-sm">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:text-primary"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleElementVisibility(id)}
            className="hover:text-primary"
          >
            {isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      <div className={cn(!isVisible && isEditMode && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  );
};
