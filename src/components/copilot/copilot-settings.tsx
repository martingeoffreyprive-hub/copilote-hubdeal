"use client";

import { useCopilotContext } from "@/contexts/copilot-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VOICE_OPTIONS, MODEL_OPTIONS, LANGUAGES } from "@/lib/constants";

export function CopilotSettings() {
  const { settings, updateSettings } = useCopilotContext();

  return (
    <div className="space-y-4 p-4">
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
