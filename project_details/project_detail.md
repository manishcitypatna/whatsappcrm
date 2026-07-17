# PROJECT SINGLE SOURCE OF TRUTH (SSOT)

---

# 1. Executive Summary & Tech Stack

## Project Purpose
The application is a **Self-hostable CRM for WhatsApp** (WACRM), designed to help businesses manage customer interactions, sales pipelines, and marketing automations via the WhatsApp Business API. It provides a multi-tenant environment where teams can collaborate on shared inboxes, automate repetitive tasks, and track sales progress.

**Business Domain**: Customer Relationship Management (CRM) / Marketing Automation / Conversational Commerce.

**Core User Journeys**:
1.  **Onboarding**: Sign up, create an account, and connect a WhatsApp Business account (WABA) using phone ID and access tokens.
2.  **Communication**: Receive and send messages via a shared inbox, including text, media, and templates.
3.  **Lead Management**: Import contacts, tag them, and track them through customizable sales pipelines.
4.  **Automation**: Build no-code automations triggered by keywords, tags, or message events to automate responses or internal workflows.
5.  **Broadcasts**: Send bulk template-based messages to segmented audiences for marketing or utility purposes.
6.  **Team Collaboration**: Invite teammates to an account with specific roles (Admin, Agent, Viewer) to manage conversations and deals.

**Primary Workflows**:
-   **Inbound Message Handling**: Webhook receives message -> Logs to DB -> Triggers Automations/Flows -> Updates Realtime UI.
-   **Outbound Messaging**: User sends message -> API validates -> Meta API sends -> Updates status (delivered/read) via webhook.
-   **Automation Execution**: Event occurs -> Engine matches triggers -> Executes steps (send msg, wait, update field, etc.) -> Logs results.

## Technology Stack

### Frontend
-   **Framework**: Next.js 16.2.6 (App Router)
-   **Library**: React 19.2.4
-   **Styling**: Tailwind CSS v4, Lucide React (Icons)
-   **UI Components**: Shadcn UI (Radix UI based), Tremor (Charts), Recharts (Visualizations)
-   **Visual Editors**: XYFlow (@xyflow/react) for Flow Builder, dnd-kit for Pipelines
-   **Toast/Notifications**: Sonner

### Backend
-   **Framework**: Next.js App Router (Route Handlers)
-   **Runtime**: Node.js >= 20.0.0
-   **Security**: HMAC-SHA256 (Webhook verification), AES-256-GCM (Token encryption)

### Database
-   **Technology**: Supabase (PostgreSQL)
-   **Client**: @supabase/supabase-js, @supabase/ssr
-   **Migrations**: Raw SQL migrations managed in `supabase/migrations`
-   **Realtime**: Supabase Realtime (Websockets for messages/conversations)

### Authentication
-   **Provider**: Supabase Auth (JWT-based)
-   **Strategy**: Server-side sessions with @supabase/ssr, Middleware protection.

### State Management
-   **Auth State**: React Context (`AuthProvider` in `use-auth.tsx`)
-   **Flow State**: React Context (`FlowEditorProvider` in `flow-editor-state.tsx`)
-   **Form State**: Local React state / Controlled components.

### Deployment Stack
-   **Infrastructure**: Self-hostable (Vercel, Hostinger, etc.)
-   **CI/CD**: GitHub Actions (`ci.yml`)
-   **Monitoring**: Supabase Dashboard (DB/Auth), Meta App Dashboard (API health)

### Build Tools
-   **Bundler**: Turbopack (Next.js default)
-   **Type System**: TypeScript 6
-   **Linting**: ESLint 9
-   **Formatting**: Prettier 3.8.3

### Testing Stack
-   **Framework**: Vitest 4.1.8
-   **Utilities**: Supabase Admin client for server-side tests.

---

# 2. Environment & Configuration

## Environment Variables

### NEXT_PUBLIC_SUPABASE_URL
-   **Purpose**: Public URL for the Supabase project.
-   **Used By**: Supabase clients (client-side and server-side).
-   **Referenced Files**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `middleware.ts`.
-   **Failure Impact**: Application fails to connect to the database/auth; complete outage.
-   **Required/Optional**: Required.

### NEXT_PUBLIC_SUPABASE_ANON_KEY
-   **Purpose**: Public anonymous key for Supabase RLS.
-   **Used By**: Client-side Supabase client.
-   **Referenced Files**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `middleware.ts`.
-   **Failure Impact**: Client-side queries fail; auth fails.
-   **Required/Optional**: Required.

### SUPABASE_SERVICE_ROLE_KEY
-   **Purpose**: Secret key that bypasses RLS.
-   **Used By**: Server-side admin clients (Webhook, Automation Engine).
-   **Referenced Files**: `src/lib/automations/admin-client.ts`, `src/lib/flows/admin-client.ts`, `src/app/api/whatsapp/webhook/route.ts`.
-   **Failure Impact**: Inbound messages fail to process; automations fail.
-   **Required/Optional**: Required.

### ENCRYPTION_KEY
-   **Purpose**: 64 hex chars (32 bytes) for AES-256-GCM encryption of WhatsApp tokens.
-   **Used By**: Encryption utility.
-   **Referenced Files**: `src/lib/whatsapp/encryption.ts`, `src/app/api/whatsapp/send/route.ts`.
-   **Failure Impact**: WhatsApp tokens cannot be decrypted; outbound messaging fails.
-   **Required/Optional**: Required.

### META_APP_SECRET
-   **Purpose**: Verifies HMAC-SHA256 signature on inbound webhooks.
-   **Used By**: Webhook signature verification utility.
-   **Referenced Files**: `src/lib/whatsapp/webhook-signature.ts`, `src/app/api/whatsapp/webhook/route.ts`.
-   **Failure Impact**: Webhook rejects all inbound POST requests from Meta.
-   **Required/Optional**: Required.

### NEXT_PUBLIC_SITE_URL
-   **Purpose**: Canonical public URL for the deployment.
-   **Used By**: Generating absolute links (invites, cron jobs).
-   **Referenced Files**: `src/lib/auth/invitations.ts`.
-   **Failure Impact**: Invite links may point to the wrong hostname.
-   **Required/Optional**: Recommended (defaults to request host).

### AUTOMATION_CRON_SECRET
-   **Purpose**: Shared secret to protect the `/api/automations/cron` endpoint.
-   **Used By**: Cron route handler.
-   **Referenced Files**: `src/app/api/automations/cron/route.ts`.
-   **Failure Impact**: Automation "Wait" steps will not resume if public; risk of unauthorized pings.
-   **Required/Optional**: Optional (Required if using Wait steps).

## Configuration Files

### next.config.ts
-   **Purpose**: Next.js framework configuration.
-   **Important Settings**: Security headers (CSP, HSTS), Cache-Control policies (no-store for APIs, stale-while-revalidate for pages).
-   **Impact**: Controls performance, security, and edge caching behavior.

### tsconfig.json
-   **Purpose**: TypeScript compiler configuration.
-   **Important Settings**: Path aliases (`@/*`), ES2017 target, Bundler module resolution.
-   **Impact**: Drives type safety and module resolution during development/build.

### tailwind.config.mjs
-   **Purpose**: Tailwind CSS v4 configuration (Note: v4 mostly uses CSS variables, but config may exist for backwards compat).
-   **Impact**: Controls UI theme and styling rules.

### components.json
-   **Purpose**: Configuration for Shadcn UI CLI.
-   **Impact**: Manages UI component installation paths and styling conventions.

---

# 3. File Architecture & Directory Mapping

## Directory Map

### /src
-   **Purpose**: Root of the application source code.
-   **Responsibilities**: Contains all logic, components, and routes.

### /src/app
-   **Purpose**: Next.js App Router root.
-   **Responsibilities**: File-based routing, layouts, and API endpoints.

#### /src/app/(auth)
-   **Purpose**: Authentication-related routes.
-   **Files**: `login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`.
-   **Responsibilities**: User entry points for auth.

#### /src/app/(dashboard)
-   **Purpose**: Protected dashboard area.
-   **Responsibilities**: Core CRM functionality (Inbox, Contacts, etc.).
-   **Files**:
    -   `layout.tsx`: Root dashboard layout.
    -   `dashboard-shell.tsx`: Client-side auth gate and UI shell.

#### /src/app/api
-   **Purpose**: Server-side API endpoints.
-   **Responsibilities**: External integrations, database operations, and background tasks.

### /src/components
-   **Purpose**: Reusable UI components.
-   **Responsibilities**: Presentation logic and shared UI elements.

#### /src/components/ui
-   **Purpose**: Base design system components (Shadcn UI).
-   **Responsibilities**: Buttons, Inputs, Dialogs, etc.

#### /src/components/flows
-   **Purpose**: Flow Builder specific components.
-   **Responsibilities**: Canvas, Nodes, State management for message flows.

### /src/lib
-   **Purpose**: Core business logic and utilities.
-   **Responsibilities**: API clients, database queries, domain-specific logic.

#### /src/lib/whatsapp
-   **Purpose**: Meta WhatsApp Business API integration.
-   **Responsibilities**: Messaging, registration, encryption, webhook handling.

#### /src/lib/automations
-   **Purpose**: Automation engine logic.
-   **Responsibilities**: Trigger matching, step execution, logging.

### /supabase/migrations
-   **Purpose**: Database schema version control.
-   **Responsibilities**: Defining tables, RLS policies, triggers, and functions.

## Key Files Mapping

### [src/middleware.ts](file:///Users/manish/Documents/wcrm/src/middleware.ts)
-   **Purpose**: Request-level security and redirects.
-   **Exports**: `middleware` function.
-   **Dependencies**: `@supabase/ssr`.
-   **Used By**: Next.js runtime.

### [src/hooks/use-auth.tsx](file:///Users/manish/Documents/wcrm/src/hooks/use-auth.tsx)
-   **Purpose**: Global auth and profile state management.
-   **Exports**: `AuthProvider`, `useAuth`.
-   **Dependencies**: `@supabase/supabase-js`.
-   **Used By**: `dashboard-shell.tsx`, almost all dashboard components.

### [src/lib/whatsapp/meta-api.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/meta-api.ts)
-   **Purpose**: Low-level Meta API client.
-   **Exports**: `sendTextMessage`, `sendTemplateMessage`, `verifyPhoneNumber`, etc.
-   **Used By**: `api/whatsapp/send`, `api/whatsapp/broadcast`, `automations/engine`.

### [src/lib/automations/engine.ts](file:///Users/manish/Documents/wcrm/src/lib/automations/engine.ts)
-   **Purpose**: Logic for executing automations.
-   **Exports**: `runAutomationsForTrigger`, `resumePendingExecution`.
-   **Used By**: `api/whatsapp/webhook`, `api/automations/engine`.

---

# 4. Comprehensive Routing & Navigation Map

## Dashboard Routes

### Dashboard Overview
-   **URL**: `/dashboard`
-   **File Path**: `src/app/(dashboard)/dashboard/page.tsx`
-   **Access Level**: Authenticated
-   **Layout Hierarchy**: Root Layout -> Dashboard Layout -> Sidebar/Header -> Content Area
-   **UI Structure**: Metric cards (Top), Charts (Middle), Activity Feed (Right), Quick Actions (Bottom)
-   **Components Used**: `MetricCard`, `ConversationsChart`, `PipelineDonut`, `ActivityFeed`, `QuickActions`.
-   **Data Sources**: `profiles`, `conversations`, `messages`, `deals`.
-   **Business Purpose**: High-level overview of account performance and recent activity.

### Shared Inbox
-   **URL**: `/inbox`
-   **File Path**: `src/app/(dashboard)/inbox/page.tsx`
-   **Access Level**: Authenticated
-   **Layout Hierarchy**: Root Layout -> Dashboard Layout -> Sidebar/Header -> Full Height Content
-   **UI Structure**: Conversation List (Left), Message Thread (Center), Contact Sidebar (Right)
-   **Components Used**: `ConversationList`, `MessageThread`, `ContactSidebar`, `MessageComposer`, `TemplatePicker`.
-   **API Calls**: `api/whatsapp/send`, `api/whatsapp/media`.
-   **State Dependencies**: `activeConversation`, `messages`, `conversations`.
-   **Business Purpose**: Real-time communication with customers via WhatsApp.

### Contact Management
-   **URL**: `/contacts`
-   **File Path**: `src/app/(dashboard)/contacts/page.tsx`
-   **Access Level**: Authenticated
-   **UI Structure**: Search bar + Action buttons (Top), Paginated Table (Center), Detail Side-sheet (Right)
-   **Components Used**: `Table`, `ContactForm`, `ImportModal`, `ContactDetailView`.
-   **Business Purpose**: Managing lead database, tagging, and custom field values.

### Sales Pipelines
-   **URL**: `/pipelines`
-   **File Path**: `src/app/(dashboard)/pipelines/page.tsx`
-   **Access Level**: Authenticated
-   **UI Structure**: Pipeline Selector (Top), Kanban Board (Center), Deal Sheet (Right)
-   **Components Used**: `PipelineBoard`, `DealCard`, `DealForm`, `PipelineSettings`.
-   **Business Purpose**: Visualizing and managing the sales funnel.

### Automations Builder
-   **URL**: `/automations`
-   **File Path**: `src/app/(dashboard)/automations/page.tsx`
-   **Access Level**: Authenticated
-   **UI Structure**: Automation List (Center), Template Selection Modal, Editor Canvas.
-   **Components Used**: `AutomationBuilder`, `Switch`, `Dialog`.
-   **Business Purpose**: Creating no-code workflows to automate responses and lead processing.

### Message Flows (Advanced)
-   **URL**: `/flows`
-   **File Path**: `src/app/(dashboard)/flows/page.tsx`
-   **Access Level**: Authenticated
-   **UI Structure**: List of flows, Status toggles, Editor shell.
-   **Business Purpose**: Building complex multi-step conversation flows using a node-based editor.

### Broadcasts
-   **URL**: `/broadcasts`
-   **File Path**: `src/app/(dashboard)/broadcasts/page.tsx`
-   **Access Level**: Authenticated
-   **UI Structure**: Step-by-step wizard for sending bulk messages.
-   **Business Purpose**: Mass marketing and notification campaigns.

### Settings
-   **URL**: `/settings`
-   **File Path**: `src/app/(dashboard)/settings/page.tsx`
-   **Access Level**: Authenticated
-   **UI Structure**: Tabbed interface (Profile, WhatsApp, Templates, Tags, Appearance, Members).
-   **Business Purpose**: Account and application configuration.

---

# 5. Authentication & Authorization Architecture

## Login Flow
1.  User enters email/password on `/login`.
2.  `supabase.auth.signInWithPassword()` is called.
3.  On success, `middleware.ts` detects session and allows access to `/dashboard`.
4.  `AuthProvider` fetches the user's `profile` and `account` details.

## Registration Flow
1.  User signs up on `/signup`.
2.  Supabase trigger `on_auth_user_created` fires `handle_new_user()`.
3.  `handle_new_user()` creates an `account` (user is owner) and a `profile` linked to that account.

## Session Management
-   Handled by `@supabase/ssr`.
-   Cookies store the JWT.
-   Middleware refreshes the session on every request.

## Middleware
-   Protects dashboard and API routes.
-   Redirects based on auth status.
-   Handles invite link redirects to `/join/[token]`.

## RBAC / Permissions
-   **Roles**:
    -   `owner`: Full access, including account deletion and ownership transfer.
    -   `admin`: Can manage members and edit account-wide settings.
    -   `agent`: Can manage conversations, deals, and contacts.
    -   `viewer`: Read-only access to most data.
-   **Implementation**: `is_account_member(account_id, min_role)` function in PostgreSQL + `use-can.ts` hook in React.

---

# 6. API Architecture

## WhatsApp Endpoints

### POST /api/whatsapp/send
-   **Purpose**: Send a text or template message.
-   **Request**: `{ conversation_id, message_type, content_text, template_name, ... }`
-   **Auth**: Required.
-   **Operations**: Validates conversation -> Decrypts token -> Calls Meta API -> Logs message in DB.

### POST /api/whatsapp/webhook
-   **Purpose**: Receive events from Meta.
-   **Auth**: HMAC Signature Verification.
-   **Operations**: Processes inbound messages, status updates (delivered/read), and template status changes.
-   **Side Effects**: Triggers Automations and Flows.

### POST /api/whatsapp/broadcast
-   **Purpose**: Initiate a bulk message campaign.
-   **Operations**: Segments audience -> Queues messages -> Calls Meta API in batches.

## Automation Endpoints

### POST /api/automations/engine
-   **Purpose**: Manually trigger an automation for a contact.
-   **Auth**: Required.

### GET /api/automations/cron
-   **Purpose**: Resume "Wait" steps.
-   **Auth**: `AUTOMATION_CRON_SECRET`.

---

# 7. Database Architecture

## ORM / Provider
-   **Provider**: Supabase (PostgreSQL).
-   **ORM Layer**: Raw SQL for migrations, Supabase Client for JS/TS queries.

## Migration Strategy
-   Idempotent SQL scripts in `supabase/migrations/`.
-   Versioned numbering (e.g., `001_initial_schema.sql`).

## Core Models

### accounts
-   **Purpose**: Tenant root.
-   **Fields**: `id`, `name`, `owner_user_id`.

### profiles
-   **Purpose**: User profile and account membership.
-   **Fields**: `id`, `user_id`, `account_id`, `account_role`, `full_name`, `email`.

### contacts
-   **Purpose**: Lead/Customer data.
-   **Fields**: `id`, `account_id`, `phone`, `name`, `email`, `company`.

### conversations
-   **Purpose**: WhatsApp chat sessions.
-   **Fields**: `id`, `account_id`, `contact_id`, `status`, `last_message_at`.

### messages
-   **Purpose**: Individual chat messages.
-   **Fields**: `id`, `conversation_id`, `sender_type`, `content_text`, `status`.

---

# 8. State Management Architecture

## Auth Context (`use-auth.tsx`)
-   **Variables**: `user`, `profile`, `account`, `accountRole`.
-   **Subscribers**: Almost all components.
-   **Side Effects**: Redirects on logout.

## Flow Editor Context (`flow-editor-state.tsx`)
-   **Variables**: `nodes`, `edges`, `dirty`, `saving`.
-   **Actions**: `addNode`, `updateNode`, `save`.
-   **Subscribers**: `FlowCanvas`, `FlowHeader`, `NodeConfigForm`.

---

# 9. Third-Party Integrations

## Meta WhatsApp Business API
-   **Purpose**: Primary communication channel.
-   **Initialization**: Token and Phone ID in `whatsapp_config`.
-   **Failure Handling**: Retries on rate limits, status logged as 'failed'.

## Supabase
-   **Purpose**: Auth, DB, Realtime, Storage.
-   **Files**: `src/lib/supabase/`.

---

# 10. UI/UX Architecture

## Design System
-   **Framework**: Tailwind CSS v4.
-   **Theme**: Dark mode (slate-950 background).
-   **Typography**: Inter (implied by default Next.js fonts).

## Layout Rules
-   **Sidebar**: 280px width, fixed on desktop, drawer on mobile.
-   **Header**: 64px height, contains navigation/user menu.
-   **Spacing**: 1rem (p-4) to 1.5rem (p-6) standard padding.
-   **Cards**: Slate-900 with slate-800 borders.

---

# 11. Component Deep Dive

## ConversationList
-   **File Path**: `src/components/inbox/conversation-list.tsx`
-   **Purpose**: Display and filter active chat sessions.
-   **Props**: `conversations`, `activeId`, `onSelect`.
-   **Hooks Used**: `useMemo`, `useCallback`.
-   **Internal State**: `filter` (all, unread, pending).
-   **Dependencies**: `Avatar`, `Badge`, `ScrollArea`.
-   **Styling**: Fixed width on desktop, scrollable list.

## MessageThread
-   **File Path**: `src/components/inbox/message-thread.tsx`
-   **Purpose**: Display messages for a single conversation and handle sending.
-   **Props**: `conversation`, `messages`, `onSendMessage`.
-   **Internal State**: `inputValue`, `isSending`.
-   **Render Tree**: `MessageBubble` list -> `MessageComposer`.

## AutomationBuilder
-   **File Path**: `src/components/automations/automation-builder.tsx`
-   **Purpose**: UI for editing automation triggers and steps.
-   **Business Usage**: Creating logic like "If tag 'Lead' is added, wait 1 hour, then send template 'Welcome'".

---

# 12. Hooks Architecture

## useAuth
-   **Purpose**: Access current user, profile, and account context.
-   **Returns**: `{ user, profile, account, accountRole, loading, ... }`.
-   **Used By**: Almost every page to gate UI elements based on roles.

## useRealtime
-   **Purpose**: Subscribe to Supabase Realtime changes for messages and conversations.
-   **Parameters**: `channelName`, `table`, `filter`, `callback`.
-   **Business Usage**: Keeps the Inbox updated without manual refreshes.

## useCan
-   **Purpose**: Role-based capability check.
-   **Parameters**: `capability` (e.g., 'send-messages', 'edit-settings').
-   **Returns**: `boolean`.
-   **Logic**: Maps `accountRole` to permitted actions.

---

# 13. Business Logic Documentation

## Inbound Message Workflow
1.  **Meta Webhook** hits `/api/whatsapp/webhook`.
2.  **Signature Verification** ensures request is from Meta.
3.  **Supabase Admin** client used to:
    -   Find/Create `contact`.
    -   Find/Create `conversation`.
    -   Insert `message` with `sender_type='customer'`.
4.  **Realtime Broadcast** notifies all connected clients.
5.  **Automation Engine** triggered for `incoming_message`.
6.  **Flows Engine** triggered for inbound keywords.

## Broadcast Sending Workflow
1.  **User** creates a broadcast in `/broadcasts/new`.
2.  **API** validates template and audience.
3.  **Background Task** (implied) or sequential calls:
    -   Iterate through recipients.
    -   Call `meta-api.ts:sendTemplateMessage`.
    -   Update `broadcast_recipients` status.
    -   Increment `broadcasts` counters (sent, failed).

---

# 14. Utility & Helper Functions

## [encryption.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/encryption.ts)
-   **Functions**: `encrypt(text)`, `decrypt(hash)`.
-   **Algorithm**: AES-256-GCM.
-   **Purpose**: Protecting Meta access tokens in the database.

## [phone-utils.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/phone-utils.ts)
-   **Functions**: `sanitizePhoneForMeta`, `isValidE164`.
-   **Purpose**: Ensuring phone numbers match Meta's strict formatting requirements.

---

# 15. Error Handling Strategy

## API Errors
-   Standardized JSON responses: `{ error: string }`.
-   HTTP Status Codes: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limit), 500 (Server Error).

## User-Facing Errors
-   Handled via `sonner` toasts.
-   Form validation via HTML5 and server-side checks.

## Logging
-   `console.error` used on server-side for API failures.
-   **automation_logs** table stores execution failures for debugging.

---

# 16. Performance Architecture

-   **Caching**: `Cache-Control: no-store` for APIs; `stale-while-revalidate` for static-ish pages.
-   **Pagination**: Server-side pagination in `/contacts` and `/broadcasts` using SQL `OFFSET` and `LIMIT`.
-   **Optimistic UI**: Switches and toggles (e.g., in `AutomationsPage`) update state before the API responds.
-   **Realtime**: Efficient WebSocket subscriptions via Supabase Realtime to avoid polling.
-   **Bundling**: Turbopack for fast development and optimized production builds.

---

# 17. Security Architecture

-   **Authentication**: Supabase Auth with server-side session verification.
-   **Authorization**: Row Level Security (RLS) with `is_account_member` helper ensures data isolation between accounts.
-   **Secrets Management**: `ENCRYPTION_KEY` for WhatsApp tokens; `META_APP_SECRET` for webhook verification.
-   **CSP**: Strict Content Security Policy configured in `next.config.ts`.
-   **XSS Prevention**: React automatically escapes content; input sanitization in API routes.
-   **CSRF**: Next.js built-in protection + Supabase Auth headers.

---

# 18. Testing Architecture

-   **Tools**: Vitest.
-   **Patterns**:
    -   **Validation Tests**: Ensuring Meta API payloads match constraints (e.g., button limits).
    -   **Logic Tests**: Testing edge case logic for automation triggers and flow edges.
    -   **Mocking**: Global `fetch` stubbing in tests to prevent real API calls.
-   **Coverage**: High focus on `src/lib/whatsapp`, `src/lib/automations`, and `src/lib/flows`.

---

# 19. Production Deployment Architecture

-   **Infrastructure**: Any Next.js compatible host (Vercel, Hostinger, Docker).
-   **Database**: Supabase (PostgreSQL).
-   **Build Process**: `next build` generates optimized assets.
-   **CI/CD**: GitHub Actions for linting, typechecking, and running tests on PRs.
-   **Monitoring**: Supabase Dashboard for DB performance and logs.

---

# 20. Technical Debt Register

1.  **Legacy Role Column**: `profiles.role` (TEXT) is legacy and unused; should be removed in favor of `account_role`.
2.  **Storage Tenancy**: Storage buckets (avatars, flow-media) are currently user-scoped; should be rescoped to account-based paths.
3.  **Manual Resync**: `resyncToken` in Inbox is a "safety net" for missed WS events; could be improved with more robust sync logic.
4.  **Flow Validation**: `removeNode` does not auto-clean inbound edges (surfaces as validation issues instead).

---

# 21. AI Maintenance Context

## Safe Modification Procedures
-   **Database**: Always create a new migration in `supabase/migrations/`. Ensure it's idempotent.
-   **Tenancy**: When adding a new table, ALWAYS include `account_id` and an RLS policy using `is_account_member`.
-   **Meta API**: Use named parameters for all `meta-api.ts` functions to avoid positional argument bugs.
-   **Testing**: Add a `.test.ts` file for any new logic in `src/lib`.

## Regression Prevention Checklist
-   Verify `middleware.ts` allows the new route.
-   Verify RLS policies for the new table.
-   Check that `account_id` is correctly populated on insert.
-   Verify Meta API payloads against their documentation limits.
-   Run `npm test` before proposing changes.
