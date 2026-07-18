"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { MODE_IDS, type ThemeMode } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Appearance panel — light/dark mode toggle.
 *
 * The app uses a fixed glass brand (violet + cyan) rather than a
 * user-selectable accent, so this panel only owns the light/dark
 * axis. Click a mode → applies + persists immediately. No save
 * button: the whole change is a CSS-variable swap on <html>, there's
 * nothing to roll back.
 *
 * Persistence: localStorage only (device-scoped). The boot script in
 * layout.tsx replays the choice before first paint on subsequent
 * loads.
 */
export function AppearancePanel() {
  const { mode, setMode } = useTheme();
  return (
    <section className="isolate space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Mode</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Light or dark glass surfaces. Saved to this device.
        </p>
      </div>
      <div className="inline-flex gap-1 rounded-2xl   bg-background p-1 shadow-inset backdrop-blur-[var(--blur-glass)]">
        {MODE_IDS.map((m) => (
          <ModeButton
            key={m}
            mode={m}
            isActive={m === mode}
            onPick={() => setMode(m)}
          />
        ))}
      </div>
    </section>
  );
}

function ModeButton({
  mode,
  isActive,
  onPick,
}: {
  mode: ThemeMode;
  isActive: boolean;
  onPick: () => void;
}) {
  const Icon = mode === "light" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isActive}
      aria-label={`Use ${mode} mode`}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all",
        isActive
          ? "bg-card text-primary shadow-raised-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {mode}
    </button>
  );
}
