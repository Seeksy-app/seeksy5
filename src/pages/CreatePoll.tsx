import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "@/components/ImageUpload";

interface DateOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

const CreatePoll = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [requireVoterInfo, setRequireVoterInfo] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [dateOptions, setDateOptions] = useState<DateOption[]>([
    { id: "1", date: "", startTime: "", endTime: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const addDateOption = () => {
    setDateOptions([
      ...dateOptions,
      {
        id: Date.now().toString(),
        date: "",
        startTime: "",
        endTime: "",
      },
    ]);
  };

  const removeDateOption = (id: string) => {
    if (dateOptions.length > 1) {
      setDateOptions(dateOptions.filter((opt) => opt.id !== id));
    }
  };

  const updateDateOption = (id: string, field: string, value: string) => {
    setDateOptions(
      dateOptions.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate at least one date option has a date
      const validOptions = dateOptions.filter((opt) => opt.date);
      if (validOptions.length === 0) {
        throw new Error("Please add at least one date option");
      }

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          user_id: user.id,
          title,
          description,
          deadline: deadline || null,
          allow_multiple_votes: allowMultipleVotes,
          require_voter_info: requireVoterInfo,
          image_url: imageUrl || null,
          is_published: publish,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const optionsData = validOptions.map((opt) => ({
        poll_id: poll.id,
        option_date: opt.date,
        start_time: opt.startTime || null,
        end_time: opt.endTime || null,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;

      toast({
        title: publish ? "Poll published!" : "Poll saved as draft",
        description: publish
          ? "Your poll is now live and ready for votes"
          : "You can publish it later",
      });

      navigate(`/poll/${poll.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating poll",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Poll</h1>
        <p className="text-muted-foreground mt-1">
          Find the best time for your next meeting
        </p>
      </div>

      <Card className="p-6">
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg font-semibold">
              Poll Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Team Meeting - Q1 Planning"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-lg font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the meeting purpose..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-semibold">
              Poll Image (Optional)
            </Label>
            <ImageUpload
              currentImage={imageUrl}
              onImageUploaded={setImageUrl}
              bucket="poll-images"
              label=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-lg font-semibold">
              Voting Deadline (Optional)
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Allow Multiple Votes</p>
              <p className="text-sm text-muted-foreground">
                Voters can select multiple time options
              </p>
            </div>
            <Switch
              checked={allowMultipleVotes}
              onCheckedChange={setAllowMultipleVotes}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Require Voter Name & Email</p>
              <p className="text-sm text-muted-foreground">
                Collect voter contact information for each vote
              </p>
            </div>
            <Switch
              checked={requireVoterInfo}
              onCheckedChange={setRequireVoterInfo}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Date & Time Options *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDateOption}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {dateOptions.map((option) => (
                <Card key={option.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <Label htmlFor={`date-${option.id}`} className="text-sm">
                        Date
                      </Label>
                      <Input
                        id={`date-${option.id}`}
                        type="date"
                        value={option.date}
                        onChange={(e) =>
                          updateDateOption(option.id, "date", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`start-${option.id}`} className="text-sm">
                        Start Time
                      </Label>
                      <Input
                        id={`start-${option.id}`}
                        type="time"
                        value={option.startTime}
                        onChange={(e) =>
                          updateDateOption(option.id, "startTime", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`end-${option.id}`} className="text-sm">
                          End Time
                        </Label>
                        <Input
                          id={`end-${option.id}`}
                          type="time"
                          value={option.endTime}
                          onChange={(e) =>
                            updateDateOption(option.id, "endTime", e.target.value)
                          }
                        />
                      </div>
                      {dateOptions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-6"
                          onClick={() => removeDateOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/polls")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading || !title}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Draft
            </Button>
            <Button
              type="submit"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || !title}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Poll
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreatePoll;