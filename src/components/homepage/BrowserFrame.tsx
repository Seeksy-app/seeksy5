import { cn } from "@/lib/utils";
import { LucideIcon, Mic, Play, Pause, Calendar, BarChart3, FileText, Shield, CheckCircle2, User, TrendingUp, Clock, Star } from "lucide-react";

interface BrowserFrameProps {
  title: string;
  url: string;
  icon: LucideIcon;
  gradient: string;
  type?: "studio" | "booking" | "analytics" | "mediakit" | "identity";
  children?: React.ReactNode;
}

// Studio mock content - waveform + mic
function StudioMock() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Top toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Recording Session</div>
            <div className="text-white/40 text-xs">Episode 42 • Interview</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
            <span className="text-red-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              REC 12:34
            </span>
          </div>
        </div>
      </div>

      {/* Waveform visualization */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full flex items-center justify-center gap-[3px]">
          {[...Array(40)].map((_, i) => {
            const height = Math.sin(i * 0.3) * 30 + Math.random() * 20 + 20;
            return (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 to-orange-400"
                style={{ height: `${height}px`, opacity: 0.6 + Math.random() * 0.4 }}
              />
            );
          })}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <Pause className="h-4 w-4 text-white" />
        </button>
        <button className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Play className="h-6 w-6 text-white ml-1" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <Mic className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// Booking mock content - calendar
function BookingMock() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM"];
  
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">December 2024</div>
            <div className="text-white/40 text-xs">5 available slots</div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-5 gap-1">
        {/* Day headers */}
        {days.map((day) => (
          <div key={day} className="text-center text-white/40 text-xs py-2 font-medium">
            {day}
          </div>
        ))}
        
        {/* Time slots */}
        {hours.map((hour, hi) => (
          days.map((day, di) => {
            const isBooked = (hi + di) % 3 === 0;
            const isAvailable = (hi + di) % 4 === 1;
            return (
              <div
                key={`${day}-${hour}`}
                className={cn(
                  "rounded-lg p-2 text-[10px] text-center transition-all",
                  isBooked ? "bg-blue-500/30 border border-blue-500/40 text-blue-300" :
                  isAvailable ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" :
                  "bg-white/5 text-white/30"
                )}
              >
                {hour}
              </div>
            );
          })
        ))}
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-white/50 text-xs">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-white/50 text-xs">Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics mock content - charts
function AnalyticsMock() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Analytics Dashboard</div>
            <div className="text-white/40 text-xs">Last 30 days</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Followers", value: "24.5K", change: "+12%" },
          { label: "Engagement", value: "4.8%", change: "+0.6%" },
          { label: "Reach", value: "142K", change: "+23%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-3">
            <div className="text-white/50 text-xs mb-1">{stat.label}</div>
            <div className="text-white font-bold text-lg">{stat.value}</div>
            <div className="text-emerald-400 text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-2 pb-4">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-violet-500/60 to-purple-400/80"
              style={{ height: `${height}%` }}
            />
            <span className="text-[8px] text-white/30">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Media Kit mock content - profile card + PDF
function MediaKitMock() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Media Kit</div>
            <div className="text-white/40 text-xs">Auto-generated</div>
          </div>
        </div>
      </div>

      {/* Profile card preview */}
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold">@creatorname</div>
            <div className="text-amber-300/70 text-xs">Content Creator</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Followers", value: "125K" },
            { label: "Avg. Likes", value: "8.2K" },
            { label: "Eng. Rate", value: "6.5%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-white font-bold text-sm">{stat.value}</div>
              <div className="text-white/40 text-[10px]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs">Estimated Value</span>
          <Star className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-white">$850 - $1,200</div>
        <div className="text-white/40 text-xs">Per sponsored post</div>
      </div>

      {/* PDF Export button */}
      <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl text-slate-900 font-semibold text-sm">
        <FileText className="h-4 w-4" />
        Export PDF
      </div>
    </div>
  );
}

// Identity mock content - verification badge
function IdentityMock() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Identity Hub</div>
            <div className="text-white/40 text-xs">Verification status</div>
          </div>
        </div>
      </div>

      {/* Verification status cards */}
      <div className="space-y-3 flex-1">
        {[
          { label: "Voice Fingerprint", status: "Verified", icon: Mic },
          { label: "Face Verification", status: "Verified", icon: User },
          { label: "On-Chain Certificate", status: "Minted", icon: CheckCircle2 },
        ].map((item) => (
          <div key={item.label} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">{item.label}</div>
                <div className="text-emerald-400 text-xs">{item.status}</div>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        ))}
      </div>

      {/* Badge preview */}
      <div className="mt-4 flex items-center justify-center gap-3 py-4 bg-white/5 rounded-xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">Verified Creator</div>
          <div className="text-emerald-400 text-xs">Blockchain certified</div>
        </div>
      </div>
    </div>
  );
}

export function BrowserFrame({ title, url, icon: Icon, gradient, type, children }: BrowserFrameProps) {
  // Render contextual content based on type
  const renderContent = () => {
    if (children) return children;
    
    switch (type) {
      case "studio":
        return <StudioMock />;
      case "booking":
        return <BookingMock />;
      case "analytics":
        return <AnalyticsMock />;
      case "mediakit":
        return <MediaKitMock />;
      case "identity":
        return <IdentityMock />;
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className={cn("p-5 rounded-2xl bg-gradient-to-br shadow-xl mb-4", gradient)}>
              <Icon className="h-10 w-10 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-1">{title}</h4>
            <p className="text-white/50 text-sm">Interactive Dashboard</p>
            
            <div className="flex items-end gap-2 mt-6">
              {[60, 80, 45, 90, 70, 85, 55].map((height, i) => (
                <div
                  key={i}
                  className={cn("w-6 rounded-t bg-gradient-to-t opacity-60", gradient)}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className={cn(
        "absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-20 blur-xl transition-opacity group-hover:opacity-40",
        gradient
      )} />
      
      {/* Frame */}
      <div className="relative bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-white/10">
        {/* Browser Chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          {/* URL Bar */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5">
              <div className="w-4 h-4 rounded bg-slate-600" />
              <span className="text-xs text-slate-400 font-mono">{url}</span>
            </div>
          </div>
          
          {/* Spacer for symmetry */}
          <div className="w-14" />
        </div>

        {/* Screen Content */}
        <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
