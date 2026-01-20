import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Check, X, Clock } from 'lucide-react';

interface WaitingParticipant {
  id: string;
  guest_name?: string;
  guest_email?: string;
  user_id?: string;
  created_at: string;
}

interface MeetingWaitingRoomProps {
  participants: WaitingParticipant[];
  onAdmit: (participantId: string) => void;
  onReject: (participantId: string) => void;
  onClose: () => void;
}

const MeetingWaitingRoom: React.FC<MeetingWaitingRoomProps> = ({
  participants,
  onAdmit,
  onReject,
  onClose,
}) => {
  const formatWaitTime = (createdAt: string) => {
    const waitMs = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(waitMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min';
    return `${mins} mins`;
  };

  const admitAll = () => {
    participants.forEach((p) => onAdmit(p.id));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Waiting Room ({participants.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {participants.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No one is waiting to join.
            </p>
          ) : (
            <>
              {/* Admit All Button */}
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={admitAll}
                  className="border-green-500 text-green-400 hover:bg-green-500/20"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Admit All
                </Button>
              </div>

              {/* Participant List */}
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {participant.guest_name || participant.guest_email || 'Guest'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Waiting {formatWaitTime(participant.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onReject(participant.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAdmit(participant.id)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingWaitingRoom;
