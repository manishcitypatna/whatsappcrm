# Code Modification Log

## 2026-06-05

### Module: Automations
**Task**: Fix account-tenancy issues in Automations module.

**Files Changed**:
1.  `src/app/api/automations/route.ts`:
    *   Updated `GET` to filter by `account_id` using `getCurrentAccount()`.
    *   Updated `POST` to include `account_id` in `.insert()` payload and use `getCurrentAccount()`.
    *   Added proper error handling with `toErrorResponse`.
2.  `src/app/api/automations/[id]/route.ts`:
    *   Updated `GET`, `PATCH`, and `DELETE` to filter by `account_id` instead of `user_id`.
    *   Updated ownership check in `PATCH` to be account-scoped.
    *   Added proper error handling with `toErrorResponse`.
3.  `src/app/api/automations/[id]/duplicate/route.ts`:
    *   Updated ownership check to use `account_id`.
    *   Updated `POST` insert to include `account_id`.
    *   Added proper error handling with `toErrorResponse`.

**Validation**:
*   TypeScript validation: PASS

## 2026-06-05

### Module: WhatsApp Config
**Files Changed**:
- `src/app/api/whatsapp/config/route.ts`
- `src/app/api/whatsapp/config/verify-registration/route.ts`

**Root Cause**: Legacy inlined account resolution and inconsistent error handling. While the module was mostly tenancy-correct, it was not using the standardized `getCurrentAccount()` and `toErrorResponse()` helpers, which could lead to maintenance drift.

**Exact Fixes**:
1.  **`api/whatsapp/config/route.ts`**:
    - Replaced local `resolveAccountId` with `getCurrentAccount()`.
    - Updated `GET`, `POST`, and `DELETE` handlers to use the standardized helper for retrieving `supabase`, `userId`, and `accountId`.
    - Adopted `toErrorResponse()` for consistent error reporting.
    - Verified `INSERT` payload includes `account_id` and uses the current `userId`.
2.  **`api/whatsapp/config/verify-registration/route.ts`**:
    - Replaced manual profile lookup with `getCurrentAccount()`.
    - Adopted `toErrorResponse()` for consistent error reporting.
    - Wrapped handler in `try/catch` for better resilience.

**Validation Result**:
- TypeScript validation: PASS

**Remaining Risks**:
- **Meta API Failures**: Tenancy is correct, but external Meta API changes or rate limits remain a risk to connectivity.
- **Teammate Permissions**: All teammates currently have access to config via `getCurrentAccount()`. If more granular role gating (e.g., only 'admin' can change config) is desired, `requireRole('admin')` should be added to the `POST` and `DELETE` methods.

## 2026-06-05

### Module: Templates
**Task**: Fix account-tenancy issues in Templates module.

**Files Changed**:
1.  `src/app/api/whatsapp/templates/sync/route.ts`:
    *   Updated to use `getCurrentAccount()` for `accountId` and `userId`.
    *   Updated `insert()` payload to include `account_id` (required by Migration 017).
2.  `src/app/api/whatsapp/templates/submit/route.ts`:
    *   Updated to use `getCurrentAccount()`.
    *   Updated `upsert()` conflict target to `(account_id, name, language)` to support shared account collaboration.
    *   Included `account_id` in `upsert()` payload.
3.  `src/app/api/whatsapp/templates/[id]/route.ts`:
    *   Updated `PATCH` and `DELETE` to use `getCurrentAccount()`.
    *   Added explicit `account_id` filter to template lookups for teammate accessibility.
4.  `src/components/settings/template-manager.tsx`:
    *   Updated to retrieve `accountId` from `useAuth()`.
    *   Updated `fetchTemplates` to filter by `account_id` instead of `user_id`.
5.  `src/components/inbox/template-picker.tsx`:
    *   Updated to filter templates by `account_id`.
6.  `src/components/broadcasts/step1-choose-template.tsx`:
    *   Updated to filter templates by `account_id`.

**Root Cause**: Legacy code was using `user_id` filtering or missing `account_id` population, preventing teammates from seeing, syncing, or submitting templates for the shared account.

**Validation Result**:
*   TypeScript validation: PASS

**Remaining Risks**:
- **Manual QA**: Recommended to verify that teammates can view and manage templates synced/submitted by others.
- **Webhook Processing**: The `template-webhook.ts` logic needs to be verified for correct `account_id` attribution when Meta sends status updates (delivered via the shared WhatsApp webhook).

## 2026-06-05

### Module: Deals
**Task**: Fix account-tenancy issues in Deals module.

**Files Changed**:
1.  `src/components/pipelines/deal-form.tsx`:
    *   Added `accountId` from `useAuth`.
    *   Included `account_id` in `.insert()` payload.
    *   Added explicit `.eq('account_id', accountId)` to all queries.
2.  `src/app/(dashboard)/pipelines/page.tsx`:
    *   Added explicit `.eq('account_id', accountId)` to `loadPipelines`, `loadStages`, `loadDeals`, and `handleDealMoved`.
3.  `src/components/pipelines/pipeline-settings.tsx`:
    *   Added `accountId` from `useAuth`.
    *   Added explicit `.eq('account_id', accountId)` to `handleSave`, `handleRemoveStage`, and `handleDeletePipeline`.
4.  `src/lib/dashboard/queries.ts`:
    *   Updated dashboard query functions to accept `accountId` and filter by it.
5.  `src/app/(dashboard)/dashboard/page.tsx`:
    *   Passed `accountId` to all dashboard query functions.

**Root Cause**: Legacy code was missing `account_id` on deal creation and relying on implicit RLS for reads/updates, which could lead to teammate visibility issues or data corruption if RLS policies are misconfigured.

**Validation Result**:
*   TypeScript validation: PASS

**Remaining Risks**:
*   Manual QA required to verify teammate visibility on the pipeline board and dashboard widgets.
*   Ensure that existing deals (pre-teammate) are correctly associated with the account.

## 2026-06-05

### Module: Tags
**Task**: Fix account-tenancy issues in Tags module.

**Files Changed**:
1.  `src/components/settings/tag-manager.tsx`:
    *   Updated `fetchTags` to use `account_id` instead of `user_id`.
    *   Updated `handleCreate` to include `account_id` in `.insert()` payload.
2.  `src/app/api/tags/route.ts`:
    *   Created new API route for account-scoped tag fetching.
3.  `src/components/contacts/contact-form.tsx`:
    *   Added explicit `account_id` filter to `fetchTags`.
4.  `src/components/contacts/contact-detail-view.tsx`:
    *   Added `useAuth` hook.
    *   Added explicit `account_id` filter to `fetchTags`.
5.  `src/components/broadcasts/step2-select-audience.tsx`:
    *   Added `useAuth` hook.
    *   Added explicit `account_id` filter to `fetchTags`.
6.  `src/app/(dashboard)/contacts/page.tsx`:
    *   Added `useAuth` hook.
    *   Added explicit `account_id` filter to `fetchTags`.

**Root Cause**: Legacy code using `user_id` filtering or missing `account_id` population, which broke teammate visibility and creation.

**Validation Result**:
*   TypeScript validation: PASS

**Remaining Risks**:
*   Manual QA required to verify teammate visibility across all tag-related components.
*   The `contact_tags` join table relies on RLS (Migration 017) which uses `EXISTS` on `contacts`. This should be verified with real data.

## 2026-06-05

### Module: Flows
**Task**: Fix account-tenancy issues in Flows module.

**Files Changed**:
1.  `src/app/api/flows/route.ts`:
    *   Updated `GET` to filter by `account_id` using `getCurrentAccount()`.
    *   Updated `POST` to include `account_id` in `.insert()` payload and use `getCurrentAccount()`.
    *   Added proper error handling with `toErrorResponse`.
2.  `src/app/api/flows/[id]/route.ts`:
    *   Updated `requireOwnership` to use `account_id` check.
    *   Updated `GET`, `PUT`, and `DELETE` to filter by `account_id` instead of relying solely on RLS/user_id.
    *   Added proper error handling with `toErrorResponse`.
3.  `src/app/api/flows/[id]/activate/route.ts`:
    *   Updated to use `getCurrentAccount()` and filter by `account_id` for ownership and updates.

**Validation**:
*   TypeScript validation: PASS
*   Verified that `flows` table requires `account_id` (Migration 017).
*   Verified that `flow_nodes`, `flow_runs`, and `flow_run_events` inherit tenancy via parent flow/run associations.
*   Verified that `src/components/flows/forms/node-config-form.tsx` correctly handles account-scoped media uploads.

**Remaining Risks**:
*   `useUserTags` in the flow builder relies on `/api/tags` which is still using legacy `user_id` filters (Tags module remediation pending).
*   Manual QA required to ensure teammates can collaborate on the same flows.
*   Verified that `automations` table requires `account_id` (Migration 017).
*   Verified that `automation_steps` table does not require `account_id` (parent-joined RLS).

**Remaining Risks**:
*   Manual QA required to ensure teammates can indeed see and edit shared automations.
*   Ensure that existing automations (pre-teammate) are correctly associated with the account (handled by Migration 017 backfill, but worth verifying).

## 2026-06-05

### Module: Broadcasts
**Task**: Fix account-tenancy issues in Broadcasts module.

**Files Changed**:
1.  `src/app/api/whatsapp/broadcast/route.ts`:
    *   Updated to use `getCurrentAccount()` for standardized tenancy resolution.
    *   Adopted `toErrorResponse()` for consistent error reporting.
    *   Updated rate limiting to use `userId` from account context.
2.  `src/hooks/use-broadcast-sending.ts`:
    *   Added `accountId` from `useAuth()`.
    *   Updated `resolveAudience` and `resolveCustomFieldAudience` to filter by `account_id`.
    *   Updated `upsertCsvContacts` to filter by `account_id` and include `account_id` in `.insert()` payload.
    *   Updated `createAndSendBroadcast` to include `account_id` in `.insert()` for both `broadcasts` and `broadcast_recipients`.
3.  `src/app/(dashboard)/broadcasts/page.tsx`:
    *   Added `accountId` from `useAuth()`.
    *   Updated `fetchBroadcasts` to filter by `account_id`.
4.  `src/app/(dashboard)/broadcasts/new/page.tsx`:
    *   Added `accountId` from `useAuth()`.
    *   Updated `handleSaveDraft` to include `account_id` in `.insert()` payload.
5.  `src/app/(dashboard)/broadcasts/[id]/page.tsx`:
    *   Added `accountId` from `useAuth()`.
    *   Updated detail, recipient, and delete queries to include `account_id` filter.
6.  `src/components/broadcasts/step2-select-audience.tsx`:
    *   Updated `fetchFields` and `fetchEstimatedCount` to filter by `account_id`.
7.  `src/components/broadcasts/step3-personalize.tsx`:
    *   Updated `custom_fields` and `contacts` queries to filter by `account_id`.
8.  `src/components/broadcasts/step4-schedule-send.tsx`:
    *   Updated `calculateReach` to filter by `account_id`.

**Root Cause**: Legacy code was missing `account_id` on insert or using `user_id` filtering, causing runtime crashes (Migration 017) and preventing teammates from seeing shared data.

**Validation Result**:
*   TypeScript validation: PASS

**Remaining Risks**:
*   **Manual QA**: Required to verify that large broadcasts (multiple batches) correctly associate all recipients with the account.
*   **Webhook Delivery**: Ensure `whatsapp_message_id` mapping in webhooks correctly attributes status updates to the shared account.

## 2026-06-05

### Module: Custom Fields
**Task**: Fix account-tenancy issues in Custom Fields module.

**Files Changed**:
1.  `src/types/index.ts`:
    *   Added `account_id` to `CustomField` interface.
2.  `src/components/contacts/contact-detail-view.tsx`:
    *   Updated `fetchCustomFields` to filter by `account_id`.
    *   Added `accountId` check to `fetchCustomFields`.

**Root Cause**: Legacy code was missing `account_id` filter when fetching custom field definitions, leading to potential teammate blindness or cross-account data leakage (if RLS was bypassed).

**Validation Result**:
*   TypeScript validation: PASS

**Remaining Risks**:
*   **Management UI**: There is currently no UI implemented to create, update, or delete custom field definitions. This is a functional gap, though the existing value-saving logic is tenancy-correct.
*   **Bulk Import**: The contact import modal does not yet support mapping to custom fields.

## 2026-06-06

### Module: Settings & Theme (Hydration + Reset Fix)
**Task**: Fix WhatsApp settings form reset on tab switch and theme hydration mismatch.

**Files Changed**:
1.  `src/components/settings/whatsapp-config.tsx`:
    *   Added `hasFetchedRef` to track initial data load per `accountId`.
    *   Guarded `fetchConfig` call in `useEffect` to prevent background auth refreshes (triggered by window focus) from clobbering active user edits.
2.  `src/app/layout.tsx`:
    *   Added `suppressHydrationWarning` to the `<html>` tag to ignore attribute mismatches caused by the theme boot script.
3.  `src/hooks/use-theme.tsx`:
    *   Stabilized `ThemeProvider` by initializing state with `DEFAULT_THEME` (matching server render).
    *   Moved theme reading from DOM/localStorage into a `useEffect` to ensure hydration consistency.
    *   Removed unused `readInitialTheme` helper.

**Root Cause**:
1.  **Form Reset**: `useAuth()` updates on window focus due to session validation. The `useEffect` in `whatsapp-config.tsx` was re-triggering `fetchConfig` on every update, which reset local state to DB values.
2.  **Hydration Mismatch**: The server rendered one theme while the client-side boot script immediately applied another before React hydrated. React detected the attribute difference and warned.

**Validation Result**:
*   TypeScript validation: PASS
*   Manual Verification: The `hasFetchedRef` logic correctly prevents re-fetches when `accountId` is stable, even if `AuthContext` re-renders. The theme state now matches the server on first render.

**Rollback Instructions**:
*   Revert changes to `whatsapp-config.tsx` (remove ref and guard).
*   Remove `suppressHydrationWarning` from `layout.tsx`.
*   Restore `readInitialTheme` and its usage in `use-theme.tsx`.

## 2026-06-05

### Post-Remediation Verification

I have performed a manual verification of all modules claimed to be remediated in the modification log. I verified the source code against the claims for `account_id` presence, `user_id` filter removal, and usage of `getCurrentAccount()` / `useAuth()`.

| Module | Verification Result | Issues Found | Status |
| :--- | :--- | :--- | :--- |
| **Automations** | **PASS** | Verified `account_id` in `POST` and `GET` filters. | PASS |
| **Flows** | **PASS** | Verified `requireOwnership` uses `account_id`. | PASS |
| **Tags** | **PASS** | Verified `fetchTags` uses `account_id`. | PASS |
| **Deals** | **PASS** | Verified `deal-form.tsx` includes `account_id`. | PASS |
| **Templates** | **PASS** | Verified `upsert` and `PATCH/DELETE` use `account_id`. | PASS |
| **WhatsApp Config** | **PASS** | Verified `getCurrentAccount()` usage and `account_id` unique check. | PASS |
| **Broadcasts** | **PASS** | Verified `use-broadcast-sending.ts` includes `account_id` on all inserts. | PASS |
| **Custom Fields** | **PASS** | Verified `contact-detail-view.tsx` filters by `account_id`. | PASS |

### Remaining Tenancy Issues (Found during Repo-wide Audit)

| Severity | Module | File | Issue |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | **Inbox** | `src/app/api/whatsapp/send/route.ts` | Uses manual profile lookup instead of `getCurrentAccount()`. |
| **CRITICAL** | **Inbox** | `src/app/api/whatsapp/react/route.ts` | Uses manual profile lookup and `actor_id: user.id` in `message_reactions` delete without account scope. |
| **CRITICAL** | **Inbox** | `src/app/(dashboard)/inbox/page.tsx` | `hydrateConversation` and `checkConnection` use manual profile lookups. |
| **HIGH** | **Flows** | `src/components/flows/forms/node-config-form.tsx` | Still has a legacy `.eq("user_id", user.id)` filter when fetching tags. |
| **MEDIUM** | **WhatsApp Config** | `src/app/api/whatsapp/media/[mediaId]/route.ts` | Uses manual profile lookup instead of `getCurrentAccount()`. |

**Files Checked**:
- `src/app/api/automations/route.ts`
- `src/app/api/automations/[id]/route.ts`
- `src/app/api/whatsapp/config/route.ts`
- `src/app/api/whatsapp/templates/sync/route.ts`
- `src/components/pipelines/deal-form.tsx`
- `src/components/settings/tag-manager.tsx`
- `src/app/api/flows/route.ts`
- `src/hooks/use-broadcast-sending.ts`
- `src/components/contacts/contact-detail-view.tsx`
- `src/app/api/whatsapp/send/route.ts`
- `src/app/api/whatsapp/react/route.ts`
- `src/app/(dashboard)/inbox/page.tsx`
- `src/components/flows/forms/node-config-form.tsx`
- `src/app/api/whatsapp/media/[mediaId]/route.ts`

**Remaining Risks**:
- **Inbox Module**: The core messaging path still relies on legacy profile resolution patterns which could lead to maintenance drift or subtle bugs in teammate isolation.
- **Flow Builder**: The legacy filter in `node-config-form.tsx` prevents teammates from using tags created by others in flow logic.

```