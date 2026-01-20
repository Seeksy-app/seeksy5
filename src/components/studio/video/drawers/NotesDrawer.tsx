import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Eye, EyeOff } from "lucide-react";

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotesDrawer({ isOpen, onClose }: NotesDrawerProps) {
  const [notes, setNotes] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Notes</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPrivate(!isPrivate)}
            className="text-white/70 hover:text-white gap-1"
          >
            {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPrivate ? "Private" : "Visible"}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your host notes here... Only you can see these notes during the stream."
          className="h-full resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          {isPrivate ? "🔒 Only you can see these notes" : "👁 Notes visible to guests"}
        </p>
      </div>
    </div>
  );
}
