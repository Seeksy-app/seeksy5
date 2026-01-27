import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface ClientsTabProps {
  userId: string;
}

export const ClientsTab = ({ userId }: ClientsTabProps) => {
  const navigate = useNavigate();
  
  const { data: clients } = useQuery({
    queryKey: ["pm-contacts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Clients & Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your clients from Contacts. <Link to="/contacts" className="text-primary hover:underline">Go to Contacts →</Link>
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {clients?.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {client.company || client.name}
                  </CardTitle>
                  {client.company && (
                    <p className="text-sm text-foreground mt-1">{client.name}</p>
                  )}
                </div>
                <Badge variant={(client as any).lead_status === 'customer' ? 'default' : 'secondary'}>
                  {(client as any).lead_status || 'contact'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>{client.company}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {clients?.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="mb-4">No contacts yet. Add contacts in the CRM to see them here.</p>
              <Button onClick={() => navigate('/contacts')}>
                Go to Contacts
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
