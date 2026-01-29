"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CopilotMessage, CopilotSettings, VisualizerState } from "@/types/copilot";
import { DEFAULT_COPILOT_SETTINGS } from "@/lib/constants";
import { v4 as uuid } from "uuid";

const SETTINGS_STORAGE_KEY = "hubdeal-copilot-settings";

interface CopilotContextValue {
  messages: CopilotMessage[];
  settings: CopilotSettings;
  visualizerState: VisualizerState;
  isConnected: boolean;
  addMessage: (role: "user" | "assistant" | "system", content: string, isVoice?: boolean) => void;
  clearMessages: () => void;
  updateSettings: (s: Partial<CopilotSettings>) => void;
  setVisualizerState: (s: VisualizerState) => void;
  setConnected: (v: boolean) => void;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

function loadSettings(): CopilotSettings {
  if (typeof window === "undefined") return DEFAULT_COPILOT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) return { ...DEFAULT_COPILOT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_COPILOT_SETTINGS;
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [settings, setSettings] = useState<CopilotSettings>(DEFAULT_COPILOT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);
  const [visualizerState, setVisualizerState] = useState<VisualizerState>({ mode: "idle", levels: new Array(40).fill(0.1) });
  const [isConnected, setConnected] = useState(false);

  const addMessage = useCallback((role: "user" | "assistant" | "system", content: string, isVoice = false) => {
    setMessages((prev) => [...prev, { id: uuid(), role, content, timestamp: new Date().toISOString(), isVoice }]);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const updateSettings = useCallback((s: Partial<CopilotSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <CopilotContext.Provider value={{ messages, settings, visualizerState, isConnected, addMessage, clearMessages, updateSettings, setVisualizerState, setConnected }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilotContext() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilotContext must be used within CopilotProvider");
  return ctx;
}
