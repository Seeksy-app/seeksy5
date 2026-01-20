import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function VenueEventsPage() {
  return (
    <VenueLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Manage all your venue events</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Events management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
