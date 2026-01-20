import { useAIAssistant } from "@/components/ai/AIAssistantProvider";
import { cn } from "@/lib/utils";

export const FloatingSparkButton = () => {
  const { open } = useAIAssistant();

  return (
    <>
      <div
        id="seeksy-chat-trigger"
        onClick={open}
        className={cn(
          "fixed cursor-pointer transition-all duration-200",
          "hover:scale-110 hover:drop-shadow-xl"
        )}
        style={{ 
          zIndex: 99999,
          bottom: '24px',
          right: '24px'
        }}
        aria-label="Ask Spark"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            open();
          }
        }}
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(45,90%,55%)] to-[hsl(45,90%,45%)] shadow-lg flex items-center justify-center animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-bounce" />
        </div>
      </div>
    </>
  );
};
