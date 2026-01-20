/**
 * SparkEmptyState Component
 * Shows Spark character in empty states with helpful prompts
 */

import { SparkAvatar } from "./SparkAvatar";
import { Button } from "@/components/ui/button";
import { getSparkEmptyStateMessage, type UserRole } from "@/lib/spark/sparkPersonality";
import { Plus } from "lucide-react";

interface SparkEmptyStateProps {
  entityType: "episodes" | "campaigns" | "events" | "meetings" | "posts" | "contacts";
  role?: UserRole;
  onActionClick?: () => void;
  actionLabel?: string;
}

export const SparkEmptyState = ({
  entityType,
  role = "creator",
  onActionClick,
  actionLabel
}: SparkEmptyStateProps) => {
  const message = getSparkEmptyStateMessage(entityType, role);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-32 h-32 mb-6">
        <SparkAvatar pose="thinking" size="full" animated />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        Nothing Here Yet {message.emoji}
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {message.text}
      </p>
      
      {onActionClick && actionLabel && (
        <Button onClick={onActionClick} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
