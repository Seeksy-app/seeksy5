import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  comment_text: string;
  mentioned_user_ids: string[];
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface TeamMember {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface TaskCommentsProps {
  taskId: string;
  teamMembers: TeamMember[];
}

export function TaskComments({ taskId, teamMembers }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    const result = await (supabase as any)
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (result.error) {
      console.error("Error fetching comments:", result.error);
      return;
    }

    const data = result.data as any[];

    // Fetch user profiles for comments
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const profileResult = await (supabase as any)
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profiles = profileResult.data as any[] || [];
      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      
      const commentsWithUsers: Comment[] = data.map((comment: any) => ({
        id: comment.id,
        task_id: comment.task_id,
        user_id: comment.user_id,
        comment_text: comment.comment_text || '',
        mentioned_user_ids: comment.mentioned_user_ids || [],
        created_at: comment.created_at,
        user: profileMap.get(comment.user_id) || null,
      }));

      setComments(commentsWithUsers);
    } else {
      setComments([]);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(cursorPos);

    // Check if @ was typed
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: TeamMember) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    const beforeAt = newComment.substring(0, lastAtIndex);
    const mention = `@${member.full_name || member.username} `;
    const newText = beforeAt + mention + textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch("");
  };

  const extractMentionedUserIds = (text: string): string[] => {
    const mentionedIds: string[] = [];
    teamMembers.forEach((member) => {
      const name = member.full_name || member.username;
      if (name && text.includes(`@${name}`)) {
        mentionedIds.push(member.id);
      }
    });
    return mentionedIds;
  };

  const sendNotifications = async (mentionedIds: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const userId of mentionedIds) {
      await (supabase as any).from("notifications").insert({
        user_id: userId,
        title: "You were mentioned in a task",
        message: `${user.email} mentioned you in a task comment`,
        type: "info",
        read: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mentionedIds = extractMentionedUserIds(newComment);

    const insertResult = await (supabase as any).from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      comment_text: newComment.trim(),
      mentioned_user_ids: mentionedIds,
    });
    const error = insertResult.error;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
      return;
    }

    // Send notifications to mentioned users
    if (mentionedIds.length > 0) {
      await sendNotifications(mentionedIds);
    }

    setNewComment("");
    fetchComments();
    toast({
      title: "Success",
      description: "Comment added",
    });
  };

  const filteredMembers = teamMembers.filter((member) => {
    const name = (member.full_name || member.username || "").toLowerCase();
    return name.includes(mentionSearch.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notes yet. Add the first one!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.user?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.user?.full_name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 relative">
        <Textarea
          value={newComment}
          onChange={handleCommentChange}
          placeholder="Add a note... Use @ to mention team members"
          className="min-h-[80px] resize-none"
        />
        
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full mb-1 w-full bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => insertMention(member)}
                className="w-full flex items-center gap-2 p-2 hover:bg-accent text-left"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.full_name?.charAt(0) || member.username?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.full_name || member.username}</span>
              </button>
            ))}
          </div>
        )}

        <Button type="submit" size="sm" className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </form>
    </div>
  );
}
