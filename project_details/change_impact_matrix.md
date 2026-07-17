# CHANGE IMPACT MATRIX

---

## Module: WhatsApp Integration
-   **Files**: `src/lib/whatsapp/*`, `src/app/api/whatsapp/*`.
-   **Dependencies**: Meta Cloud API, `ENCRYPTION_KEY`, `META_APP_SECRET`.
-   **Consumers**: Inbox, Automations, Flows, Broadcasts.
-   **Database Dependencies**: `whatsapp_config`, `messages`, `conversations`.
-   **API Dependencies**: Meta Graph API v21.0.

### If Modified
-   **What breaks?**: Real-time messaging, webhook processing, status tracking.
-   **Potential regressions?**: Message delivery failures, signature mismatch on webhooks, decryption errors.
-   **Testing required**: Unit tests in `src/lib/whatsapp/*.test.ts`, E2E test of sending/receiving a message.
-   **Pages affected**: Inbox, Settings (WhatsApp tab), Broadcasts.

---

## Module: Automation Engine
-   **Files**: `src/lib/automations/*`, `src/app/api/automations/*`.
-   **Dependencies**: WhatsApp Integration, `SUPABASE_SERVICE_ROLE_KEY`.
-   **Consumers**: Webhook (on inbound message), User (manual trigger).
-   **Database Dependencies**: `automations`, `automation_steps`, `automation_logs`, `automation_pending_executions`.

### If Modified
-   **What breaks?**: Automated replies, keyword triggers, scheduled "Wait" steps.
-   **Potential regressions?**: Infinite loops in automations, failed resume of pending tasks, incorrect branching logic.
-   **Testing required**: `src/lib/automations/engine.test.ts`.
-   **Pages affected**: Automations List, Automation Builder.

---

## Module: Flow Builder
-   **Files**: `src/components/flows/*`, `src/lib/flows/*`, `src/app/api/flows/*`.
-   **Dependencies**: WhatsApp Integration (interactive messages), XYFlow.
-   **Consumers**: Webhook (on keyword match).
-   **Database Dependencies**: `flows`, `flow_nodes`, `flow_runs`.

### If Modified
-   **What breaks?**: Interactive chatbot runs, node-based editor, flow activation.
-   **Potential regressions?**: Broken edges in the graph, state loss in `flow_runs`, invalid interactive payload generation.
-   **Testing required**: `src/lib/flows/*.test.ts`, `src/components/flows/flow-editor-state.test.ts`.
-   **Pages affected**: Flows List, Flow Editor.

---

## Safe Modification Procedure

### 1. Database Schema Change
1.  Read existing migrations to check for naming conflicts.
2.  Create a new SQL file in `supabase/migrations/`.
3.  Include `account_id` and RLS policies using `is_account_member`.
4.  Apply migration locally.
5.  Update `src/types/index.ts` or relevant type files.

### 2. Meta API Change
1.  Check Meta API documentation for version `v21.0`.
2.  Update `src/lib/whatsapp/meta-api.ts` using **named parameters**.
3.  Update corresponding validation tests in `.test.ts`.
4.  Verify impact on `meta-send.ts` helpers in both Automations and Flows.

---

## Safe Deletion Procedure

### Deleting a Component
1.  Grep for the component name in `src/`.
2.  If used in a page, ensure the layout doesn't break.
3.  Remove the file and any associated `.test.ts`.
4.  Check for unused imports in consumer files.

### Deleting an API Route
1.  Search for references to the URL in `fetch()` calls or `use-realtime` hooks.
2.  Check if any Automation step or Flow node (e.g., `http_fetch`) calls this endpoint.
3.  Verify no cron jobs or external webhooks target this route.

---

## Feature Expansion Guide

### Adding a New Page
1.  Create a folder in `src/app/(dashboard)/` with `page.tsx`.
2.  Use `useAuth` to gate access if specific roles are required beyond "authenticated".
3.  Add the new route to the `Sidebar` in `src/components/layout/sidebar.tsx`.
4.  Ensure the page follows the `DashboardShell` layout pattern.

### Adding a New Integration
1.  Create a new directory in `src/lib/` for the integration logic.
2.  Store credentials in `src/app/api/settings/` (or similar) with AES encryption if sensitive.
3.  Expose functionality via a custom hook or server-side utility.
4.  Add a new tab to the Settings page for configuration.

### Adding a New Automation Trigger/Step
1.  Update the `AutomationTriggerType` or `AutomationStepType` in `src/types/index.ts`.
2.  Add the logic to `src/lib/automations/engine.ts`.
3.  Update `AutomationBuilder` to support the new type in the UI.
4.  Add a template in `src/lib/automations/templates.ts` to showcase the new feature.
