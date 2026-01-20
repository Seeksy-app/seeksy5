import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PersonaDialog } from "@/components/ai/PersonaDialog";
import { AskAIButton } from "@/components/ai/AskAIButton";

interface Question {
  id: string;
  question: string;
  required: boolean;
}

const CreateMeetingType = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [locationType, setLocationType] = useState("zoom");
  const [customLocationUrl, setCustomLocationUrl] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [miaDialogOpen, setMiaDialogOpen] = useState(false);
  const [miaPrompt, setMiaPrompt] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkCalendarConnection(session.user.id);
      }
    });
  }, [navigate]);

  const checkCalendarConnection = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("calendar_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "google")
        .single();

      if (data) {
        setCalendarConnected(true);
      }

      const { data: microsoftData } = await supabase
        .from("microsoft_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (microsoftData) {
        setMicrosoftConnected(true);
      }
    } catch (error) {
      console.error("Error checking calendar connection:", error);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: `q-${Date.now()}`, question: "", required: true },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, question: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, question } : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filteredQuestions = questions
        .filter((q) => q.question.trim())
        .map((q) => ({ question: q.question, required: q.required }));

      const { error } = await supabase.from("meeting_types").insert([
        {
          user_id: user?.id,
          name,
          description,
          duration: parseInt(duration),
          location_type: locationType as "phone" | "zoom" | "teams" | "meet" | "in-person" | "custom" | "seeksy_studio",
          custom_location_url: locationType === "custom" ? customLocationUrl : null,
          pre_meeting_questions: filteredQuestions as any,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Meeting type created!",
        description: "Your meeting type has been saved.",
      });

      navigate("/meeting-types");
    } catch (error: any) {
      toast({
        title: "Error creating meeting type",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/meeting-types")}
          className="mb-4"
        >
          ← Back to Meeting Types
        </Button>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Create Meeting Type</h1>
            <p className="text-muted-foreground mt-1">
              Set up a template for recurring meeting types
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Meeting Type Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="15 Minute Chat"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <AskAIButton
                  persona="Mia"
                  onClick={() => {
                    setMiaPrompt("Generate a professional description for a meeting type");
                    setMiaDialogOpen(true);
                  }}
                />
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A quick 15-minute conversation..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type *</Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger id="locationType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeksy_studio">Seeksy Studio</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="meet">
                      Google Meet {calendarConnected && '✓ Connected'}
                    </SelectItem>
                    <SelectItem value="teams">
                      Microsoft Teams {microsoftConnected && '✓ Connected'}
                    </SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="custom">Custom Link</SelectItem>
                  </SelectContent>
                </Select>
                {locationType === 'meet' && !calendarConnected && (
                  <p className="text-sm text-muted-foreground">
                    Connect Google Calendar in <button onClick={() => navigate('/integrations')} className="text-primary underline">Integrations</button> to auto-generate Meet links
                  </p>
                )}
                {locationType === 'meet' && calendarConnected && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Google Meet links will be automatically generated
                  </p>
                )}
                {locationType === 'teams' && !microsoftConnected && (
                  <p className="text-sm text-muted-foreground">
                    Connect Microsoft in <button onClick={() => navigate('/integrations')} className="text-primary underline">Integrations</button> to auto-generate Teams links
                  </p>
                )}
                {locationType === 'teams' && microsoftConnected && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Microsoft Teams links will be automatically generated
                  </p>
                )}
              </div>
            </div>

            {locationType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customUrl">Custom Location URL</Label>
                <Input
                  id="customUrl"
                  type="url"
                  value={customLocationUrl}
                  onChange={(e) => setCustomLocationUrl(e.target.value)}
                  placeholder="https://your-meeting-link.com"
                />
              </div>
            )}

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg">Pre-Meeting Questions</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask attendees questions before the meeting
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <Card key={q.id} className="p-4">
                      <div className="flex gap-4 items-center">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, e.target.value)}
                            placeholder={`Question ${index + 1}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(q.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">No questions yet</p>
                  <p className="text-xs mt-1">Add questions to gather information from attendees</p>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Meeting Type
            </Button>
          </form>
        </Card>

        <PersonaDialog
          open={miaDialogOpen}
          onOpenChange={setMiaDialogOpen}
          persona="Mia"
          prompt={miaPrompt}
          context={{ name, duration, locationType }}
          onApply={(result) => setDescription(result)}
          placeholder="Describe the meeting purpose and Mia will create a clear description"
        />
      </main>
    </div>
  );
};

export default CreateMeetingType;
