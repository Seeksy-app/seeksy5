import { useNavigate } from "react-router-dom";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { GBPLayout } from "@/components/admin/gbp/GBPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  BarChart3,
  Search,
  Eye,
  Phone,
  Navigation,
  TrendingUp,
  Info
} from "lucide-react";

function GBPPerformanceContent() {
  const navigate = useNavigate();

  const placeholderMetrics = [
    { label: 'Search Views', value: '—', icon: Search, description: 'Times your listing appeared in search' },
    { label: 'Profile Views', value: '—', icon: Eye, description: 'Times your profile was viewed' },
    { label: 'Phone Calls', value: '—', icon: Phone, description: 'Calls initiated from your listing' },
    { label: 'Direction Requests', value: '—', icon: Navigation, description: 'Navigation requests to your location' },
  ];

  return (
    <div className="container max-w-5xl py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/gbp')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance
          </h1>
          <p className="text-sm text-muted-foreground">Business Profile performance metrics</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Performance Data Not Available</p>
          <p className="text-sm text-blue-700 mt-1">
            Google Business Profile Performance API access requires additional verification and permissions 
            that are not currently configured for this account. The metrics below are placeholders.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            To enable performance data, please ensure your Google Cloud project has the Business Profile 
            Performance API enabled and the connected account has the necessary permissions.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholderMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <metric.icon className="h-4 w-4" />
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-muted-foreground/50">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Performance charts will appear here when data is available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <h3 className="font-medium text-sm mb-2">About Performance Metrics</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Search Views:</strong> How many times your business appeared in Google Search and Maps</li>
            <li>• <strong>Profile Views:</strong> How many times customers viewed your Business Profile</li>
            <li>• <strong>Phone Calls:</strong> How many customers called your business from the listing</li>
            <li>• <strong>Direction Requests:</strong> How many customers requested directions to your location</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GBPPerformance() {
  return (
    <RequireAdmin>
      <GBPLayout title="Performance">
        <GBPPerformanceContent />
      </GBPLayout>
    </RequireAdmin>
  );
}
