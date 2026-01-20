import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Building2, Users, DollarSign, ExternalLink, Mail } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  slug: string;
  type: string;
  contact_name: string | null;
  contact_email: string | null;
  product_source: string[] | null;
  billing_model: string;
  per_lead_rate: number;
  subscription_rate: number;
  status: string;
  portal_enabled: boolean;
  created_at: string;
}

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    slug: "",
    type: "lead_buyer",
    contact_name: "",
    contact_email: "",
    product_source: [] as string[],
    billing_model: "per_lead",
    per_lead_rate: 0,
    subscription_rate: 0,
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Partner[];
    },
  });

  const createPartner = useMutation({
    mutationFn: async (partner: typeof newPartner) => {
      const { error } = await supabase.from("partners").insert({
        ...partner,
        slug: partner.slug || partner.name.toLowerCase().replace(/\s+/g, "-"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setIsCreateOpen(false);
      setNewPartner({
        name: "",
        slug: "",
        type: "lead_buyer",
        contact_name: "",
        contact_email: "",
        product_source: [],
        billing_model: "per_lead",
        per_lead_rate: 0,
        subscription_rate: 0,
      });
      toast.success("Partner created successfully");
    },
    onError: (err) => toast.error("Failed to create partner"),
  });

  const productSources = [
    { id: "veteran", label: "Veteran Benefits" },
    { id: "campaign", label: "CampaignStaff" },
    { id: "seeksy", label: "Seeksy Creators" },
  ];

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      lead_buyer: "bg-blue-100 text-blue-800",
      managed_service: "bg-purple-100 text-purple-800",
      hybrid: "bg-amber-100 text-amber-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="text-muted-foreground">
            Manage lead buyers, managed service clients, and partner portals
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Partner Name</Label>
                  <Input
                    value={newPartner.name}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, name: e.target.value })
                    }
                    placeholder="Acme Claims Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={newPartner.slug}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, slug: e.target.value })
                    }
                    placeholder="acme-claims"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Partner Type</Label>
                <Select
                  value={newPartner.type}
                  onValueChange={(v) => setNewPartner({ ...newPartner, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_buyer">Lead Buyer (Pay per lead)</SelectItem>
                    <SelectItem value="managed_service">Managed Service Client</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={newPartner.contact_name}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, contact_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={newPartner.contact_email}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, contact_email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lead Sources</Label>
                <div className="flex flex-wrap gap-3">
                  {productSources.map((source) => (
                    <div key={source.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={source.id}
                        checked={newPartner.product_source.includes(source.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewPartner({
                              ...newPartner,
                              product_source: [...newPartner.product_source, source.id],
                            });
                          } else {
                            setNewPartner({
                              ...newPartner,
                              product_source: newPartner.product_source.filter(
                                (s) => s !== source.id
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={source.id} className="text-sm font-normal">
                        {source.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Billing Model</Label>
                <Select
                  value={newPartner.billing_model}
                  onValueChange={(v) =>
                    setNewPartner({ ...newPartner, billing_model: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_lead">Per Lead</SelectItem>
                    <SelectItem value="subscription">Monthly Subscription</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Per Lead Rate ($)</Label>
                  <Input
                    type="number"
                    value={newPartner.per_lead_rate}
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        per_lead_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Subscription ($)</Label>
                  <Input
                    type="number"
                    value={newPartner.subscription_rate}
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        subscription_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => createPartner.mutate(newPartner)}
                disabled={!newPartner.name}
              >
                Create Partner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading partners...</div>
      ) : !partners?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No partners yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first partner to start assigning leads
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">/{partner.slug}</p>
                  </div>
                  <Badge className={getTypeBadge(partner.type)}>
                    {partner.type.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {partner.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{partner.contact_email}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {partner.product_source?.map((source) => (
                    <Badge key={source} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm pt-2 border-t">
                  {partner.per_lead_rate > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>${partner.per_lead_rate}/lead</span>
                    </div>
                  )}
                  {partner.subscription_rate > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>${partner.subscription_rate}/mo</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="h-4 w-4 mr-1" />
                    Assign Leads
                  </Button>
                  {partner.portal_enabled && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/partner/${partner.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
