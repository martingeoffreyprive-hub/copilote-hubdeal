"use client";

import { useVoiceVisualizer } from "@/hooks/use-voice-visualizer";
import { cn } from "@/lib/utils";

const modeColors = {
  idle: "bg-white/20",
  listening: "bg-blue-500",
  speaking: "bg-emerald-500",
};

export function VoiceVisualizer({ className }: { className?: string }) {
  const { levels, mode } = useVoiceVisualizer();

  return (
    <div className={cn("flex items-center justify-center gap-[2px] h-12", className)}>
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn("w-1 rounded-full transition-all duration-75", modeColors[mode])}
          style={{ height: `${Math.max(4, level * 48)}px` }}
        />
      ))}
    </div>
  );
}
