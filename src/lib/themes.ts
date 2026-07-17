/**
 * Light/dark mode — the only user-facing theme axis. The app uses a
 * fixed two-color brand (violet primary + cyan secondary, see
 * `src/app/globals.css`); there is no accent picker. Applied as
 * `data-mode` on `<html>`, same boot-script / localStorage pattern
 * as before so there's no flash of the wrong mode on load.
 */
export const MODE_IDS = ["light", "dark"] as const;

export type ThemeMode = (typeof MODE_IDS)[number];

export const DEFAULT_MODE: ThemeMode = "light";

export const MODE_STORAGE_KEY = "wacrm.mode";

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === "string" &&
    (MODE_IDS as ReadonlyArray<string>).includes(value)
  );
}
