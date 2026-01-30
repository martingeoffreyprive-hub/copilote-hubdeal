import { Unit, TVARate } from "@/types/quote";
import { VoiceOption, ModelOption, Language } from "@/types/copilot";

export const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "m²", label: "m²" },
  { value: "m³", label: "m³" },
  { value: "ml", label: "ml" },
  { value: "pce", label: "Pièce" },
  { value: "h", label: "Heure" },
  { value: "forfait", label: "Forfait" },
  { value: "kg", label: "kg" },
  { value: "l", label: "Litre" },
  { value: "jour", label: "Jour" },
];

export const TVA_RATES: { value: TVARate; label: string }[] = [
  { value: 0, label: "0%" },
  { value: 6, label: "6%" },
  { value: 12, label: "12%" },
  { value: 21, label: "21%" },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: "alloy", name: "Alloy", value: "alloy" },
  { id: "echo", name: "Echo", value: "echo" },
  { id: "fable", name: "Fable", value: "fable" },
  { id: "onyx", name: "Onyx", value: "onyx" },
  { id: "nova", name: "Nova", value: "nova" },
  { id: "shimmer", name: "Shimmer", value: "shimmer" },
];

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-4o-realtime", name: "GPT-4o Realtime", value: "gpt-4o-realtime-preview" },
  { id: "gpt-4o-mini-realtime", name: "GPT-4o Mini Realtime", value: "gpt-4o-mini-realtime-preview" },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "nl", label: "Nederlands" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

export const DEFAULT_COPILOT_SETTINGS = {
  apiKey: "",
  voice: "alloy",
  model: "gpt-4o-realtime-preview",
  language: "fr" as Language,
  autoSpeak: false,
};

export const DEFAULT_IBAN = "BE68 5390 0754 7034";
export const DEFAULT_BIC = "TRIOBEBB";
