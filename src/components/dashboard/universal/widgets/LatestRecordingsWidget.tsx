import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Upload, Play } from "lucide-react";

interface Recording {
  id: string;
  title: string;
  thumbnail?: string;
  duration: string;
  createdAt: string;
}

interface Props {
  recordings?: Recording[];
}

export function LatestRecordingsWidget({ recordings = [] }: Props) {
  const navigate = useNavigate();

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Video className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          Record or upload your first video.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate("/studio")}>
            <Play className="h-4 w-4 mr-2" />
            Record
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/media/library")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recordings.slice(0, 3).map((recording) => (
        <div
          key={recording.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate(`/media/library?id=${recording.id}`)}
        >
          <div className="w-16 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
            {recording.thumbnail ? (
              <img src={recording.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <Video className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{recording.title}</p>
            <p className="text-xs text-muted-foreground">{recording.duration} • {recording.createdAt}</p>
          </div>
        </div>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full text-xs"
        onClick={() => navigate("/media/library")}
      >
        View All Media
      </Button>
    </div>
  );
}
