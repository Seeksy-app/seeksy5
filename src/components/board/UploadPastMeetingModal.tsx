import { useState } from "react";
import { format } from "date-fns";
import { Upload, FileText, Mic, Sparkles, Loader2, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UploadPastMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (meetingId: string) => void;
}

export function UploadPastMeetingModal({
  open,
  onOpenChange,
  onSuccess,
}: UploadPastMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [transcript, setTranscript] = useState("");
  const [agenda, setAgenda] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const handleTranscriptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setTranscript(text);
      toast.success("Transcript loaded");
    } catch (error) {
      toast.error("Failed to read transcript file");
    }
  };

  const handleAgendaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setAgenda(text);
      toast.success("Agenda loaded");
    } catch (error) {
      toast.error("Failed to read agenda file");
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      toast.success(`Audio file selected: ${file.name}`);
    }
  };

  const handleSubmit = async (generateNotes: boolean = false) => {
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }
    // Require either transcript OR audio file
    if (!transcript.trim() && !audioFile) {
      toast.error("Please provide a transcript or audio file");
      return;
    }

    setIsSubmitting(true);
    if (generateNotes) setIsGeneratingNotes(true);

    try {
      // Get current user
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        toast.error("You must be logged in to upload meetings");
        return;
      }

      const hasTextTranscript = transcript.trim().length > 0;
      const needsAudioTranscription = !hasTextTranscript && audioFile;

      // 1. Create the meeting record with host/creator info
      const { data: meeting, error: createError } = await supabase
        .from("board_meeting_notes")
        .insert({
          title: title.trim(),
          meeting_date: meetingDate,
          audio_transcript: hasTextTranscript ? transcript.trim() : null,
          meeting_agenda: agenda.trim() || null,
          ai_notes_status: hasTextTranscript ? "transcribed" : "pending",
          status: "completed",
          duration_minutes: 60, // default
          host_user_id: userData.user.id,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      let audioPath: string | null = null;

      // 2. Upload audio file if provided
      if (audioFile && meeting) {
        audioPath = `${meeting.id}/${audioFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("meeting-recordings")
          .upload(audioPath, audioFile);

        if (uploadError) {
          console.error("Audio upload failed:", uploadError);
          toast.warning("Meeting created but audio upload failed");
          audioPath = null;
        } else {
          // Update meeting with audio path
          await supabase
            .from("board_meeting_notes")
            .update({ audio_file_url: audioPath })
            .eq("id", meeting.id);
        }
      }

      // 3. Transcribe audio if no text transcript was provided
      if (needsAudioTranscription && audioPath && meeting) {
        toast.info("Transcribing audio...");
        
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
          "transcribe-meeting-audio",
          { body: { meetingNoteId: meeting.id, audioFilePath: audioPath } }
        );

        if (transcribeError || transcribeData?.error) {
          console.error("Transcription failed:", transcribeError || transcribeData?.error);
          toast.error("Failed to transcribe audio: " + (transcribeData?.error || transcribeError?.message));
          setIsSubmitting(false);
          setIsGeneratingNotes(false);
          return;
        }
        
        toast.success("Audio transcribed successfully");
      }

      toast.success("Meeting uploaded successfully");

      // 4. Generate AI notes if requested
      if (generateNotes && meeting) {
        toast.info("Generating AI notes...");
        
        const { data: notesData, error: notesError } = await supabase.functions.invoke(
          "generate-board-ai-notes",
          { body: { meetingNoteId: meeting.id } }
        );

        if (notesError || notesData?.error) {
          toast.error(notesData?.error || "Failed to generate AI notes");
        } else {
          toast.success("AI notes generated!");
        }
      }

      // Reset and close
      setTitle("");
      setTranscript("");
      setAgenda("");
      setAudioFile(null);
      setMeetingDate(format(new Date(), "yyyy-MM-dd"));
      onOpenChange(false);
      onSuccess(meeting.id);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload meeting");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingNotes(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Past Meeting
          </DialogTitle>
          <DialogDescription>
            Upload a transcript or audio file from a past meeting to generate AI notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meeting Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="e.g., Board Meeting - December 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Meeting Date</Label>
              <Input
                id="date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </div>
          </div>

          {/* Agenda Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="agenda" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Meeting Agenda (Optional)
              </Label>
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  className="hidden"
                  onChange={handleAgendaFileUpload}
                />
                <span className="text-sm text-primary hover:underline">
                  Upload file
                </span>
              </label>
            </div>
            <Textarea
              id="agenda"
              placeholder="Paste your meeting agenda here to help AI generate better structured notes..."
              className="min-h-[100px] text-sm"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Providing an agenda helps AI generate more accurate key topics and action items
            </p>
          </div>

          {/* Transcript Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="transcript" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transcript
              </Label>
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  className="hidden"
                  onChange={handleTranscriptFileUpload}
                />
                <span className="text-sm text-primary hover:underline">
                  Upload file
                </span>
              </label>
            </div>
            <Textarea
              id="transcript"
              placeholder="Paste your meeting transcript here, or upload a text file..."
              className="min-h-[200px] font-mono text-sm"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            {transcript && (
              <p className="text-xs text-muted-foreground">
                {transcript.split(/\s+/).length} words
              </p>
            )}
          </div>

          {/* Audio Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Audio Recording (Optional)
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {audioFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="text-sm">{audioFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="audio/*,.webm,.mp3,.m4a,.wav"
                    className="hidden"
                    onChange={handleAudioFileChange}
                  />
                  <div className="text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Click to upload audio file</p>
                    <p className="text-xs">MP3, WAV, M4A, WEBM</p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !title.trim() || (!transcript.trim() && !audioFile)}
          >
            {isSubmitting && !isGeneratingNotes ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Only
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !title.trim() || (!transcript.trim() && !audioFile)}
          >
            {isGeneratingNotes ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Save & Generate AI Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
