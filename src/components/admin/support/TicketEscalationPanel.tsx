import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, Users, Code, DollarSign, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TicketForEscalation {
  id: string;
  severity: string;
  sentiment: string;
  vip: boolean;
  escalation_level: string;
  risk_tags: string[];
  category: string;
}

interface TicketEscalationPanelProps {
  ticket: TicketForEscalation;
  onUpdate: (updates: Partial<TicketForEscalation>) => void;
  canEdit: boolean;
}

const severityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

const sentimentOptions = [
  { value: 'positive', label: 'Positive', color: 'bg-green-100 text-green-800' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
  { value: 'negative', label: 'Negative', color: 'bg-orange-100 text-orange-800' },
  { value: 'very_negative', label: 'Very Negative', color: 'bg-red-100 text-red-800' },
];

const escalationOptions = [
  { value: 'none', label: 'None', icon: null },
  { value: 'support_lead', label: 'Support Lead', icon: Users },
  { value: 'engineering', label: 'Engineering', icon: Code },
  { value: 'finance', label: 'Finance', icon: DollarSign },
  { value: 'leadership', label: 'Leadership', icon: Crown },
];

const riskTagLabels: Record<string, { label: string; color: string }> = {
  churn_risk: { label: 'Churn Risk', color: 'bg-red-100 text-red-800 border-red-200' },
  billing_blocker: { label: 'Billing Blocker', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  vip_at_risk: { label: 'VIP at Risk', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  repeat_bug: { label: 'Repeat Bug', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  critical_issue: { label: 'Critical Issue', color: 'bg-red-100 text-red-800 border-red-200' },
};

export function TicketEscalationPanel({ ticket, onUpdate, canEdit }: TicketEscalationPanelProps) {
  const [isRunningAI, setIsRunningAI] = useState(false);

  const getSeverityColor = (severity: string) => {
    return severityOptions.find(s => s.value === severity)?.color || 'bg-gray-100 text-gray-800';
  };

  const getSentimentColor = (sentiment: string) => {
    return sentimentOptions.find(s => s.value === sentiment)?.color || 'bg-gray-100 text-gray-800';
  };

  const getEscalationIcon = (level: string) => {
    const option = escalationOptions.find(e => e.value === level);
    if (option?.icon) {
      const Icon = option.icon;
      return <Icon className="h-4 w-4" />;
    }
    return null;
  };

  const runAIClassification = async () => {
    setIsRunningAI(true);
    // Simulate AI classification
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("AI classification complete - review suggested changes");
    setIsRunningAI(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Escalation & Risk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Severity */}
        <div>
          <Label className="text-xs">Severity</Label>
          {canEdit ? (
            <Select value={ticket.severity} onValueChange={(v) => onUpdate({ severity: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <Badge className={opt.color}>{opt.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className={`mt-1 ${getSeverityColor(ticket.severity)}`}>
              {ticket.severity}
            </Badge>
          )}
        </div>

        {/* Sentiment */}
        <div>
          <Label className="text-xs">Sentiment</Label>
          {canEdit ? (
            <Select value={ticket.sentiment} onValueChange={(v) => onUpdate({ sentiment: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sentimentOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <Badge className={opt.color}>{opt.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className={`mt-1 ${getSentimentColor(ticket.sentiment)}`}>
              {ticket.sentiment}
            </Badge>
          )}
        </div>

        {/* Escalation Level */}
        <div>
          <Label className="text-xs">Escalation</Label>
          {canEdit ? (
            <Select value={ticket.escalation_level} onValueChange={(v) => onUpdate({ escalation_level: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {escalationOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon && <opt.icon className="h-4 w-4" />}
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              {getEscalationIcon(ticket.escalation_level)}
              <span className="text-sm capitalize">{ticket.escalation_level.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* VIP Status */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">VIP Account</Label>
          {ticket.vip ? (
            <Badge className="bg-purple-100 text-purple-800">
              <Crown className="h-3 w-3 mr-1" />
              VIP
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">No</span>
          )}
        </div>

        {/* Risk Tags */}
        {ticket.risk_tags && ticket.risk_tags.length > 0 && (
          <div>
            <Label className="text-xs">Risk Tags</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {ticket.risk_tags.map((tag) => {
                const tagInfo = riskTagLabels[tag] || { label: tag, color: 'bg-gray-100 text-gray-800' };
                return (
                  <Badge key={tag} variant="outline" className={tagInfo.color}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {tagInfo.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Classification Button */}
        {canEdit && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={runAIClassification}
            disabled={isRunningAI}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isRunningAI ? "Analyzing..." : "Run AI Classification"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
