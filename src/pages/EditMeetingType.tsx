import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  required: boolean;
}

const EditMeetingType = () => {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [locationType, setLocationType] = useState("zoom");
  const [customLocationUrl, setCustomLocationUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadMeetingType();
      }
    });
  }, [navigate, id]);

  const loadMeetingType = async () => {
    try {
      const { data, error } = await supabase
        .from("meeting_types")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setName(data.name);
      setDescription(data.description || "");
      setDuration(data.duration.toString());
      setLocationType(data.location_type);
      setCustomLocationUrl(data.custom_location_url || "");
      setIsActive(data.is_active ?? true);
      
      if (data.pre_meeting_questions && Array.isArray(data.pre_meeting_questions)) {
        setQuestions(
          data.pre_meeting_questions.map((q: any, idx: number) => ({
            id: `q-${idx}`,
            question: q.question,
            required: q.required ?? true,
          }))
        );
      }
    } catch (error: any) {
      toast({
        title: "Error loading meeting type",
        description: error.message,
        variant: "destructive",
      });
      navigate("/meeting-types");
    } finally {
      setLoading(false);
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
    setSaving(true);

    try {
      const filteredQuestions = questions
        .filter((q) => q.question.trim())
        .map((q) => ({ question: q.question, required: q.required }));

      const { error } = await supabase
        .from("meeting_types")
        .update({
          name,
          description,
          duration: parseInt(duration),
          location_type: locationType as "phone" | "zoom" | "teams" | "meet" | "in-person" | "custom" | "seeksy_studio",
          custom_location_url: locationType === "custom" ? customLocationUrl : null,
          pre_meeting_questions: filteredQuestions as any,
          is_active: isActive,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Meeting type updated!",
        description: "Your changes have been saved.",
      });

      navigate("/meeting-types");
    } catch (error: any) {
      toast({
        title: "Error updating meeting type",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">Edit Meeting Type</h1>
            <p className="text-muted-foreground mt-1">
              Update your meeting template settings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="is-active" className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Allow people to book this meeting type
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

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
              <Label htmlFor="description">Description</Label>
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
                <Label htmlFor="location-type">Location *</Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger id="location-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeksy_studio">Seeksy Studio</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="custom">Custom Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {locationType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-url">Custom Location URL *</Label>
                <Input
                  id="custom-url"
                  type="url"
                  value={customLocationUrl}
                  onChange={(e) => setCustomLocationUrl(e.target.value)}
                  required
                  placeholder="https://meet.example.com/your-room"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Pre-Meeting Questions</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask questions before the meeting is booked
                  </p>
                </div>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.map((q) => (
                <div key={q.id} className="flex gap-2">
                  <Input
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, e.target.value)}
                    placeholder="What would you like to discuss?"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/meeting-types")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default EditMeetingType;
