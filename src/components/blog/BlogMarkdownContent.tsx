import React, { useMemo } from 'react';

interface BlogMarkdownContentProps {
  content: string;
}

export const BlogMarkdownContent = ({ content }: BlogMarkdownContentProps) => {
  const formattedContent = useMemo(() => {
    if (!content) return '';
    
    let html = content;
    
    // Convert markdown headings to HTML
    // H1: # heading
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4 text-foreground">$1</h1>');
    // H2: ## heading
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mt-6 mb-3 text-foreground">$1</h2>');
    // H3: ### heading
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-5 mb-2 text-foreground">$1</h3>');
    // H4: #### heading
    html = html.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-medium mt-4 mb-2 text-foreground">$1</h4>');
    
    // Convert markdown images ![alt](url) to img tags
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, 
      '<figure class="my-6"><img src="$2" alt="$1" class="w-full rounded-lg shadow-md" loading="lazy" /><figcaption class="text-sm text-muted-foreground text-center mt-2">$1</figcaption></figure>'
    );
    
    // Convert bold **text** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Convert italic *text* to <em>
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');
    
    // Convert unordered lists
    html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    
    // Wrap consecutive <li> items in <ul>
    html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc pl-6 my-4 space-y-1">$1</ul>');
    
    // Convert numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    
    // Convert code blocks ```code```
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>$1</code></pre>');
    
    // Convert inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Convert blockquotes > quote
    html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 py-1 my-4 italic text-muted-foreground">$1</blockquote>');
    
    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr class="my-8 border-border" />');
    html = html.replace(/^\*\*\*$/gm, '<hr class="my-8 border-border" />');
    
    // Wrap plain text paragraphs (text between block elements)
    // Split by double newlines and wrap in paragraphs
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      // Skip if already a block element
      if (trimmed.startsWith('<h') || 
          trimmed.startsWith('<ul') || 
          trimmed.startsWith('<ol') || 
          trimmed.startsWith('<blockquote') || 
          trimmed.startsWith('<pre') ||
          trimmed.startsWith('<hr') ||
          trimmed.startsWith('<div') ||
          trimmed.startsWith('<p')) {
        return trimmed;
      }
      return `<p class="text-base leading-relaxed mb-4 text-foreground/90">${trimmed}</p>`;
    }).join('\n\n');
    
    // Clean up any remaining single newlines within paragraphs
    html = html.replace(/([^>])\n([^<])/g, '$1 $2');
    
    return html;
  }, [content]);

  return (
    <div 
      className="blog-content prose prose-lg dark:prose-invert max-w-none 
                 prose-headings:text-foreground prose-p:text-foreground/90
                 prose-strong:text-foreground prose-em:text-foreground/80
                 prose-li:text-foreground/90 prose-a:text-primary
                 [&>*:first-child]:mt-0"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};
