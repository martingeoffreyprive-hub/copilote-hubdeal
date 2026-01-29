"use client";

import { useRef, useState, useCallback } from "react";

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const start = useCallback(async (onData?: (blob: Blob) => void) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        onData?.(e.data);
      }
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start(250);
    setIsRecording(true);
  }, []);

  const stop = useCallback((): Blob => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    return new Blob(chunksRef.current, { type: "audio/webm" });
  }, []);

  return { isRecording, start, stop };
}
