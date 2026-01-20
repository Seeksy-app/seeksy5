import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function VenueSettingsPage() {
  return (
    <VenueLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your venue settings and preferences</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Settings page coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
