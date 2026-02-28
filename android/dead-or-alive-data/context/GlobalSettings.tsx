import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalSettingsContextType {
  gravityScale: number;
  setGravityScale: (value: number) => void;
  wireframeMode: boolean;
  setWireframeMode: (value: boolean) => void;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [gravityScale, setGravityScale] = useState(1);
  const [wireframeMode, setWireframeMode] = useState(false);

  return (
    <GlobalSettingsContext.Provider
      value={{
        gravityScale,
        setGravityScale,
        wireframeMode,
        setWireframeMode,
      }}
    >
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
}
