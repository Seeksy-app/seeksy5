import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, MapPin, Users, Edit, Trash2, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Session {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  room?: string;
  virtual_url?: string;
  capacity?: number;
  session_type: string;
  track?: string;
  is_published: boolean;
  session_order: number;
  speakers?: Array<{ id: string; name: string; title?: string }>;
}

interface EventSessionManagerProps {
  eventId: string;
  eventDate: string;
  isAdmin?: boolean;
}

export function EventSessionManager({ eventId, eventDate, isAdmin = false }: EventSessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    room: "",
    virtual_url: "",
    capacity: "",
    session_type: "session",
    track: "",
  });

  useEffect(() => {
    loadSessions();
  }, [eventId]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("event_sessions")
        .select("*, event_session_speakers(event_speakers(*))")
        .eq("event_id", eventId)
        .order("start_time");

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSession(null);
    setFormData({
      title: "",
      description: "",
      start_time: eventDate ? eventDate.slice(0, 16) : "",
      end_time: "",
      location: "",
      room: "",
      virtual_url: "",
      capacity: "",
      session_type: "session",
      track: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (session: Session) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || "",
      start_time: session.start_time.slice(0, 16),
      end_time: session.end_time?.slice(0, 16) || "",
      location: session.location || "",
      room: session.room || "",
      virtual_url: session.virtual_url || "",
      capacity: session.capacity?.toString() || "",
      session_type: session.session_type,
      track: session.track || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.start_time) {
      toast({
        title: "Missing fields",
        description: "Title and start time are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const sessionData = {
        event_id: eventId,
        title: formData.title,
        description: formData.description || null,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        location: formData.location || null,
        room: formData.room || null,
        virtual_url: formData.virtual_url || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        session_type: formData.session_type,
        track: formData.track || null,
        is_published: true,
        session_order: editingSession ? editingSession.session_order : sessions.length,
      };

      if (editingSession) {
        const { error } = await supabase
          .from("event_sessions")
          .update(sessionData)
          .eq("id", editingSession.id);

        if (error) throw error;
        toast({ title: "Session updated" });
      } else {
        const { error } = await supabase
          .from("event_sessions")
          .insert(sessionData);

        if (error) throw error;
        toast({ title: "Session created" });
      }

      setDialogOpen(false);
      loadSessions();
    } catch (error: any) {
      toast({
        title: "Error saving session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase
        .from("event_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
      toast({ title: "Session deleted" });
      loadSessions();
    } catch (error: any) {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sessionTypeColors: Record<string, string> = {
    session: "bg-blue-500/10 text-blue-600",
    keynote: "bg-purple-500/10 text-purple-600",
    workshop: "bg-green-500/10 text-green-600",
    panel: "bg-orange-500/10 text-orange-600",
    networking: "bg-pink-500/10 text-pink-600",
    break: "bg-gray-500/10 text-gray-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Session
          </Button>
        </div>
      )}

      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin
                ? "Create your first session to build your event schedule."
                : "The schedule hasn't been published yet."}
            </p>
            {isAdmin && (
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-medium">
                        {format(new Date(session.start_time), "h:mm a")}
                      </p>
                      {session.end_time && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.end_time), "h:mm a")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{session.title}</h3>
                        <Badge className={sessionTypeColors[session.session_type] || sessionTypeColors.session}>
                          {session.session_type}
                        </Badge>
                        {session.track && (
                          <Badge variant="outline">{session.track}</Badge>
                        )}
                      </div>

                      {session.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {(session.room || session.location) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.room || session.location}
                          </span>
                        )}
                        {session.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.capacity} seats
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(session)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(session.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Edit Session" : "Add Session"}
            </DialogTitle>
            <DialogDescription>
              {editingSession
                ? "Update session details"
                : "Add a new session to your event schedule"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Session title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will this session cover?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select
                  value={formData.session_type}
                  onValueChange={(v) => setFormData({ ...formData, session_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Session</SelectItem>
                    <SelectItem value="keynote">Keynote</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="panel">Panel</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Track</Label>
                <Input
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  placeholder="e.g., Technical, Business"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room / Location</Label>
                <Input
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Room 101"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingSession ? "Save Changes" : "Add Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
