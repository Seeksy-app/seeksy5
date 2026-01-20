import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BoardSearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function BoardSearchBar({ onSearch, className }: BoardSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything... (e.g., 'What is our CAC?')"
          className="pl-10 pr-12 h-10 bg-white border-slate-200 rounded-xl text-sm placeholder:text-slate-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">AI</span>
        </div>
      </div>
    </form>
  );
}
