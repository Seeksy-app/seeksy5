import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { Search, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavigationShortcuts() {
  const { toggle: toggleCommand } = useCommandPalette();
  const { toggle: toggleAI } = useAIAssistant();

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCommand}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Quick search and navigation</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAI}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open AI Assistant</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
