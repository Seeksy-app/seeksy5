import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Section {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

interface SectionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const DEFAULT_SECTIONS = [
  { name: "To Do", color: "#EF4444", display_order: 0 },
  { name: "In Progress", color: "#F59E0B", display_order: 1 },
  { name: "Completed", color: "#22C55E", display_order: 2 },
];

export function SectionSelect({ value, onValueChange }: SectionSelectProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionColor, setNewSectionColor] = useState("#3B82F6");
  const { toast } = useToast();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('task_sections')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) {
      console.error("Error loading sections:", error);
      return;
    }

    // If no sections exist, create defaults
    if (!data || data.length === 0) {
      await createDefaultSections(user.id);
      return;
    }

    setSections(data);
  };

  const createDefaultSections = async (userId: string) => {
    const sectionsToInsert = DEFAULT_SECTIONS.map(s => ({
      ...s,
      user_id: userId,
    }));

    const { error } = await supabase
      .from('task_sections')
      .insert(sectionsToInsert);

    if (error) {
      console.error("Error creating default sections:", error);
      return;
    }

    loadSections();
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('task_sections')
      .insert({
        user_id: user.id,
        name: newSectionName.trim(),
        color: newSectionColor,
        display_order: sections.length,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Section created",
    });

    setNewSectionName("");
    setNewSectionColor("#3B82F6");
    setAddDialogOpen(false);
    loadSections();
  };

  const selectedSection = sections.find(s => s.name === value);

  return (
    <div className="flex gap-2">
      <Select value={value || "none"} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select section">
            {selectedSection ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedSection.color }}
                />
                <span>{selectedSection.name}</span>
              </div>
            ) : value === "none" ? (
              <span className="text-muted-foreground">No Section</span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-sm border-border z-50">
          <SelectItem value="none">
            <span className="text-muted-foreground">No Section</span>
          </SelectItem>
          {sections.map((section) => (
            <SelectItem key={section.id} value={section.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: section.color }}
                />
                <span>{section.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Blocked, Review"
              />
            </div>
            <div>
              <Label htmlFor="section-color">Color</Label>
              <div className="flex gap-2 mt-2">
                {["#EF4444", "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewSectionColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newSectionColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAddSection} className="w-full">
              Add Section
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('task_sections')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (data) {
      setSections(data);
    }
  };

  const getSectionColor = (sectionName: string | null): string => {
    if (!sectionName) return '#6B7280';
    const section = sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
    return section?.color || '#6B7280';
  };

  return { sections, getSectionColor, reloadSections: loadSections };
}
