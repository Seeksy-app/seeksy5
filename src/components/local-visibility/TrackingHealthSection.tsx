import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  HelpCircle,
  Activity,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { TrackingHealthCheck } from "@/types/local-visibility";

const StatusIcon = ({ status }: { status: TrackingHealthCheck['status'] }) => {
  const icons = {
    passing: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    failing: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    unknown: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
  };
  return icons[status];
};

const CheckTypeIcon = ({ type }: { type: TrackingHealthCheck['checkType'] }) => {
  const icons = {
    ga_present: <BarChart3 className="h-4 w-4" />,
    conversions_firing: <Activity className="h-4 w-4" />,
    phone_clickable: <Phone className="h-4 w-4" />,
    email_clickable: <Mail className="h-4 w-4" />,
    booking_tracked: <Calendar className="h-4 w-4" />,
  };
  return icons[type];
};

const HealthCheckCard = ({ check }: { check: TrackingHealthCheck }) => {
  const statusColors = {
    passing: 'border-green-500/30 bg-green-500/5',
    failing: 'border-red-500/30 bg-red-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    unknown: 'border-muted',
  };

  return (
    <Card className={statusColors[check.status]}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <StatusIcon status={check.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CheckTypeIcon type={check.checkType} />
              <p className="font-medium text-sm">{check.label}</p>
            </div>
            {check.details && (
              <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
            )}
            {check.aiExplanation && (
              <div className="mt-3 p-2 bg-primary/5 rounded-lg">
                <div className="flex items-start gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5" />
                  <p className="text-xs text-muted-foreground">{check.aiExplanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TrackingHealthSection() {
  const { healthChecks, addActivityLog } = useLocalVisibilityStore();

  // Mock data
  const mockChecks: TrackingHealthCheck[] = healthChecks.length ? healthChecks : [
    {
      id: '1',
      checkType: 'ga_present',
      label: 'Google Analytics Installed',
      status: 'passing',
      details: 'GA4 property detected on all pages',
      lastChecked: new Date().toISOString(),
    },
    {
      id: '2',
      checkType: 'conversions_firing',
      label: 'Conversion Events Firing',
      status: 'warning',
      details: 'Form submissions tracked, but phone clicks are not configured',
      aiExplanation: "Your contact form is being tracked, but phone number clicks aren't. This means you're missing data on how many people call directly from your website.",
      lastChecked: new Date().toISOString(),
    },
    {
      id: '3',
      checkType: 'phone_clickable',
      label: 'Phone Number Clickable',
      status: 'passing',
      details: 'Phone number uses tel: link format',
      lastChecked: new Date().toISOString(),
    },
    {
      id: '4',
      checkType: 'email_clickable',
      label: 'Email Address Clickable',
      status: 'passing',
      details: 'Email uses mailto: link format',
      lastChecked: new Date().toISOString(),
    },
    {
      id: '5',
      checkType: 'booking_tracked',
      label: 'Booking Form Tracked',
      status: 'failing',
      details: 'No booking/reservation tracking detected',
      aiExplanation: "If you have an online booking system, we can't see if it's working or how many bookings come from your website. Consider adding tracking to measure this.",
      lastChecked: new Date().toISOString(),
    },
  ];

  const passingCount = mockChecks.filter(c => c.status === 'passing').length;
  const failingCount = mockChecks.filter(c => c.status === 'failing').length;
  const warningCount = mockChecks.filter(c => c.status === 'warning').length;

  const handleFlagForAgency = () => {
    addActivityLog({
      type: 'user_action',
      title: 'Issue flagged for agency',
      description: 'Tracking issues have been flagged for agency review',
      isAI: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Website & Tracking Health
              </CardTitle>
              <CardDescription>Read-only checks for your website analytics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                {passingCount} Passing
              </Badge>
              {warningCount > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  {warningCount} Warning
                </Badge>
              )}
              {failingCount > 0 && (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                  {failingCount} Failing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Health Checks */}
      <div className="grid gap-4 md:grid-cols-2">
        {mockChecks.map((check) => (
          <HealthCheckCard key={check.id} check={check} />
        ))}
      </div>

      {/* Agency Flag */}
      {(failingCount > 0 || warningCount > 0) && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Need help fixing these issues?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Flag these tracking issues for your web agency or developer to review.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleFlagForAgency}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Flag for Agency
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note about limitations */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Note:</strong> This is a read-only view. We don't make changes to your tracking setup. 
            For modifications, work with your web developer or agency.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
