import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface MeetingFocusModeContextType {
  isFocusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  showNavToggle: boolean;
  toggleNav: () => void;
  navCollapsed: boolean;
}

const MeetingFocusModeContext = createContext<MeetingFocusModeContextType | null>(null);

export function MeetingFocusModeProvider({ children }: { children: React.ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [previousNavState, setPreviousNavState] = useState<boolean | null>(null);

  // When focus mode activates, collapse nav and save previous state
  useEffect(() => {
    if (isFocusMode) {
      // Save current state before collapsing
      const sidebarCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sidebar:state="));
      const wasOpen = sidebarCookie ? sidebarCookie.split("=")[1] === "true" : true;
      setPreviousNavState(wasOpen);
      setNavCollapsed(true);
      
      // Collapse sidebar via cookie
      document.cookie = `sidebar:state=false; path=/; max-age=${60 * 60 * 24 * 7}`;
      
      // Dispatch event to notify sidebar
      window.dispatchEvent(new CustomEvent("meeting-focus-mode", { detail: { collapsed: true } }));
    } else {
      // Restore previous state
      if (previousNavState !== null) {
        document.cookie = `sidebar:state=${previousNavState}; path=/; max-age=${60 * 60 * 24 * 7}`;
        window.dispatchEvent(new CustomEvent("meeting-focus-mode", { detail: { collapsed: false, restore: previousNavState } }));
      }
      setNavCollapsed(false);
      setPreviousNavState(null);
    }
  }, [isFocusMode]);

  const setFocusMode = useCallback((enabled: boolean) => {
    setIsFocusMode(enabled);
  }, []);

  const toggleNav = useCallback(() => {
    setNavCollapsed((prev) => {
      const newState = !prev;
      document.cookie = `sidebar:state=${!newState}; path=/; max-age=${60 * 60 * 24 * 7}`;
      window.dispatchEvent(new CustomEvent("meeting-focus-mode", { detail: { collapsed: newState } }));
      return newState;
    });
  }, []);

  return (
    <MeetingFocusModeContext.Provider
      value={{
        isFocusMode,
        setFocusMode,
        showNavToggle: isFocusMode,
        toggleNav,
        navCollapsed,
      }}
    >
      {children}
    </MeetingFocusModeContext.Provider>
  );
}

export function useMeetingFocusMode() {
  const context = useContext(MeetingFocusModeContext);
  if (!context) {
    // Return a no-op version for components outside the provider
    return {
      isFocusMode: false,
      setFocusMode: () => {},
      showNavToggle: false,
      toggleNav: () => {},
      navCollapsed: false,
    };
  }
  return context;
}
