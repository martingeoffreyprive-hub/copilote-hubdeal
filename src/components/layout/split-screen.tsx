"use client";

import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { EditorPanel } from "@/components/editor/editor-panel";

export function SplitScreen() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-[380px] shrink-0 border-r border-white/10">
        <CopilotPanel />
      </div>
      <div className="flex-1 overflow-hidden">
        <EditorPanel />
      </div>
    </div>
  );
}
