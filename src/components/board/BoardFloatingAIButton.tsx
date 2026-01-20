import { Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoardFloatingAIButtonProps {
  onClick: () => void;
  className?: string;
}

export function BoardFloatingAIButton({ onClick, className }: BoardFloatingAIButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-50 flex items-center justify-center w-14 h-14 rounded-full",
        "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg",
        "hover:shadow-xl hover:scale-105 transition-all duration-300",
        "group",
        className
      )}
      style={{ bottom: '24px', right: '24px' }}
      aria-label="Open Board AI Analyst"
    >
      <Shield className="w-6 h-6 text-white" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
        <Sparkles className="w-2 h-2 text-white" />
      </span>
      
      {/* Tooltip on hover */}
      <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Board AI Analyst
      </div>
    </button>
  );
}
