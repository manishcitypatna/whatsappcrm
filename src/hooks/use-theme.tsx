"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_MODE,
  MODE_STORAGE_KEY,
  isThemeMode,
  type ThemeMode,
} from "@/lib/themes";

/**
 * ThemeProvider — wraps the whole app, owns light/dark mode state.
 *
 * The boot script in `src/app/layout.tsx` has already applied
 * `document.documentElement.dataset.mode` before React hydrates, so
 * by the time this Provider mounts the page is already painted in
 * the right mode. We just have to read what's there and keep it in
 * sync going forward.
 *
 * Persistence is localStorage only (device-scoped). A future
 * follow-up could mirror to `profiles.preferences` for cross-device
 * sync, but a per-device choice is also defensible — your phone may
 * deserve a different mode than your laptop.
 */

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (next: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with the default to ensure the first client render
  // matches the server render, avoiding hydration mismatches. The
  // boot script in layout.tsx has already applied the visual mode.
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  // Read the actual mode on mount and update state.
  useEffect(() => {
    const modeFromAttr = document.documentElement.dataset.mode;
    if (isThemeMode(modeFromAttr)) {
      setModeState(modeFromAttr);
    } else {
      try {
        const saved = localStorage.getItem(MODE_STORAGE_KEY);
        if (isThemeMode(saved)) setModeState(saved);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.mode = next;
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Private-browsing edge case; in-memory state still updates so
      // the current tab works for the session.
    }
  }, []);

  // Sync from other tabs — if you change mode in tab A, tab B
  // catches up without a refresh.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== MODE_STORAGE_KEY) return;
      if (isThemeMode(e.newValue) && e.newValue !== mode) {
        setModeState(e.newValue);
        document.documentElement.dataset.mode = e.newValue;
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider — return a
    // no-op setter so callers don't crash. The boot script still
    // applied the right CSS attribute, so visually the page is fine.
    return {
      mode: DEFAULT_MODE,
      setMode: () => {},
    };
  }
  return ctx;
}
