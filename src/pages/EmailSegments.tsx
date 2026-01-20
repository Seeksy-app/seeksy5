import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Users } from "lucide-react";
import { SegmentList } from "@/components/email/segments/SegmentList";
import { SegmentBuilder } from "@/components/email/segments/SegmentBuilder";
import { CreateSegmentDialog } from "@/components/email/segments/CreateSegmentDialog";

export default function EmailSegments() {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: segments, refetch } = useQuery({
    queryKey: ["segments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("segments")
        .select("*, segment_filters(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const selectedSegment = segments?.find(s => s.id === selectedSegmentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="h-[72px] border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Segments</h1>
              <p className="text-sm text-muted-foreground">Smart audience targeting</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Segment
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-8">
          {/* Left: Segment List */}
          <div>
            <SegmentList
              segments={segments || []}
              selectedId={selectedSegmentId}
              onSelect={setSelectedSegmentId}
            />
          </div>

          {/* Right: Segment Builder */}
          <div>
            {selectedSegment ? (
              <SegmentBuilder
                segment={selectedSegment}
                onUpdate={refetch}
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center border shadow-sm">
                <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No segment selected</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a new segment or select one from the list
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Segment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateSegmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
