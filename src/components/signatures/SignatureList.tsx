import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Copy, CheckCircle, Mail } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignatureListProps {
  signatures: any[];
  onSelect: (signature: any) => void;
  onDelete: (id: string) => void;
}

export function SignatureList({ signatures, onSelect, onDelete }: SignatureListProps) {
  const { toast } = useToast();

  const handleToggleActive = async (signature: any) => {
    try {
      // Toggle active state - allow multiple active signatures
      const newActiveState = !signature.is_active;
      
      await (supabase as any)
        .from("email_signatures")
        .update({ is_active: newActiveState })
        .eq("id", signature.id);

      toast({
        title: newActiveState ? "Signature activated" : "Signature deactivated",
        description: `"${signature.name}" is now ${newActiveState ? "active" : "inactive"}`,
      });

      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error("Error toggling active signature:", error);
      toast({
        title: "Error",
        description: "Failed to update signature",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (signature: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSignature = {
        ...signature,
        id: undefined,
        name: `${signature.name} (Copy)`,
        is_active: false,
        created_at: undefined,
        updated_at: undefined,
      };

      const result = await (supabase as any)
        .from("email_signatures")
        .insert(newSignature);

      if (result.error) throw result.error;

      toast({
        title: "Signature duplicated",
        description: "A copy has been created",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error duplicating signature:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate signature",
        variant: "destructive",
      });
    }
  };

  const handleToggleUsage = async (signature: any, field: 'use_in_gmail' | 'use_in_seeksy_mail') => {
    try {
      const newValue = !signature[field];
      
      await (supabase as any)
        .from("email_signatures")
        .update({ [field]: newValue })
        .eq("id", signature.id);

      toast({
        title: "Usage updated",
        description: `Signature ${newValue ? "enabled" : "disabled"} for ${field === 'use_in_gmail' ? 'Gmail' : 'Seeksy Mail'}`,
      });

      window.location.reload();
    } catch (error) {
      console.error("Error updating signature usage:", error);
      toast({
        title: "Error",
        description: "Failed to update signature",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {signatures.map((signature) => (
        <Card 
          key={signature.id} 
          className={`cursor-pointer transition-all hover:shadow-md ${
            signature.is_active ? "ring-2 ring-primary" : ""
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{signature.name}</CardTitle>
                <CardDescription className="text-xs">
                  Updated {format(new Date(signature.updated_at), "MMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {signature.is_active && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => onSelect(signature)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(signature)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {signature.is_active ? "Deactivate" : "Set as Active"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleUsage(signature, 'use_in_gmail')}>
                      <Mail className="h-4 w-4 mr-2" />
                      {signature.use_in_gmail !== false ? "Disable in Gmail" : "Enable in Gmail"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleUsage(signature, 'use_in_seeksy_mail')}>
                      <Mail className="h-4 w-4 mr-2" />
                      {signature.use_in_seeksy_mail !== false ? "Disable in Seeksy Mail" : "Enable in Seeksy Mail"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(signature)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(signature.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Usage badges */}
            <div className="flex gap-1 mb-2">
              {signature.use_in_gmail !== false && (
                <Badge variant="outline" className="text-xs">Gmail</Badge>
              )}
              {signature.use_in_seeksy_mail !== false && (
                <Badge variant="outline" className="text-xs">Seeksy Mail</Badge>
              )}
            </div>
            {/* Mini preview */}
            <div 
              className="bg-muted/30 rounded-md p-3 text-xs space-y-1 cursor-pointer"
              onClick={() => onSelect(signature)}
            >
              {signature.profile_name && (
                <p className="font-semibold text-foreground">{signature.profile_name}</p>
              )}
              {signature.profile_title && (
                <p className="text-muted-foreground">{signature.profile_title}</p>
              )}
              {signature.company_name && (
                <p className="text-muted-foreground">{signature.company_name}</p>
              )}
              {!signature.profile_name && !signature.profile_title && !signature.company_name && (
                <p className="text-muted-foreground italic">Click to edit signature</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
