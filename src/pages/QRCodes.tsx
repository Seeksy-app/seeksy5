import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QRCodeSVG from "react-qr-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { Loader2, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QRCodes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom URL QR state
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  
  // Connect item QR state
  const [selectedType, setSelectedType] = useState<"meeting" | "event" | "signup" | "poll">("meeting");
  const [selectedItem, setSelectedItem] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  
  // Saved QR codes state
  const [savedQRCodes, setSavedQRCodes] = useState<any[]>([]);
  const [savedCodesLoading, setSavedCodesLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadItems();
      loadSavedQRCodes();
    }
  }, [selectedType, user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const loadItems = async () => {
    if (!user) return;
    
    setItemsLoading(true);
    setSelectedItem("");
    
    try {
      let query;
      switch (selectedType) {
        case "meeting":
          query = supabase
            .from("meeting_types")
            .select("id, name")
            .eq("user_id", user.id)
            .eq("is_active", true);
          break;
        case "event":
          query = supabase
            .from("events")
            .select("id, title")
            .eq("user_id", user.id)
            .eq("is_published", true);
          break;
        case "signup":
          query = supabase
            .from("signup_sheets")
            .select("id, title")
            .eq("user_id", user.id)
            .eq("is_published", true);
          break;
        case "poll":
          query = supabase
            .from("polls")
            .select("id, title")
            .eq("user_id", user.id)
            .eq("is_published", true);
          break;
      }
      
      const { data } = await query;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadSavedQRCodes = async () => {
    if (!user) return;
    
    setSavedCodesLoading(true);
    try {
      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setSavedQRCodes(data || []);
    } catch (error) {
      console.error("Error loading saved QR codes:", error);
    } finally {
      setSavedCodesLoading(false);
    }
  };

  const saveQRCode = async (url: string, title: string, type: string, itemId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("qr_codes")
        .insert({
          user_id: user.id,
          title,
          url,
          type,
          item_id: itemId || null,
        });

      if (error) throw error;

      toast({
        title: "QR Code saved",
        description: "Your QR code has been saved to your library.",
      });

      loadSavedQRCodes();
    } catch (error) {
      console.error("Error saving QR code:", error);
      toast({
        title: "Error",
        description: "Failed to save QR code.",
        variant: "destructive",
      });
    }
  };

  const deleteQRCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from("qr_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "QR Code deleted",
        description: "QR code has been removed from your library.",
      });

      loadSavedQRCodes();
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast({
        title: "Error",
        description: "Failed to delete QR code.",
        variant: "destructive",
      });
    }
  };

  const getItemUrl = () => {
    if (!selectedItem) return "";
    
    const baseUrl = window.location.origin;
    
    switch (selectedType) {
      case "meeting":
        return `${baseUrl}/book/${user?.user_metadata?.username || 'user'}/${selectedItem}`;
      case "event":
        return `${baseUrl}/event/${selectedItem}`;
      case "signup":
        return `${baseUrl}/signup-sheet/${selectedItem}`;
      case "poll":
        return `${baseUrl}/poll/${selectedItem}`;
      default:
        return "";
    }
  };

  const getItemTitle = () => {
    const item = items.find(i => i.id === selectedItem);
    return item ? (item.name || item.title) : "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-muted-foreground">
          Create QR codes for your links and Connect items
        </p>
      </div>

      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custom">Custom URL</TabsTrigger>
          <TabsTrigger value="connect">Connect Items</TabsTrigger>
          <TabsTrigger value="saved">Saved QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code for Any Link</CardTitle>
              <CardDescription>
                Enter any URL to create a downloadable QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., My Website"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              {customUrl && (
                <QRCodeGenerator
                  url={customUrl}
                  title={customTitle || "Custom Link"}
                  filename={customTitle ? `${customTitle.toLowerCase().replace(/\s+/g, '-')}-qr` : "custom-qr"}
                  onSave={() => saveQRCode(customUrl, customTitle || "Custom Link", "custom")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connect" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code for Connect Items</CardTitle>
              <CardDescription>
                Create QR codes for your meetings, events, sign-up sheets, and polls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Item Type</Label>
                <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting Type</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="signup">Sign-up Sheet</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item">Select Item</Label>
                <Select 
                  value={selectedItem} 
                  onValueChange={setSelectedItem}
                  disabled={itemsLoading || items.length === 0}
                >
                  <SelectTrigger id="item">
                    <SelectValue placeholder={
                      itemsLoading ? "Loading..." : 
                      items.length === 0 ? "No items available" : 
                      "Select an item"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name || item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <QRCodeGenerator
                  url={getItemUrl()}
                  title={getItemTitle()}
                  filename={`${getItemTitle().toLowerCase().replace(/\s+/g, '-')}-qr`}
                  onSave={() => saveQRCode(getItemUrl(), getItemTitle(), selectedType, selectedItem)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved QR Codes</CardTitle>
              <CardDescription>
                View and manage all your saved QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedCodesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : savedQRCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved QR codes yet. Create and save some from the other tabs!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedQRCodes.map((qrCode) => (
                    <Card key={qrCode.id} className="p-4">
                      <div className="space-y-3">
                        <div className="text-center">
                          <QRCodeSVG
                            value={qrCode.url}
                            size={128}
                            level="H"
                            fgColor="#0064B1"
                          />
                        </div>
                        
                        <div className="text-center space-y-1">
                          <h4 className="font-medium">{qrCode.title}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {qrCode.type} • {new Date(qrCode.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              // Trigger download for saved QR
                              const canvas = document.createElement("canvas");
                              const ctx = canvas.getContext("2d");
                              const img = new Image();
                              const svg = document.createElement("div");
                              svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="white"/></svg>`;
                              
                              canvas.width = 1024;
                              canvas.height = 1024;
                              
                              const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                              svgElement.setAttribute("width", "1024");
                              svgElement.setAttribute("height", "1024");
                              
                              // This is a simplified download - in a real implementation,
                              // you'd recreate the QR code properly
                              const link = document.createElement("a");
                              link.download = `${qrCode.title.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
                              // For now, just copy the URL to clipboard
                              navigator.clipboard.writeText(qrCode.url);
                              
                              toast({
                                title: "URL copied",
                                description: "QR code URL copied to clipboard. Full download feature coming soon!",
                              });
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteQRCode(qrCode.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
