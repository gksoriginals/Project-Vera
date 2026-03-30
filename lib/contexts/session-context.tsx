"use client";

import { createContext, ReactNode, useContext, useState } from "react";

export type SessionConfig = {
  groqApiKey?: string;
};

type SessionContextType = {
  config: SessionConfig;
  setConfig: (config: SessionConfig) => void;
  clearConfig: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SessionConfig>({});

  const clearConfig = () => setConfig({});

  return (
    <SessionContext.Provider value={{ config, setConfig, clearConfig }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
