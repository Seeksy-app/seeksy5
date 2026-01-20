import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function VenueMediaStudio() {
  return (
    <VenueLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Studio</h1>
          <p className="text-gray-600">Create promo videos and event recaps with AI</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Media studio coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
