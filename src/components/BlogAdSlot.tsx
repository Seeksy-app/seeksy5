import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogAdSlotProps {
  position: "sidebar" | "inline" | "footer";
  adContent?: {
    title: string;
    description: string;
    imageUrl?: string;
    ctaText: string;
    ctaUrl: string;
  };
}

export const BlogAdSlot = ({ position, adContent }: BlogAdSlotProps) => {
  if (!adContent) {
    return (
      <Card className="border-dashed border-2 opacity-50">
        <CardContent className="p-4 text-center">
          <Badge variant="outline" className="mb-2">Ad Slot</Badge>
          <p className="text-sm text-muted-foreground">
            {position === "sidebar" ? "Sidebar Ad" : position === "inline" ? "Inline Ad" : "Footer Ad"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {adContent.imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img
              src={adContent.imageUrl}
              alt={adContent.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <Badge variant="secondary" className="mb-2 text-xs">Advertisement</Badge>
          <h3 className="font-semibold mb-2">{adContent.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{adContent.description}</p>
          <a
            href={adContent.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
          >
            {adContent.ctaText}
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
