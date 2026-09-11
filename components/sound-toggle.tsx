"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";

export function SoundToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    setMounted(true);
  }, []);

  const onChange = (v: boolean) => {
    setEnabled(v);
    setSoundEnabled(v);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "inline-flex w-full select-none items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-text-primary transition-colors duration-150 hover:bg-muted",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        <span>{!mounted ? "Suara" : enabled ? "Suara" : "Suara Mati"}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-150",
          enabled ? "bg-primary-500" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150",
            enabled ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}