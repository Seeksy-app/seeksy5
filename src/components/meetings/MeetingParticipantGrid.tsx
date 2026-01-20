import React from 'react';
import { User, VideoOff as VideoOffIcon } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isScreenSharing?: boolean;
}

interface MeetingParticipantGridProps {
  participants: Participant[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

const MeetingParticipantGrid: React.FC<MeetingParticipantGridProps> = ({
  participants,
  localVideoRef,
  isVideoOff,
  isScreenSharing,
}) => {
  const totalParticipants = participants.length + 1; // +1 for local user

  // Calculate grid layout based on participant count
  const getGridClass = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-3';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const ParticipantTile = ({ 
    name, 
    isLocal = false, 
    videoRef,
    showVideo = true,
    isMuted = false,
  }: { 
    name: string; 
    isLocal?: boolean; 
    videoRef?: React.RefObject<HTMLVideoElement>;
    showVideo?: boolean;
    isMuted?: boolean;
  }) => (
    <div className="relative bg-slate-700 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
      {showVideo && videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mb-2">
            <User className="h-10 w-10 text-slate-400" />
          </div>
          {!showVideo && (
            <div className="absolute top-3 right-3 bg-slate-800/80 rounded-full p-2">
              <VideoOffIcon className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </div>
      )}
      
      {/* Name Badge */}
      <div className="absolute bottom-3 left-3 bg-slate-900/80 px-3 py-1 rounded-lg">
        <span className="text-white text-sm font-medium">
          {name} {isLocal && '(You)'}
        </span>
        {isMuted && (
          <span className="ml-2 text-red-400 text-xs">🔇</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className={`grid ${getGridClass()} gap-4 w-full max-w-6xl`}>
        {/* Local User */}
        <ParticipantTile
          name="You"
          isLocal
          videoRef={localVideoRef}
          showVideo={!isVideoOff}
        />

        {/* Remote Participants */}
        {participants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            name={participant.name}
            showVideo={!participant.isVideoOff}
            isMuted={participant.isMuted}
          />
        ))}

        {/* Empty state when alone */}
        {participants.length === 0 && (
          <div className="bg-slate-700/50 rounded-xl aspect-video flex items-center justify-center border-2 border-dashed border-slate-600">
            <div className="text-center text-slate-400">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for participants...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingParticipantGrid;
