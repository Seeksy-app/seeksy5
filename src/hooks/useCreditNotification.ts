import { useState, useEffect } from "react";

const STORAGE_KEY_PREFIX = "credit_notification_seen_";

export type CreditAction = 
  | "create_meeting"
  | "start_studio"
  | "upload_video"
  | "ai_video_editing"
  | "generate_clips"
  | "voice_cloning"
  | "upload_audio"
  | "ai_intro_outro"
  | "ai_blog"
  | "ai_email"
  | "ai_meeting_summary"
  | "invite_team_member"
  | "send_sms"
  | "ai_broll"
  | "ai_thumbnail";

interface CreditNotificationState {
  shouldShow: (action: CreditAction) => boolean;
  markAsSeen: (action: CreditAction) => void;
  markAllAsSeen: () => void;
  resetAll: () => void;
}

export function useCreditNotification(): CreditNotificationState {
  const [seenActions, setSeenActions] = useState<Set<CreditAction>>(() => {
    const seen = new Set<CreditAction>();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const action = key.replace(STORAGE_KEY_PREFIX, "") as CreditAction;
        if (localStorage.getItem(key) === "true") {
          seen.add(action);
        }
      }
    });
    return seen;
  });

  const shouldShow = (action: CreditAction): boolean => {
    return !seenActions.has(action);
  };

  const markAsSeen = (action: CreditAction) => {
    localStorage.setItem(STORAGE_KEY_PREFIX + action, "true");
    setSeenActions((prev) => new Set([...prev, action]));
  };

  const markAllAsSeen = () => {
    const allActions: CreditAction[] = [
      "create_meeting",
      "start_studio",
      "upload_video",
      "ai_video_editing",
      "generate_clips",
      "voice_cloning",
      "upload_audio",
      "ai_intro_outro",
      "ai_blog",
      "ai_email",
      "ai_meeting_summary",
      "invite_team_member",
      "send_sms",
      "ai_broll",
      "ai_thumbnail"
    ];
    
    allActions.forEach((action) => {
      localStorage.setItem(STORAGE_KEY_PREFIX + action, "true");
    });
    
    setSeenActions(new Set(allActions));
  };

  const resetAll = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_KEY_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
    
    setSeenActions(new Set());
  };

  return {
    shouldShow,
    markAsSeen,
    markAllAsSeen,
    resetAll,
  };
}
