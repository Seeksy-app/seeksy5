import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2, FileText, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdvertisingOverview } from "./AdvertisingOverview";

interface ContactViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const ContactViewDialog = ({ open, onOpenChange, contact }: ContactViewDialogProps) => {
  if (!contact) return null;

  // Extract photos from notes (format: "Photo 1: url")
  const photoUrls = contact.notes
    ?.split('\n')
    .filter((line: string) => line.startsWith('Photo'))
    .map((line: string) => {
      const match = line.match(/Photo \d+: (.+)/);
      return match ? match[1] : null;
    })
    .filter(Boolean) || [];

  // Extract location from notes
  const locationMatch = contact.notes?.match(/Location: (.+)/);
  const location = locationMatch ? locationMatch[1] : null;

  const coordinatesMatch = contact.notes?.match(/Coordinates: (.+)/);
  const coordinates = coordinatesMatch ? coordinatesMatch[1] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">
                {contact.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{contact.name}</DialogTitle>
              {contact.company && (
                <p className="text-muted-foreground">{contact.company}</p>
              )}
              {contact.lead_status && (
                <Badge variant="secondary" className="mt-2">
                  {contact.lead_status}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="photos">
              Photos ({photoUrls.length})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              
              {contact.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.company}</span>
                </div>
              )}

              {contact.title && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.title}</span>
                </div>
              )}

              {location && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium">📍 Location:</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{location}</p>
                  {coordinates && (
                    <p className="text-xs text-muted-foreground pl-6">
                      Coordinates: {coordinates}
                    </p>
                  )}
                </div>
              )}

              {contact.lead_source && (
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground">
                    Lead Source: <span className="font-medium">{contact.lead_source}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Advertising Overview Section */}
            <div className="pt-4">
              <AdvertisingOverview contact={contact} />
            </div>

            {/* Notes Section */}
            {contact.notes && !contact.notes.includes('Photo') && !contact.notes.includes('Location:') && (
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoUrls.map((url: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-sm underline"
                      >
                        View Full Size
                      </a>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Photo {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No photos attached</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Activity history coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
