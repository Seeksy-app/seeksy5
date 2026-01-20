import { DataModeToggle } from '@/components/data-mode/DataModeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Shield } from 'lucide-react';

export default function AdminDataModeSettings() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Mode Settings</h1>
            <p className="text-muted-foreground">
              Control whether demo or live data is displayed across the platform
            </p>
          </div>
        </div>

        {/* Data Mode Toggle Card */}
        <DataModeToggle />

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                LIVE Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                In LIVE mode, only real production data is displayed. All records 
                marked as demo data are hidden from view but not deleted from the database.
              </CardDescription>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                <li>• Real contacts, leads, and deals</li>
                <li>• Actual meeting types and bookings</li>
                <li>• Production financials and metrics</li>
                <li>• Live podcast and episode data</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-500" />
                DEMO Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                In DEMO mode, sample data is visible for testing and presentations. 
                This is useful for demonstrations, training, and testing new features.
              </CardDescription>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                <li>• Sample contacts and companies</li>
                <li>• Demo meeting configurations</li>
                <li>• Example financial projections</li>
                <li>• Test podcast episodes</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Affected Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Affected Modules</CardTitle>
            <CardDescription>
              The following modules respect the global data mode setting:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Sales & CRM</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Contacts</li>
                  <li>• Leads & Deals</li>
                  <li>• Pipeline</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Meetings</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Meeting Types</li>
                  <li>• Booking Links</li>
                  <li>• Scheduled Meetings</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Financials</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Pro Forma</li>
                  <li>• Projections</li>
                  <li>• Benchmarks</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Marketing</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Campaigns</li>
                  <li>• Advertisers</li>
                  <li>• ROI Calculator</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Content</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Podcasts</li>
                  <li>• Episodes</li>
                  <li>• Daily Briefs</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Events</p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Events</li>
                  <li>• Investor Links</li>
                  <li>• Board Portal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
