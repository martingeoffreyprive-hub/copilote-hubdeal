export interface VoiceOption {
  id: string;
  name: string;
  value: string;
}

export interface ModelOption {
  id: string;
  name: string;
  value: string;
}

export type Language = "fr" | "nl" | "en" | "de";

export interface CopilotSettings {
  apiKey: string;
  voice: string;
  model: string;
  language: Language;
  autoSpeak: boolean;
}

export type VisualizerMode = "idle" | "listening" | "speaking";

export interface VisualizerState {
  mode: VisualizerMode;
  levels: number[];
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isVoice?: boolean;
}
