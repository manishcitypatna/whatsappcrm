# WhatsApp Setting & Theme Hydration Audit

## 1. Root Cause: Hydration Mismatch
**Issue**: The `<html>` tag flashes or produces console warnings because the server-rendered `data-theme` attribute differs from what is applied by the inline boot script before React hydrates.

**Technical Details**:
- In [layout.tsx](file:///Users/manish/Documents/wcrm/src/app/layout.tsx), the `<html>` tag is hardcoded with `data-theme={DEFAULT_THEME}` (Violet).
- The `THEME_BOOT_SCRIPT` runs immediately upon script execution, potentially changing the attribute to a user-saved value (e.g., Slate) from `localStorage`.
- During hydration, React expects the attribute to be `violet`, finds `slate`, and flags a mismatch.
- In [use-theme.tsx](file:///Users/manish/Documents/wcrm/src/hooks/use-theme.tsx), `readInitialTheme` reads the modified attribute from the DOM during the first client-side render, which also differs from the server-side default.

## 2. Root Cause: Settings Form Reset
**Issue**: The WhatsApp Configuration form wipes unsaved user input and reverts to the database state unexpectedly.

**Technical Details**:
- In [whatsapp-config.tsx](file:///Users/manish/Documents/wcrm/src/components/settings/whatsapp-config.tsx), the `fetchConfig` function resets all local state variables (`phoneNumberId`, `wabaId`, `accessToken`, etc.) to the values retrieved from Supabase.
- This function is called within a `useEffect` that has `accountId` and `authLoading` as dependencies.
- Any update to the auth context (e.g., session refresh) causes `accountId` or `profileLoading` to flicker or update, re-triggering the effect and calling `fetchConfig`.

## 3. Browser Tab Switching
**Issue**: Does switching tabs trigger a remount or re-fetch?

**Findings**:
- Switching tabs does **not** trigger a full component remount.
- However, Supabase's `onAuthStateChange` listener (in [use-auth.tsx](file:///Users/manish/Documents/wcrm/src/hooks/use-auth.tsx)) often triggers on window focus to validate the session.
- This update to the `AuthContext` triggers a re-render of all components using `useAuth()`.
- In `WhatsAppConfig`, the `useEffect` sees the context update and re-runs `fetchConfig`, which contains the form-resetting logic.

## 4. Files Requiring Changes
1. [layout.tsx](file:///Users/manish/Documents/wcrm/src/app/layout.tsx): To suppress hydration warnings on the `<html>` tag.
2. [use-theme.tsx](file:///Users/manish/Documents/wcrm/src/hooks/use-theme.tsx): To ensure a stable initial theme state during hydration.
3. [whatsapp-config.tsx](file:///Users/manish/Documents/wcrm/src/components/settings/whatsapp-config.tsx): To prevent overwriting unsaved form changes during re-fetches.

## 5. Exact Fix Plan
1. **Fix Hydration Warning**:
   - Add `suppressHydrationWarning` to the `<html>` tag in `layout.tsx`. This is the recommended approach for attributes modified by inline scripts (like theme switchers).
2. **Fix Theme State Sync**:
   - Modify `readInitialTheme` in `use-theme.tsx` to return a constant `DEFAULT_THEME` during the very first render, and then update to the actual DOM/localStorage value in a `useEffect`. This ensures the first client render matches the server render.
3. **Fix Form Persistence**:
   - Introduce a "dirty" check in `WhatsAppConfig`. If `phoneNumberId`, `wabaId`, or `accessToken` have been modified by the user, `fetchConfig` should skip updating those specific fields.
   - Alternatively, change the `useEffect` in `WhatsAppConfig` to only run if `config` is currently `null`, preventing background re-fetches from clobbering active edits.
