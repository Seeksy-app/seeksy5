import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, CheckCircle2, Eye, XCircle } from "lucide-react";

interface FraudAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  campaign?: string;
  creator?: string;
  timestamp: string;
}

// Demo alerts for display
const demoAlerts: FraudAlert[] = [
  {
    id: '1',
    type: 'suspicious_activity',
    severity: 'medium',
    message: 'Unusual click pattern detected from single IP range',
    campaign: 'Summer 2024 Campaign',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    type: 'budget_alert',
    severity: 'low',
    message: 'Campaign spending pace 20% above daily average',
    campaign: 'Q4 Brand Awareness',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export function AdminFraudAlerts() {
  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      low: { variant: "secondary", label: "Low" },
      medium: { variant: "outline", label: "Medium" },
      high: { variant: "destructive", label: "High" },
    };
    const config = variants[severity] || { variant: "secondary", label: severity };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_activity':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'budget_alert':
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-lg font-bold text-green-600">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-lg font-bold">{demoAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protected Campaigns</p>
                <p className="text-lg font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Active Alerts
          </CardTitle>
          <CardDescription>
            Monitor suspicious activity and potential fraud
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demoAlerts.length > 0 ? (
            <div className="space-y-4">
              {demoAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(alert.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.message}</p>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      {alert.campaign && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Campaign: {alert.campaign}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Investigate
                    </Button>
                    <Button size="sm" variant="ghost">
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fraud Prevention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Fraud Prevention
          </CardTitle>
          <CardDescription>
            Configure automated fraud detection rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Click Fraud Detection</p>
                <p className="text-sm text-muted-foreground">
                  Automatically flag suspicious click patterns
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">IP Rate Limiting</p>
                <p className="text-sm text-muted-foreground">
                  Limit impressions from single IP addresses
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Bot Traffic Filter</p>
                <p className="text-sm text-muted-foreground">
                  Filter out known bot user agents
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Geographic Verification</p>
                <p className="text-sm text-muted-foreground">
                  Verify traffic matches campaign targeting
                </p>
              </div>
              <Badge variant="secondary">Optional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
