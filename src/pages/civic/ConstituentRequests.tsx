import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, MessageSquare, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ConstituentRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [filter, setFilter] = useState<string>("new");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["constituent-requests", filter],
    queryFn: async () => {
      let query = supabase
        .from("constituent_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const generateAISuggestionMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const request = requests?.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Call AI function to generate response
      const { data, error } = await supabase.functions.invoke("generate-constituent-response", {
        body: { requestId, topic: request.topic, message: request.message },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResponse(data.suggestedResponse);
      toast.success("AI suggestion generated");
    },
    onError: () => {
      toast.error("Failed to generate AI suggestion");
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, staffResponse }: { id: string; status: string; staffResponse?: string }) => {
      const { error } = await supabase
        .from("constituent_requests")
        .update({
          status,
          staff_response: staffResponse,
          responded_at: staffResponse ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constituent-requests"] });
      toast.success("Request updated");
      setSelectedRequest(null);
      setResponse("");
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_review":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "responded":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Constituent Requests</h1>
        <p className="text-muted-foreground">Manage and respond to public inquiries</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "new" ? "default" : "outline"}
          onClick={() => setFilter("new")}
        >
          New
        </Button>
        <Button
          variant={filter === "in_review" ? "default" : "outline"}
          onClick={() => setFilter("in_review")}
        >
          In Review
        </Button>
        <Button
          variant={filter === "responded" ? "default" : "outline"}
          onClick={() => setFilter("responded")}
        >
          Responded
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {request.email}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{request.topic}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{request.message}</p>
                {request.address && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {request.address}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(request.created_at), "PPP")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              {filter === "new"
                ? "No new requests at this time"
                : `No ${filter.replace("_", " ")} requests`}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request from {selectedRequest?.name}</DialogTitle>
            <DialogDescription>{selectedRequest?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Topic</h4>
              <p className="text-sm">{selectedRequest?.topic}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Message</h4>
              <p className="text-sm">{selectedRequest?.message}</p>
            </div>
            {selectedRequest?.address && (
              <div>
                <h4 className="font-semibold mb-1">Address</h4>
                <p className="text-sm">{selectedRequest?.address}</p>
              </div>
            )}
            {selectedRequest?.ai_suggested_response && (
              <div>
                <h4 className="font-semibold mb-1">AI Suggested Response</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.ai_suggested_response}</p>
              </div>
            )}
            {selectedRequest?.status !== "responded" && selectedRequest?.status !== "closed" && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Your Response</h4>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateAISuggestionMutation.mutate(selectedRequest.id)}
                    variant="outline"
                    disabled={generateAISuggestionMutation.isPending}
                  >
                    Generate AI Suggestion
                  </Button>
                  <Button
                    onClick={() =>
                      updateRequestMutation.mutate({
                        id: selectedRequest.id,
                        status: "responded",
                        staffResponse: response,
                      })
                    }
                    disabled={!response || updateRequestMutation.isPending}
                  >
                    Send Response
                  </Button>
                  <Button
                    onClick={() =>
                      updateRequestMutation.mutate({
                        id: selectedRequest.id,
                        status: "in_review",
                      })
                    }
                    variant="outline"
                  >
                    Mark In Review
                  </Button>
                </div>
              </>
            )}
            {selectedRequest?.staff_response && (
              <div>
                <h4 className="font-semibold mb-1">Staff Response</h4>
                <p className="text-sm">{selectedRequest.staff_response}</p>
                {selectedRequest.responded_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Responded on {format(new Date(selectedRequest.responded_at), "PPP")}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
