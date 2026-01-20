import { Bot, User } from "lucide-react";
import { ClaimsQuickReplies } from "./ClaimsQuickReplies";

interface ClaimsChatMessageProps {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  onQuickReply?: (value: string) => void;
  isLatest?: boolean;
  isLoading?: boolean;
}

export function ClaimsChatMessage({ 
  role, 
  content, 
  quickReplies, 
  onQuickReply,
  isLatest,
  isLoading 
}: ClaimsChatMessageProps) {
  // Convert markdown-style bold to strong tags and clean content
  const formatContent = (text: string) => {
    let formatted = text;
    
    // Replace **text** with <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Remove any remaining JSON-like structures that might have slipped through
    formatted = formatted.replace(/\{"category":\s*"[^"]*",\s*"value":\s*"[^"]*"\}/g, '');
    
    // Remove <notes> tags if they somehow appear
    formatted = formatted.replace(/<notes>[\s\S]*?<\/notes>/g, '');
    
    // Remove <prompts> tags if they somehow appear
    formatted = formatted.replace(/<prompts>[\s\S]*?<\/prompts>/g, '');
    
    // Clean up extra whitespace
    formatted = formatted.replace(/\s+/g, ' ').trim();
    
    return formatted;
  };

  return (
    <div className={`flex gap-3 ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "assistant" && (
        <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-orange-600" />
        </div>
      )}
      
      <div className={`max-w-[85%] ${role === "user" ? "order-first" : ""}`}>
        <div 
          className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
            role === "user" 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-muted/50 rounded-bl-md"
          }`}
        >
          {role === "assistant" ? (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-1"
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
          ) : (
            <p>{content}</p>
          )}
        </div>
        
        {/* Quick Replies for latest assistant message */}
        {role === "assistant" && isLatest && quickReplies && quickReplies.length > 0 && onQuickReply && !isLoading && (
          <ClaimsQuickReplies 
            options={quickReplies} 
            onSelect={onQuickReply}
            disabled={isLoading}
          />
        )}
      </div>
      
      {role === "user" && (
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
}
