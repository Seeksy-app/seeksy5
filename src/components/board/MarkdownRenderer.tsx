import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return '';

    // Simple markdown to HTML conversion - Light theme colors
    let processed = content
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-slate-900 mt-8 mb-4">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mt-10 mb-5">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-slate-900 mt-12 mb-6">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em class="italic text-slate-600">$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="text-slate-600 ml-4 mb-2">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="text-slate-600 ml-4 mb-2 list-decimal">$2</li>')
      // Code blocks
      .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-2 py-1 rounded text-sm text-blue-600">$1</code>')
      // Line breaks for paragraphs
      .replace(/\n\n/g, '</p><p class="text-slate-600 mb-4 leading-relaxed">')
      // Single line breaks
      .replace(/\n/g, '<br />');

    // Wrap in paragraph
    processed = `<p class="text-slate-600 mb-4 leading-relaxed">${processed}</p>`;

    // Clean up empty paragraphs
    processed = processed.replace(/<p class="[^"]*"><\/p>/g, '');

    // Wrap lists
    processed = processed.replace(/(<li[^>]*>.*?<\/li>)+/gs, (match) => {
      return `<ul class="list-disc space-y-1 mb-4">${match}</ul>`;
    });

    return processed;
  }, [content]);

  return (
    <div
      className={cn('prose prose-slate max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
