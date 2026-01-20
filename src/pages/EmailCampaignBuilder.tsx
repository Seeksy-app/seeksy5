import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Send, Calendar, Smartphone, Monitor, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import { EMAIL_PERSONAS } from "@/lib/email-personas";
import { CampaignBuilderEnhancements } from "@/components/email/CampaignBuilderEnhancements";
import { cn } from "@/lib/utils";

type SendMode = "now" | "scheduled";
type PreviewDevice = "mobile" | "desktop";
type PreviewTheme = "light" | "dark";

export default function EmailCampaignBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [testEmail, setTestEmail] = useState("");
  
  // Preview states
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("mobile");
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["email-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: lists } = useQuery({
    queryKey: ["contact-lists", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("contact_lists")
        .select("*, contact_list_members(count)")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: templates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const sendCampaign = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!selectedList || !selectedAccount || !subject || !selectedTemplate) {
        throw new Error("Please fill in all required fields");
      }

      const scheduledSendAt = sendMode === "scheduled" && scheduledDate && scheduledTime 
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null;

      const { data, error } = await supabase.functions.invoke("send-campaign-email", {
        body: {
          listId: selectedList,
          accountId: selectedAccount,
          subject,
          preheader: preheader || null,
          templateId: selectedTemplate,
          userId: user.id,
          scheduledSendAt,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      if (sendMode === "scheduled") {
        toast.success(`Campaign scheduled for ${format(new Date(`${scheduledDate}T${scheduledTime}`), "MMM d, yyyy 'at' h:mm a")}`);
      } else {
        toast.success(`Campaign sent to ${data.recipientCount} contacts`);
      }
      navigate("/email-campaigns");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send campaign");
    },
  });

  const selectedListData = lists?.find(l => l.id === selectedList);
  const audienceSize = selectedListData?.contact_list_members?.[0]?.count || 0;

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-foreground">Create Email Campaign</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Design and send personalized emails to your audience</p>
        </div>

        <div className="grid grid-cols-[60%_40%] gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Campaign Details Card */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-[18px] font-semibold mb-4">Campaign Details</h3>
              <div className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="mt-1.5 text-[15px] h-11"
                  />
                </div>

                <div>
                  <Label>Preheader Text</Label>
                  <Input
                    value={preheader}
                    onChange={(e) => setPreheader(e.target.value)}
                    placeholder="Preview text that appears after subject line"
                    maxLength={100}
                    className="mt-1.5 text-[14px] h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {preheader.length}/100 characters
                  </p>
                </div>

                <CampaignBuilderEnhancements
                  subject={subject}
                  preheader={preheader}
                  selectedTemplate={selectedTemplate}
                  selectedList={selectedList}
                  selectedAccount={selectedAccount}
                />

                <div>
                  <Label>From Email</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select email account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.email_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Persona</Label>
                  <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMAIL_PERSONAS).map(([key, persona]) => (
                        <SelectItem key={key} value={key}>
                          {persona.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Audience Card */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-[18px] font-semibold mb-4">Audience</h3>
              <div className="space-y-4">
                <div>
                  <Label>Subscriber List</Label>
                  <Select value={selectedList} onValueChange={setSelectedList}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select subscriber list" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists?.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name} ({list.contact_list_members?.[0]?.count || 0} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedList && (
                  <div className="text-sm text-muted-foreground">
                    Audience Size: <span className="font-semibold text-foreground">{audienceSize}</span> contacts
                  </div>
                )}
              </div>
            </div>

            {/* Template Selector */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-[18px] font-semibold mb-4">Template</h3>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Send Options */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-[18px] font-semibold mb-4">Send Options</h3>
              <RadioGroup value={sendMode} onValueChange={(v) => setSendMode(v as SendMode)}>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="now" id="now" />
                  <Label htmlFor="now" className="cursor-pointer">Send Now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="cursor-pointer">Schedule Send</Label>
                </div>
              </RadioGroup>

              {sendMode === "scheduled" && (
                <div className="mt-4 space-y-3 pl-6 border-l-2 border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Date</Label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={getTomorrowDate()}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Time</Label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  {scheduledDate && scheduledTime && (
                    <p className="text-sm text-muted-foreground">
                      Will send on {format(new Date(`${scheduledDate}T${scheduledTime}`), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Test Email */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-[18px] font-semibold mb-4">Test Email</h3>
              <div className="flex gap-2">
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Send test to..."
                  type="email"
                />
                <Button variant="outline">Send Test</Button>
              </div>
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="sticky top-8 h-fit">
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold">Live Preview</h3>
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      previewDevice === "mobile" ? "bg-white shadow-sm" : "hover:bg-white/50"
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      previewDevice === "desktop" ? "bg-white shadow-sm" : "hover:bg-white/50"
                    )}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewTheme(previewTheme === "light" ? "dark" : "light")}
                    className="p-1.5 rounded hover:bg-white/50 transition-colors ml-1"
                  >
                    {previewTheme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* iPhone Frame */}
              <div className="flex justify-center">
                <div 
                  className={cn(
                    "rounded-[36px] border-[8px] border-gray-800 overflow-hidden shadow-2xl transition-all",
                    previewDevice === "mobile" ? "w-[375px] h-[667px]" : "w-full h-[600px] rounded-xl border-[4px]"
                  )}
                >
                  <div 
                    className={cn(
                      "w-full h-full overflow-y-auto",
                      previewTheme === "dark" ? "bg-gray-900" : "bg-white"
                    )}
                  >
                    {/* Email Preview Content */}
                    <div className="p-6">
                      <div className={cn(
                        "text-sm mb-2",
                        previewTheme === "dark" ? "text-gray-400" : "text-gray-600"
                      )}>
                        From: {accounts?.find(a => a.id === selectedAccount)?.email_address || "sender@email.com"}
                      </div>
                      <div className={cn(
                        "text-lg font-semibold mb-1",
                        previewTheme === "dark" ? "text-white" : "text-gray-900"
                      )}>
                        {subject || "Your email subject"}
                      </div>
                      {preheader && (
                        <div className={cn(
                          "text-sm mb-4",
                          previewTheme === "dark" ? "text-gray-400" : "text-gray-600"
                        )}>
                          {preheader}
                        </div>
                      )}
                      <div className={cn(
                        "border-t pt-4",
                        previewTheme === "dark" ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"
                      )}>
                        <p className="mb-3">Email content will appear here...</p>
                        <p className="text-sm opacity-70">Select a template to preview</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Button */}
        <div className="fixed bottom-8 right-8">
          <Button
            size="lg"
            onClick={() => sendCampaign.mutate()}
            disabled={sendCampaign.isPending || !selectedList || !selectedAccount || !subject || !selectedTemplate}
            className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a] text-white shadow-lg h-12 px-8"
          >
            {sendCampaign.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {sendMode === "scheduled" ? "Scheduling..." : "Sending..."}
              </>
            ) : (
              <>
                {sendMode === "scheduled" ? (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Campaign
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Campaign
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
