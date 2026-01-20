import { useState, useEffect } from 'react';

export type HeaderItemId = 'knowledge-hub' | 'daily-brief' | 'docs' | 'glossary';

export interface HeaderItem {
  id: HeaderItemId;
  label: string;
  route?: string;
  action?: 'glossary' | 'daily-brief';
}

const STORAGE_KEY = 'seeksy-pinned-header-items';

export function usePinnedHeaderItems() {
  const [pinnedItems, setPinnedItems] = useState<HeaderItemId[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  const togglePin = (itemId: HeaderItemId) => {
    setPinnedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isPinned = (itemId: HeaderItemId) => pinnedItems.includes(itemId);

  return { pinnedItems, togglePin, isPinned };
}

export const getHeaderItems = (isAdmin: boolean): HeaderItem[] => [
  { id: 'knowledge-hub', label: 'Knowledge Hub', route: isAdmin ? '/admin/knowledge-base' : '/knowledge-base' },
  { id: 'daily-brief', label: 'Daily Brief', route: isAdmin ? '/admin/daily-brief' : '/creator/daily-brief' },
  { id: 'glossary', label: 'Glossary', action: 'glossary' },
];

// Keep backward compatibility
export const headerItems: HeaderItem[] = getHeaderItems(false);
