import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SegmentCountDisplay } from "./SegmentCountDisplay";
import { AskAIButton } from "@/components/ai/AskAIButton";

interface SegmentBuilderProps {
  segment: any;
  onUpdate: () => void;
}

const FILTER_TYPES = [
  { value: "tag", label: "Tag" },
  { value: "event_attended", label: "Event Attended" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "podcast_subscribed", label: "Podcast Subscribed" },
  { value: "identity_status", label: "Identity Status" },
  { value: "activity", label: "Recent Activity" },
];

const OPERATORS = {
  tag: [{ value: "equals", label: "Equals" }, { value: "contains", label: "Contains" }],
  event_attended: [{ value: "equals", label: "Is" }],
  meeting_booked: [{ value: "in_last_days", label: "In Last X Days" }],
  podcast_subscribed: [{ value: "equals", label: "Is" }],
  identity_status: [{ value: "is_true", label: "Is Verified" }, { value: "is_false", label: "Not Verified" }],
  activity: [{ value: "in_last_days", label: "In Last X Days" }],
};

export function SegmentBuilder({ segment, onUpdate }: SegmentBuilderProps) {
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description || "");
  const [filterLogic, setFilterLogic] = useState(segment.filter_logic || "AND");
  const [filters, setFilters] = useState(segment.segment_filters || []);

  const updateSegment = useMutation({
    mutationFn: async () => {
      const { error: segmentError } = await (supabase as any)
        .from("segments")
        .update({ name, description, filter_logic: filterLogic })
        .eq("id", segment.id);

      if (segmentError) throw segmentError;

      // Delete existing filters
      await (supabase as any)
        .from("segment_filters")
        .delete()
        .eq("segment_id", segment.id);

      // Insert new filters
      if (filters.length > 0) {
        const { error: filtersError } = await (supabase as any)
          .from("segment_filters")
          .insert(
            filters.map((f: any) => ({
              segment_id: segment.id,
              filter_type: f.filter_type,
              operator: f.operator,
              field_value: f.field_value,
            }))
          );

        if (filtersError) throw filtersError;
      }
    },
    onSuccess: () => {
      toast.success("Segment updated");
      onUpdate();
    },
    onError: () => {
      toast.error("Failed to update segment");
    },
  });

  const addFilter = () => {
    setFilters([...filters, { filter_type: "tag", operator: "equals", field_value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_: any, i: number) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-6 space-y-6">
      {/* Segment Count Display */}
      <SegmentCountDisplay segmentId={segment.id} />

      <div>
        <h3 className="text-lg font-semibold mb-4">Segment Details</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Segment name"
            />
          </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium block">Description</label>
                <AskAIButton
                  persona="Atlas"
                  onClick={() => {
                    toast.info("Atlas can suggest smart filters based on your audience data");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Suggest Filters
                </AskAIButton>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this segment"
                rows={2}
              />
            </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Filters</h4>
          <div className="flex items-center gap-2">
            <AskAIButton
              persona="Atlas"
              onClick={() => {
                // Open Atlas dialog with segment context
                toast.info("Atlas can suggest smart filters based on your audience data");
              }}
              variant="ghost"
            >
              Suggest Filters
            </AskAIButton>
            <Select value={filterLogic} onValueChange={setFilterLogic}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filters.map((filter: any, index: number) => (
            <div key={index} className="flex gap-2 items-start">
              <Select
                value={filter.filter_type}
                onValueChange={(value) => updateFilter(index, "filter_type", value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(value) => updateFilter(index, "operator", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(OPERATORS[filter.filter_type as keyof typeof OPERATORS] || []).map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={filter.field_value}
                onChange={(e) => updateFilter(index, "field_value", e.target.value)}
                placeholder="Value"
                className="flex-1"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFilter(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addFilter}
          className="w-full mt-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          onClick={() => updateSegment.mutate()}
          disabled={updateSegment.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Segment
        </Button>
      </div>
    </div>
  );
}
