import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Link, Calendar, Clock, Video, Phone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialMeetingTypes = [
  { id: "demo", name: "Demo Call", duration: 30, slug: "demo", description: "Book a live demo of Seeksy with our team.", autoConfirm: true, assignedTo: "Sales Team", location: "video", active: true },
  { id: "sales", name: "Sales Discovery", duration: 45, slug: "sales", description: "Discuss your needs and explore solutions.", autoConfirm: true, assignedTo: "Sales Team", location: "video", active: true },
  { id: "support", name: "Support Session", duration: 30, slug: "support", description: "Get help with technical issues.", autoConfirm: false, assignedTo: "Support Team", location: "video", active: true },
  { id: "onboarding", name: "Onboarding", duration: 60, slug: "onboarding", description: "Complete guided onboarding session.", autoConfirm: true, assignedTo: "Success Team", location: "video", active: true },
  { id: "consultation", name: "Consultation", duration: 45, slug: "consultation", description: "Strategic consultation call.", autoConfirm: false, assignedTo: "Founder", location: "phone", active: true },
];

export default function AdminMeetingTypes() {
  const [meetingTypes, setMeetingTypes] = useState(initialMeetingTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<typeof initialMeetingTypes[0] | null>(null);
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Meeting type saved", description: "The meeting type has been updated." });
    setIsModalOpen(false);
    setEditingType(null);
  };

  const handleDelete = (id: string) => {
    setMeetingTypes(meetingTypes.filter(t => t.id !== id));
    toast({ title: "Meeting type deleted" });
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${slug}`);
    toast({ title: "Link copied!" });
  };

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meeting Types</h1>
          <p className="text-muted-foreground mt-1">Create and manage global meeting types for your team</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingType(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Meeting Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Meeting Type" : "Create Meeting Type"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g., Demo Call" defaultValue={editingType?.name} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Brief description of this meeting type" defaultValue={editingType?.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Select defaultValue={editingType?.duration?.toString() || "30"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input placeholder="demo" defaultValue={editingType?.slug} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select defaultValue={editingType?.location || "video"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select defaultValue={editingType?.assignedTo || "Sales Team"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales Team">Sales Team</SelectItem>
                      <SelectItem value="Support Team">Support Team</SelectItem>
                      <SelectItem value="Success Team">Success Team</SelectItem>
                      <SelectItem value="Founder">Founder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-confirm bookings</Label>
                <Switch defaultChecked={editingType?.autoConfirm ?? true} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSave}>Save Meeting Type</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {meetingTypes.map((type) => (
          <Card key={type.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {type.location === "video" ? <Video className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">/{type.slug}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${type.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {type.active ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{type.duration} min</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{type.assignedTo}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(type.slug)}>
                  <Link className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingType(type); setIsModalOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
