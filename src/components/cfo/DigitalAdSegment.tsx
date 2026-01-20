import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Subsegment {
  id: string;
  name: string;
  impressions: string;
  cpm: string;
}

interface DigitalAdSegmentProps {
  title: string;
  icon: React.ReactNode;
  impressions: string;
  cpm: string;
  subsegments: Subsegment[];
  onImpressionsChange: (value: string) => void;
  onCpmChange: (value: string) => void;
  onSubsegmentsChange: (subsegments: Subsegment[]) => void;
}

export function DigitalAdSegment({
  title,
  icon,
  impressions,
  cpm,
  subsegments,
  onImpressionsChange,
  onCpmChange,
  onSubsegmentsChange,
}: DigitalAdSegmentProps) {
  const [showSubsegments, setShowSubsegments] = useState(subsegments.length > 0);

  const addSubsegment = () => {
    const newSubsegment: Subsegment = {
      id: `subseg-${Date.now()}`,
      name: "",
      impressions: "",
      cpm: "",
    };
    onSubsegmentsChange([...subsegments, newSubsegment]);
    setShowSubsegments(true);
  };

  const updateSubsegment = (id: string, field: keyof Subsegment, value: string) => {
    const updated = subsegments.map((sub) =>
      sub.id === id ? { ...sub, [field]: value } : sub
    );
    onSubsegmentsChange(updated);
  };

  const removeSubsegment = (id: string) => {
    const updated = subsegments.filter((sub) => sub.id !== id);
    onSubsegmentsChange(updated);
    if (updated.length === 0) {
      setShowSubsegments(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Main segment revenue
    const mainImps = Number(impressions);
    const mainCpm = Number(cpm);
    if (mainImps && mainCpm) {
      total += (mainImps / 1000) * mainCpm;
    }

    // Subsegment revenue
    subsegments.forEach((sub) => {
      const subImps = Number(sub.impressions);
      const subCpm = Number(sub.cpm);
      if (subImps && subCpm) {
        total += (subImps / 1000) * subCpm;
      }
    });

    return total;
  };

  const totalRevenue = calculateTotal();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {totalRevenue > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-primary">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${title}-impressions`}>Impressions</Label>
            <Input
              id={`${title}-impressions`}
              type="number"
              placeholder="e.g., 50000"
              value={impressions}
              onChange={(e) => onImpressionsChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${title}-cpm`}>CPM ($)</Label>
            <Input
              id={`${title}-cpm`}
              type="number"
              placeholder="e.g., 8"
              value={cpm}
              onChange={(e) => onCpmChange(e.target.value)}
            />
          </div>
        </div>

        {showSubsegments && subsegments.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <p className="text-sm font-medium text-muted-foreground">Custom Ad Placements</p>
            {subsegments.map((subsegment) => (
              <div key={subsegment.id} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Placement Name</Label>
                  <Input
                    placeholder="e.g., Header"
                    value={subsegment.name}
                    onChange={(e) => updateSubsegment(subsegment.id, 'name', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Impressions</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10000"
                    value={subsegment.impressions}
                    onChange={(e) => updateSubsegment(subsegment.id, 'impressions', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CPM ($)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 12"
                    value={subsegment.cpm}
                    onChange={(e) => updateSubsegment(subsegment.id, 'cpm', e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => removeSubsegment(subsegment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={addSubsegment}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Placement
        </Button>
      </CardContent>
    </Card>
  );
}
