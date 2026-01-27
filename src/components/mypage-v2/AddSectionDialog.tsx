import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SECTION_TYPE_INFO, SectionType } from "@/lib/mypage/sectionTypes";

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function AddSectionDialog({ open, onClose, userId }: AddSectionDialogProps) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<SectionType | null>(null);

  const addMutation = useMutation({
    mutationFn: async (sectionType: SectionType) => {
      const { data, error } = await (supabase as any)
        .from("my_page_sections")
        .insert({
          user_id: userId,
          section_type: sectionType,
          display_order: 999,
          is_enabled: true,
          config: {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
      toast.success("Section added");
      onClose();
      setSelectedType(null);
    },
    onError: () => {
      toast.error("Failed to add section");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Choose a section type to add to your page
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {(Object.keys(SECTION_TYPE_INFO) as SectionType[]).map((type) => {
            const info = SECTION_TYPE_INFO[type];
            return (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                className="h-auto py-6 flex flex-col items-start gap-2"
                onClick={() => {
                  setSelectedType(type);
                  addMutation.mutate(type);
                }}
                disabled={addMutation.isPending}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-2xl">{info.icon}</span>
                  <span className="font-semibold">{info.label}</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  {info.description}
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
