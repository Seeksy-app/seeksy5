import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export function InviteGuestModal({ isOpen, onClose, sessionId }: InviteGuestModalProps) {
  const [allowRebroadcast, setAllowRebroadcast] = useState(false);
  const inviteLink = `${window.location.origin}/studio/guest/${sessionId || "demo"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const handleRegenerateLink = () => {
    toast.info("Link regenerated!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            Invite up to 6 guests
            <span className="text-blue-500 text-sm font-normal ml-2">
              Need more? <span className="underline cursor-pointer">Upgrade</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Invite Link */}
          <div className="flex items-center gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="flex-1 bg-gray-50 border-gray-200 text-gray-600 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerateLink}
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyLink}
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Copy Button */}
          <Button
            onClick={handleCopyLink}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Invite Link
          </Button>

          {/* Add Placeholder */}
          <Button
            variant="outline"
            className="w-full h-12 border-gray-200 text-gray-700 font-medium gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Placeholder
          </Button>

          {/* Rebroadcast Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Allow guests to re-broadcast</p>
              <p className="text-sm text-gray-500">Double your views with their channels.</p>
            </div>
            <Switch
              checked={allowRebroadcast}
              onCheckedChange={setAllowRebroadcast}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
