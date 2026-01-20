import { Video, Scissors, Calendar, Users } from "lucide-react";

interface Stats {
  recordingsThisWeek: number;
  clipsGenerated: number;
  scheduledMeetings: number;
  newContacts: number;
}

interface Props {
  stats?: Stats;
}

const defaultStats: Stats = {
  recordingsThisWeek: 2,
  clipsGenerated: 7,
  scheduledMeetings: 1,
  newContacts: 3,
};

export function PerformanceOverviewWidget({ stats = defaultStats }: Props) {
  const metrics = [
    { label: "Recordings this week", value: stats.recordingsThisWeek, icon: Video },
    { label: "Clips generated", value: stats.clipsGenerated, icon: Scissors },
    { label: "Scheduled meetings", value: stats.scheduledMeetings, icon: Calendar },
    { label: "New contacts added", value: stats.newContacts, icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <metric.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">{metric.value}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{metric.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
