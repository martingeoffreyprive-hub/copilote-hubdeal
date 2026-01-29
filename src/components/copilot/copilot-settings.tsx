"use client";

import { useState } from "react";
import { useCopilotContext } from "@/contexts/copilot-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Check } from "lucide-react";
import { VOICE_OPTIONS, MODEL_OPTIONS, LANGUAGES } from "@/lib/constants";

export function CopilotSettings() {
  const { settings, updateSettings } = useCopilotContext();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleKeySave = (value: string) => {
    updateSettings({ apiKey: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label className="text-xs text-muted-foreground">Clé API OpenAI</Label>
        <div className="flex gap-1.5 mt-1">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) => handleKeySave(e.target.value)}
              placeholder="sk-..."
              className="h-8 border-white/10 bg-transparent text-sm pr-8 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {saved && <Check className="h-4 w-4 text-emerald-500 self-center shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Stockée localement dans votre navigateur uniquement.</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Voix</Label>
        <Select value={settings.voice} onValueChange={(v) => updateSettings({ voice: v })}>
          <SelectTrigger className="mt-1 h-8 border-white/10 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map((v) => (
              <SelectItem key={v.id} value={v.value}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Modèle</Label>
        <Select value={settings.model} onValueChange={(v) => updateSettings({ model: v })}>
          <SelectTrigger className="mt-1 h-8 border-white/10 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((m) => (
              <SelectItem key={m.id} value={m.value}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Langue</Label>
        <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v as "fr" | "nl" | "en" | "de" })}>
          <SelectTrigger className="mt-1 h-8 border-white/10 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={settings.autoSpeak} onCheckedChange={(v) => updateSettings({ autoSpeak: v })} />
        <Label className="text-xs">Réponse vocale auto</Label>
      </div>
    </div>
  );
}
