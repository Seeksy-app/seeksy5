import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings2, Users, DollarSign, Megaphone, Briefcase } from "lucide-react";
import { ProFormaAssumptions as AssumptionsType } from "@/hooks/useProFormaData";

interface Props {
  assumptions: AssumptionsType;
  onUpdate: (updates: Partial<AssumptionsType>) => void;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

const ProFormaAssumptions = ({ assumptions, onUpdate }: Props) => {
  const handleYearlyUpdate = (
    key: keyof AssumptionsType,
    year: "2026" | "2027" | "2028",
    value: number
  ) => {
    const current = assumptions[key] as Record<string, number>;
    onUpdate({
      [key]: { ...current, [year]: value },
    });
  };

  return (
    <div className="space-y-6">
      {/* Core Conversion Rates */}
      <Card className="rounded-lg">
        <CardHeader className="bg-[#053877] text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Core Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sponsor Conversion Rate</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[assumptions.sponsor_conversion_rate * 100]}
                  onValueChange={([v]) => onUpdate({ sponsor_conversion_rate: v / 100 })}
                  max={100}
                  min={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-14 text-right">
                  {(assumptions.sponsor_conversion_rate * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Commission Rate</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[assumptions.commission_rate * 100]}
                  onValueChange={([v]) => onUpdate({ commission_rate: v / 100 })}
                  max={25}
                  min={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-14 text-right">
                  {(assumptions.commission_rate * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Livestream CPM ($)</Label>
              <Input
                type="number"
                value={assumptions.livestream_cpm}
                onChange={(e) => onUpdate({ livestream_cpm: parseFloat(e.target.value) || 0 })}
                step="0.50"
                min="5"
                max="50"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Branded Content Growth Rate</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[assumptions.branded_content_growth * 100]}
                  onValueChange={([v]) => onUpdate({ branded_content_growth: v / 100 })}
                  max={100}
                  min={20}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-14 text-right">
                  {(assumptions.branded_content_growth * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Assumptions */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-[#053877]">
            <Users className="h-5 w-5" />
            Sponsor Count by Year
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {(["2026", "2027", "2028"] as const).map((year) => (
              <div key={year} className="space-y-4 p-4 border rounded-lg bg-muted/10">
                <h4 className="font-semibold text-center text-[#053877]">{year}</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Category Sponsors</Label>
                    <Input
                      type="number"
                      value={assumptions.category_sponsors[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("category_sponsors", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Engagement Sponsors</Label>
                    <Input
                      type="number"
                      value={assumptions.engagement_sponsors[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("engagement_sponsors", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vertical Expansion</Label>
                    <Input
                      type="number"
                      value={assumptions.vertical_expansion[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("vertical_expansion", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Livestream Impressions */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-[#053877]">
            <Megaphone className="h-5 w-5" />
            Livestream Impressions by Year
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {(["2026", "2027", "2028"] as const).map((year) => (
              <div key={year} className="space-y-2">
                <Label className="text-sm font-medium">{year}</Label>
                <Input
                  type="number"
                  value={assumptions.livestream_impressions[year]}
                  onChange={(e) =>
                    handleYearlyUpdate("livestream_impressions", year, parseInt(e.target.value) || 0)
                  }
                  min="0"
                  step="100000"
                />
                <p className="text-xs text-muted-foreground">
                  {formatNumber(assumptions.livestream_impressions[year])} impressions
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Streams */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="h-5 w-5" />
            Additional Revenue by Year
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {(["2026", "2027", "2028"] as const).map((year) => (
              <div key={year} className="space-y-4 p-4 border rounded-lg bg-emerald-50/50">
                <h4 className="font-semibold text-center text-emerald-600">{year}</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Award Purchase Revenue ($)</Label>
                    <Input
                      type="number"
                      value={assumptions.award_purchase_revenue[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("award_purchase_revenue", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mic Bundle Revenue ($)</Label>
                    <Input
                      type="number"
                      value={assumptions.mic_bundle_revenue[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("mic_bundle_revenue", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Assumptions */}
      <Card className="rounded-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-rose-600">
            <Briefcase className="h-5 w-5" />
            Operating Costs by Year
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {(["2026", "2027", "2028"] as const).map((year) => (
              <div key={year} className="space-y-4 p-4 border rounded-lg bg-rose-50/50">
                <h4 className="font-semibold text-center text-rose-600">{year}</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Production Costs ($)</Label>
                    <Input
                      type="number"
                      value={assumptions.production_costs[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("production_costs", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Staffing Costs ($)</Label>
                    <Input
                      type="number"
                      value={assumptions.staffing_costs[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("staffing_costs", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Marketing Costs ($)</Label>
                    <Input
                      type="number"
                      value={assumptions.marketing_costs[year]}
                      onChange={(e) =>
                        handleYearlyUpdate("marketing_costs", year, parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProFormaAssumptions;
