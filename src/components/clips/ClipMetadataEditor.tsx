import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { PersonaDialog } from "@/components/ai/PersonaDialog";

interface ClipMetadataEditorProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export const ClipMetadataEditor = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: ClipMetadataEditorProps) => {
  const [reelDialogOpen, setReelDialogOpen] = useState(false);
  const [reelPrompt, setReelPrompt] = useState("");
  const [targetField, setTargetField] = useState<"title" | "description">("title");

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Clip Title</Label>
            <AskAIButton
              persona="Reel"
              onClick={() => {
                setTargetField("title");
                setReelPrompt("Generate a catchy social media clip title");
                setReelDialogOpen(true);
              }}
            />
          </div>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My awesome clip"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Description</Label>
            <AskAIButton
              persona="Reel"
              onClick={() => {
                setTargetField("description");
                setReelPrompt("Write an engaging social media caption for this clip");
                setReelDialogOpen(true);
              }}
            />
          </div>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your clip"
            rows={3}
          />
        </div>
      </div>

      <PersonaDialog
        open={reelDialogOpen}
        onOpenChange={setReelDialogOpen}
        persona="Reel"
        prompt={reelPrompt}
        context={{ title, description }}
        onApply={(result) => {
          if (targetField === "title") {
            onTitleChange(result);
          } else {
            onDescriptionChange(result);
          }
        }}
        placeholder="Describe the clip content and Reel will create engaging text"
      />
    </>
  );
};
