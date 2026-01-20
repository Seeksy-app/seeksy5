import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminConversationalDemo = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [agentName, setAgentName] = useState("Seeksy Demo Agent");
  const [prompt, setPrompt] = useState(
    "You are a friendly AI assistant demonstrating conversational advertising for Seeksy. Answer questions about how conversational ads work, their benefits, and how advertisers can use them. Be enthusiastic and helpful!"
  );
  const [selectedVoice, setSelectedVoice] = useState("EXAVITQu4vr4xnSDxMaL");
  const [createdAgentId, setCreatedAgentId] = useState("");

  const voices = [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah - Friendly Female" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam - Professional Male" },
    { id: "pqHfZKP75CvOlQylNhV4", name: "Bill - Warm Male" },
    { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte - Clear Female" },
  ];

  const handleCreateAgent = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-create-demo-agent', {
        body: {
          name: agentName,
          prompt: prompt,
          voice: selectedVoice
        }
      });

      if (error) throw error;

      setCreatedAgentId(data.agentId);
      
      toast({
        title: "Demo agent created!",
        description: `Agent ID: ${data.agentId}`,
      });
    } catch (error) {
      console.error('Error creating demo agent:', error);
      toast({
        title: "Failed to create agent",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Conversational AI Demo Setup</h1>
        <p className="text-muted-foreground">
          Set up the demo conversational AI agent for advertisers to test
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Demo Agent</CardTitle>
            <CardDescription>
              This creates a demo conversational AI agent that advertisers can test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Seeksy Demo Agent"
              />
            </div>

            <div>
              <Label htmlFor="voice">Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="Enter the system prompt for the AI agent..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                This defines how the AI will behave and respond to questions
              </p>
            </div>

            <Button
              onClick={handleCreateAgent}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                "Create Demo Agent"
              )}
            </Button>

            {createdAgentId && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="font-medium mb-2">Agent Created Successfully!</p>
                <p className="text-sm text-muted-foreground mb-2">Agent ID:</p>
                <code className="text-sm bg-background p-2 rounded block break-all">
                  {createdAgentId}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Number Setup (Optional)
            </CardTitle>
            <CardDescription>
              To add a phone number to your demo agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Log in to your ElevenLabs account</li>
              <li>Go to Conversational AI → Agents</li>
              <li>Find your agent using the Agent ID above</li>
              <li>Click "Add Phone Number"</li>
              <li>Select a phone number from available options</li>
              <li>Configure call routing and settings</li>
              <li>Test by calling the number</li>
            </ol>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => window.open('https://elevenlabs.io/app/conversational-ai', '_blank')}
            >
              Open ElevenLabs Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminConversationalDemo;
