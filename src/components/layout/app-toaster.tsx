"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/hooks/use-theme";

/**
 * Thin wrapper around Sonner's Toaster that follows the app's own
 * light/dark mode instead of the OS preference, and styles toasts
 * with theme tokens so they stay legible (and neumorphic) in both
 * modes and across all 5 accent themes.
 */
export function AppToaster() {
  const { mode } = useTheme();
  return (
    <Toaster
      theme={mode}
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--card)",
          border: "1px solid var(--glass-edge)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-raised)",
          backdropFilter: "blur(var(--blur-glass))",
          WebkitBackdropFilter: "blur(var(--blur-glass))",
          color: "var(--foreground)",
        },
      }}
    />
  );
}
