import { createContext, useContext, ReactNode } from "react";

interface TourModeContextType {
  isTourMode: boolean;
  exitTourMode: () => void;
}

const TourModeContext = createContext<TourModeContextType>({
  isTourMode: false,
  exitTourMode: () => {},
});

export function useTourMode() {
  return useContext(TourModeContext);
}

export function TourModeProvider({ children }: { children: ReactNode }) {
  // DISABLED: Tour mode is permanently disabled
  const exitTourMode = () => {};

  return (
    <TourModeContext.Provider value={{ isTourMode: false, exitTourMode }}>
      {children}
    </TourModeContext.Provider>
  );
}
