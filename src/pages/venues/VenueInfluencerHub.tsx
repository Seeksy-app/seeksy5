import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function VenueInfluencerHub() {
  return (
    <VenueLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Influencer Marketplace</h1>
          <p className="text-gray-600">Find and book creators to promote your venue</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Influencer marketplace coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
