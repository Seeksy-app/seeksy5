import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PODCAST_CATEGORIES } from "@/lib/podcastCategories";
import { Badge } from "@/components/ui/badge";

interface CreateCategoryDialogProps {
  programId: string;
  programTitle?: string;
  programDescription?: string;
  onSuccess: () => void;
}

export function CreateCategoryDialog({ programId, programTitle, programDescription, onSuccess }: CreateCategoryDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleCreateAwards = async () => {
    if (selectedCategories.length === 0) {
      toast({ title: "Please select at least one category", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const categoriesToAdd = selectedCategories.map(category => ({
        program_id: programId,
        name: `Best ${category}`,
        description: `Recognizing excellence in ${category.toLowerCase()} podcasting`,
        allow_media_submission: true,
        media_type: "audio",
      }));

      const result = await (supabase as any).from("award_categories").insert(categoriesToAdd);
      if (result.error) throw result.error;

      toast({ title: `Created ${categoriesToAdd.length} award categories successfully` });
      onSuccess();
      setOpen(false);
      setSelectedCategories([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-gold hover:bg-brand-darkGold">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Award Categories</DialogTitle>
          <DialogDescription>
            Select podcast categories to create "Best Of" awards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">
              Select Podcast Categories
            </Label>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {PODCAST_CATEGORIES.map((category) => (
                  <div
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedCategories.includes(category)
                        ? "bg-brand-gold/10 border-brand-gold"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      {selectedCategories.includes(category) && (
                        <Check className="h-4 w-4 text-brand-gold" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {selectedCategories.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-3 block">
                Awards to Create ({selectedCategories.length})
              </Label>
              <ScrollArea className="max-h-[150px]">
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="bg-brand-gold/10 text-foreground hover:bg-brand-gold/20"
                    >
                      Best {category}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Button
            onClick={handleCreateAwards}
            disabled={isLoading || selectedCategories.length === 0}
            className="w-full bg-brand-gold hover:bg-brand-darkGold"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Create {selectedCategories.length} Award{selectedCategories.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
