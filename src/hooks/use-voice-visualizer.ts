"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VisualizerMode } from "@/types/copilot";

const BAR_COUNT = 40;

export function useVoiceVisualizer() {
  const [levels, setLevels] = useState<number[]>(new Array(BAR_COUNT).fill(0.1));
  const [mode, setMode] = useState<VisualizerMode>("idle");
  const frameRef = useRef<number>(0);

  const animate = useCallback(() => {
    setLevels((prev) =>
      prev.map((_, i) => {
        if (mode === "idle") return 0.05 + Math.sin(Date.now() / 800 + i * 0.3) * 0.05;
        if (mode === "listening") return 0.1 + Math.random() * 0.6;
        return 0.2 + Math.sin(Date.now() / 200 + i * 0.5) * 0.4 + Math.random() * 0.2;
      })
    );
    frameRef.current = requestAnimationFrame(animate);
  }, [mode]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate]);

  return { levels, mode, setMode, barCount: BAR_COUNT };
}
