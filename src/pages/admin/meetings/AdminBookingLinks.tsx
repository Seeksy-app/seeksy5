import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Copy, ExternalLink, QrCode, Plus, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const bookingLinks = [
  { id: "1", name: "Demo Call", slug: "demo", url: "/meet/demo", views: 234, bookings: 45, conversionRate: "19.2%" },
  { id: "2", name: "Sales Discovery", slug: "sales", url: "/meet/sales", views: 156, bookings: 32, conversionRate: "20.5%" },
  { id: "3", name: "Support Session", slug: "support", url: "/meet/support", views: 89, bookings: 28, conversionRate: "31.5%" },
  { id: "4", name: "Onboarding", slug: "onboarding", url: "/meet/onboarding", views: 67, bookings: 18, conversionRate: "26.9%" },
  { id: "5", name: "Consultation", slug: "consultation", url: "/meet/consultation", views: 45, bookings: 12, conversionRate: "26.7%" },
];

export default function AdminBookingLinks() {
  const { toast } = useToast();

  const copyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/meet/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Link copied!", description: fullUrl });
  };

  const copyEmbed = (slug: string) => {
    const embedCode = `<iframe src="${window.location.origin}/meet/${slug}?embed=true" width="100%" height="700" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed code copied!" });
  };

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Links</h1>
          <p className="text-muted-foreground mt-1">Share booking links and embed calendars on your website</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Link
        </Button>
      </div>

      {/* Global Booking Page */}
      <Card className="w-full border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Global Demo Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Direct link to your demo booking page</p>
              <div className="flex items-center gap-2">
                <Input value={`${window.location.origin}/demo`} readOnly className="bg-background" />
                <Button variant="outline" onClick={() => copyLink("demo")}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => window.open("/demo", "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border-l pl-4">
              <p className="text-sm text-muted-foreground mb-2">Embed Code</p>
              <Button variant="outline" onClick={() => copyEmbed("demo")}>
                <QrCode className="h-4 w-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {bookingLinks.map((link) => (
          <Card key={link.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="h-4 w-4 text-primary" />
                {link.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input value={`${window.location.origin}${link.url}`} readOnly className="text-sm" />
                <Button variant="ghost" size="icon" onClick={() => copyLink(link.slug)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2 rounded-lg bg-muted">
                  <p className="text-lg font-bold text-foreground">{link.views}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <p className="text-lg font-bold text-foreground">{link.bookings}</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <p className="text-lg font-bold text-primary">{link.conversionRate}</p>
                  <p className="text-xs text-muted-foreground">Conv.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => copyEmbed(link.slug)}>
                  <QrCode className="h-4 w-4 mr-1" />
                  Embed
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(link.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
