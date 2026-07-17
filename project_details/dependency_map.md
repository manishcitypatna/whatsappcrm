# COMPLETE DEPENDENCY MAP

---

## Import Graphs

### Dashboard Overview (`/dashboard`)
```
/dashboard/page.tsx
├── components/dashboard/MetricCard
├── components/dashboard/SkeletonCard
├── components/dashboard/QuickActions
├── components/dashboard/ConversationsChart
├── components/dashboard/PipelineDonut
├── components/dashboard/ResponseTimeChart
├── components/dashboard/ActivityFeed
├── hooks/use-auth
└── lib/supabase/client
```

### Shared Inbox (`/inbox`)
```
/inbox/page.tsx
├── components/inbox/ConversationList
├── components/inbox/MessageThread
├── components/inbox/ContactSidebar
├── hooks/use-realtime
├── hooks/use-auth
└── lib/supabase/client
```

### Automation Builder
```
/automations/[id]/edit/page.tsx
├── components/automations/AutomationBuilder
├── lib/automations/engine
├── lib/automations/steps-tree
└── lib/supabase/client
```

---

## Reverse Dependency Map

### [src/lib/supabase/client.ts](file:///Users/manish/Documents/wcrm/src/lib/supabase/client.ts)
-   **Used By**:
    -   All files in `src/app/(dashboard)/`
    -   All files in `src/components/` (except UI primitives)
    -   `src/hooks/use-auth.tsx`
    -   `src/hooks/use-realtime.ts`

### [src/lib/whatsapp/encryption.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/encryption.ts)
-   **Used By**:
    -   `src/app/api/whatsapp/send/route.ts`
    -   `src/app/api/whatsapp/webhook/route.ts`
    -   `src/app/api/whatsapp/config/route.ts`
    -   `src/lib/automations/meta-send.ts`
    -   `src/lib/flows/meta-send.ts`

### [src/lib/whatsapp/meta-api.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/meta-api.ts)
-   **Used By**:
    -   `src/app/api/whatsapp/send/route.ts`
    -   `src/app/api/whatsapp/broadcast/route.ts`
    -   `src/lib/automations/meta-send.ts`
    -   `src/lib/flows/meta-send.ts`

---

## Circular Dependency Risks
-   **Identified Risks**:
    -   `src/lib/automations/engine.ts` <-> `src/lib/automations/steps-tree.ts` (Potential circularity in step execution logic, though currently avoided by clean separation of concerns).
    -   `src/components/flows/flow-editor-state.tsx` <-> `src/components/flows/flow-canvas.tsx` (Avoided by using Context and separating state from view).

---

## Dead Code Detection
-   **Unused Components**: None obviously detected; most components in `src/components/ui` are used by domain components.
-   **Unused Hooks**: `use-theme.tsx` (Might be redundant if only dark mode is enforced).
-   **Unused APIs**: `api/whatsapp/media/[mediaId]` (Check if media downloads are fully implemented in the UI).

---

## Shared Component Matrix

| Component | Inbox | Contacts | Pipelines | Dashboard | Settings |
| --------- | ----- | -------- | --------- | --------- | -------- |
| Button    | Yes   | Yes      | Yes       | Yes       | Yes      |
| Input     | Yes   | Yes      | Yes       | No        | Yes      |
| Dialog    | Yes   | Yes      | Yes       | No        | Yes      |
| Avatar    | Yes   | Yes      | Yes       | Yes       | Yes      |
| Badge     | Yes   | Yes      | Yes       | Yes       | Yes      |

---

## Service Dependency Graph

### Messaging Feature
```
UI (Inbox)
 ↓
Hook (useRealtime)
 ↓
Supabase Realtime (Websocket)
 ↓
Database (messages table)
 ↑
API (api/whatsapp/send)
 ↓
Meta API (Cloud API)
```

### Automation Feature
```
Meta Webhook
 ↓
API (api/whatsapp/webhook)
 ↓
Logic (automations/engine)
 ↓
Database (automation_logs)
 ↓
Meta API (meta-send)
```
