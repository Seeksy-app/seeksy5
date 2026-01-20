import { ExternalLink } from 'lucide-react';

interface Source {
  title: string;
  url: string;
}

interface BlogSourcesProps {
  sources: Source[] | null;
}

export const BlogSources = ({ sources }: BlogSourcesProps) => {
  if (!sources || sources.length === 0) {
    return (
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Sources</h3>
        <p className="text-sm text-muted-foreground italic">
          Sources: Not available for this article.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Sources</h3>
      <ul className="space-y-2">
        {sources.map((source, index) => (
          <li key={index} className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-words"
            >
              {source.title || source.url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};
