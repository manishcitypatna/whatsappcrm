# Audit Report

## Executive Summary

The tenancy audit of the WhatsApp CRM (WACRM) reveals that while the core infrastructure for multi-tenancy (Migration 017, accounts, roles, RLS) is sound, the application logic has failed to keep pace. **Widespread tenancy leakage and functional breakage** were discovered across 8 of the 15 major feature modules.

The most critical issues are:
1. **Broken Creation Paths**: Multiple operational tables (Automations, Flows, Contacts, Broadcasts) were migrated to `account_id NOT NULL`, but the application still omits `account_id` on insert, leading to runtime crashes.
2. **Teammate Data Blindness**: Legacy `.eq('user_id', ...)` filters are still pervasive, preventing teammates from seeing shared contacts, tags, templates, and automations.

Immediate repair is required for the Contacts and Automation modules to maintain the core product value for team users.

## Phase 7 Findings

### Final Audit Totals
- **Total Features Discovered**: 15
- **PASS**: 6 (Auth, Dashboard, Inbox, Pipelines, WhatsApp Config, Member Management)
- **FAIL**: 8 (Contacts, Tags, Notes, Deals, Templates, Broadcasts, Automations, Flows)
- **UNKNOWN**: 1 (Custom Fields)

### Top 20 Tenancy-Risk Files
1. `src/app/api/automations/route.ts` (CRITICAL: Broken Create)
2. `src/app/api/flows/route.ts` (CRITICAL: Broken Create)
3. `src/hooks/use-broadcast-sending.ts` (CRITICAL: Broken Create/Filter)
4. `src/components/contacts/import-modal.tsx` (CRITICAL: Broken Bulk Insert)
5. `src/components/pipelines/deal-form.tsx` (HIGH: Broken Create)
6. `src/components/settings/tag-manager.tsx` (HIGH: Broken Create/Filter)
7. `src/components/settings/template-manager.tsx` (HIGH: Broken Filter)
8. `src/app/(dashboard)/broadcasts/new/page.tsx` (HIGH: Broken Draft)
9. `src/components/contacts/contact-detail-view.tsx` (MEDIUM: Broken Note Create)
10. `src/app/api/automations/[id]/route.ts` (MEDIUM: Broken Filter)
11. `src/components/inbox/template-picker.tsx` (MEDIUM: Broken Filter)
12. `src/components/flows/forms/node-config-form.tsx` (MEDIUM: Broken Filter)
13. `src/app/api/whatsapp/templates/sync/route.ts` (MEDIUM: Broken Filter)
14. `src/app/api/whatsapp/templates/submit/route.ts` (MEDIUM: Broken Filter)
15. `src/app/api/whatsapp/templates/[id]/route.ts` (MEDIUM: Broken Filter)
16. `src/app/api/whatsapp/broadcast/route.ts` (MEDIUM: Partial Fix only)
17. `src/lib/automations/engine.ts` (LOW: Service role insert needs verification)
18. `src/lib/flows/engine.ts` (LOW: Service role insert needs verification)
19. `src/components/contacts/contact-form.tsx` (LOW: Update misses account_id)
20. `src/app/api/account/route.ts` (LOW: Account update needs verification)

### Recommended Repair Order
1. **Contacts Module**: Fix `import-modal.tsx` and `use-broadcast-sending.ts` filters. (Unblocks core lead management).
2. **Automation/Flows API**: Fix `POST` routes in `src/app/api/automations/` and `src/app/api/flows/`. (Unblocks core automation).
3. **Shared Resources**: Fix `tag-manager.tsx` and `template-manager.tsx`. (Unblocks team collaboration).
4. **Sales Pipeline**: Fix `deal-form.tsx`. (Unblocks deal tracking).
5. **Broadcasts**: Fix draft saving and recipient recording. (Unblocks marketing).

### Recommended Testing Order
1. **Database Verification**: Ensure `account_id` is populated for all new rows.
2. **Multi-user Smoke Test**: Log in as User B and verify visibility of User A's contacts.
3. **Role Gating Test**: Verify 'Agent' cannot delete 'Admin' resources.
4. **Regression Test**: Ensure Inbox real-time updates still work after tenancy fixes.

### Estimated Effort
- **Total estimated effort**: 3-5 developer days to patch all identified FAIL sites and perform full manual QA.

## Phase 1 Findings

### Account Scoped Tables
From `supabase/migrations/017_account_sharing.sql`, the migration adds `account_id` (and applies NOT NULL) to the following domain tables (these are account-scoped):

- contacts
- tags
- custom_fields
- contact_notes
- conversations
- whatsapp_config
- message_templates
- pipelines
- deals
- broadcasts
- automations
- automation_logs
- automation_pending_executions
- flows
- flow_runs

Additionally, the tenancy model introduces:
- accounts (tenant root)
- account_invitations (invite links)
- profiles (extended with `account_id`, `account_role`)

### account_role usage
- New ENUM: `account_role_enum` = { owner, admin, agent, viewer }
- Role hierarchy enforced in `is_account_member(target_account_id, min_role)` helper.
- Policy tiers (by table):
  - viewer: SELECT
  - agent+: operational data write paths on operational tables (contacts, conversations, deals, automations, flows, etc.)
  - admin+: write paths on settings-class tables (tags, custom_fields, pipelines, whatsapp_config, message_templates)

### account_id usage
- Every account-scoped table has a new `account_id` FK → `accounts(id)`.
- `profiles.account_id` and `profiles.account_role` are added and set during backfill.
- Backfill logic sets one account per existing user (owner_user_id), then propagates `profiles.account_id` onto each domain row via the legacy `user_id` FK.

### RLS policies
- New helper: `is_account_member(target_account_id UUID, min_role account_role_enum DEFAULT 'viewer')` SECURITY DEFINER.
- Parent table RLS rewritten to use `is_account_member(account_id/targets)` semantics.
- Child tables use join semantics (EXISTS subqueries) to enforce account membership via parent rows.

### Tenancy-specific uniqueness/index changes that may affect features
- `whatsapp_config` uniqueness:
  - Drops legacy unique constraint on `(user_id)`
  - Enforces unique on `(account_id)`
- `flow_runs` active-run uniqueness:
  - Replaces `idx_one_active_run_per_contact` with unique index on `(account_id, contact_id)` WHERE status='active'

### Helper functions
- `public.handle_new_user()` trigger bootstrap:
  - On new `auth.users` insert, creates a personal `accounts` row and a `profiles` row linked with `account_role='owner'`.

### Migration-specific risks flagged for later phases
- RLS helper relies on `profiles p WHERE p.user_id = auth.uid()` and `p.account_id = target_account_id`.
  - Any code paths that still filter by legacy `user_id` for tenancy isolation may become under/over-inclusive.
- `profiles` UPDATE/INSERT policies remain tied to `auth.uid() = user_id` (admins cannot edit teammate’s profile fields). Role changes likely must go through dedicated membership RPC/endpoints (later migrations exist).
- Unique constraints changed; code assuming multiple WhatsApp numbers per user may now fail post-migration (now one per account).

## Phase 2 Findings

### Feature Inventory
Feature modules discovered from repository structure (`src/app`, `src/api`, `src/components`):

1. Authentication / Authorization (auth pages + role gating)
2. Dashboard (metrics, activity)
3. Inbox (conversations, message thread, reactions, template picker)
4. Contacts (contacts list, contact detail, contact form, import)
5. Tags (tag manager)
6. Notes (contact notes)
7. Custom Fields (custom field definitions + contact custom values)
8. Pipelines (pipeline board, pipeline settings, deals)
9. WhatsApp Configuration (whatsapp-config UI; registration/config)
10. Templates (message templates + template lifecycle)
11. Broadcasts (multi-step send wizard: template → audience → personalize → schedule)
12. Automations (automation builder)
13. Flows (node-based flow builder/editor)
14. Member Management / Account Sharing (members tab, invite member dialog)
15. Settings (profile, password, appearance, sessions)

### Tenancy migration linkage expectations (for Phase 3)
Phase 3 will audit tenancy-critical DB mutations/reads by searching for query patterns in API handlers and server/client calls:
- `.insert(` / `.upsert(` / `.update(` / `.delete(`
- `.eq('user_id'...)` / `.eq("user_id"...)`
- `.eq('account_id'...)`
- any implicit tenant routing (e.g., calls that rely on `profiles.account_id` being present in auth context)

## Phase 3 Findings

## Phase 3 Findings

### Tenancy Query Audit — Repository-wide Results

The audit identified multiple critical tenancy failures where legacy `user_id` filtering or missing `account_id` population breaks multi-user isolation and functionality.

#### 1. Missing `account_id` on Inserts (CRITICAL FAIL)
Tables migrated to `account_id NOT NULL` in migration 017 will reject these inserts, causing application errors.

| Feature | File | Evidence | Risk |
| --- | --- | --- | --- |
| Automations | `src/app/api/automations/route.ts` | `.insert({ user_id: user.id, ... })` | API 500; cannot create automations. |
| Flows | `src/app/api/flows/route.ts` | `.insert({ user_id: userId, ... })` | API 500; cannot create flows. |
| Deals | `src/components/pipelines/deal-form.tsx` | `.insert({ ...payload, user_id: user.id, status: "open" })` | UI Error; cannot create deals. |
| Contacts | `src/components/contacts/import-modal.tsx` | `.insert(rows)` where `rows` miss `account_id`. | UI Error; bulk import fails. |
| Broadcasts | `src/app/(dashboard)/broadcasts/new/page.tsx` | `handleSaveDraft` misses `account_id`. | UI Error; cannot save drafts. |
| Broadcasts | `src/hooks/use-broadcast-sending.ts` | `createAndSendBroadcast` misses `account_id`. | UI Error; cannot send broadcasts. |
| Broadcasts | `src/hooks/use-broadcast-sending.ts` | `broadcast_recipients` insert misses `account_id`. | UI Error; recipients not recorded. |
| Notes | `src/components/contacts/contact-detail-view.tsx` | `addNote` misses `account_id`. | UI Error; cannot add notes. |
| Contacts | `src/hooks/use-broadcast-sending.ts` | `upsertCsvContacts` insert misses `account_id`. | UI Error; CSV import fails. |

#### 2. Legacy `user_id` Filters (FAIL)
These queries miss rows created by teammates, breaking the "shared account" promise.

| Feature | File | Evidence | Risk |
| --- | --- | --- | --- |
| Contacts | `src/hooks/use-broadcast-sending.ts` | `upsertCsvContacts` uses `.eq('user_id', user.id)` on `contacts`. | Misses existing contacts created by teammates; duplicates contacts. |
| Templates | `src/components/settings/template-manager.tsx` | `.eq('user_id', userId)` on `message_templates`. | Teammates cannot see shared templates. |
| Tags | `src/components/settings/tag-manager.tsx` | `.eq('user_id', userId)` on `tags`. | Teammates cannot see shared tags. |
| Automations | `src/app/api/automations/[id]/route.ts` | `.eq('user_id', user.id)` on `automations`. | Teammates cannot edit/delete shared automations. |
| Flows | `src/components/flows/forms/node-config-form.tsx` | `.eq("user_id", user.id)` on `tags`. | Teammates cannot select tags in flow logic. |

#### 3. Tenancy Correct Patterns (PASS)
These areas correctly resolve `account_id` via `profiles` before querying domain tables.

- `src/app/api/whatsapp/config/route.ts`: Resolves `accountId` and queries `whatsapp_config` correctly.
- `src/app/api/whatsapp/broadcast/route.ts`: Resolves `accountId` and queries `whatsapp_config` + `message_templates` correctly.
- `src/app/api/account/members/route.ts`: Correctly uses `account_id` for profile listing.
- `src/components/inbox/conversation-list.tsx`: Correctly relies on RLS (filtered by `account_id`) for listing.

### Interim insert-audit conclusion:
- Highest potential tenancy breakage risk at runtime centers on admin/service-role insert paths that populate legacy `user_id` but not the new required `account_id` for account-scoped parent tables (notably `automations`, `flows`).
- Full coverage audit complete. Results indicate widespread tenancy leakage across most operational features (Contacts, Automations, Flows, Broadcasts, Pipelines).



```

## Phase 4 Findings

### CRUD Coverage Matrix

This matrix evaluates tenancy correctness for CRUD operations across major feature modules.

| Feature | Create | Read | Update | Delete | Status |
| --- | --- | --- | --- | --- | --- |
| Authentication | PASS | PASS | PASS | N/A | **PASS** |
| Dashboard | N/A | PASS | N/A | N/A | **PASS** |
| Inbox | PASS | PASS | PASS | PASS | **PASS** |
| Contacts | FAIL | PASS | PASS | PASS | **FAIL** |
| Tags | FAIL | FAIL | UNKNOWN | PASS | **FAIL** |
| Notes | FAIL | PASS | N/A | PASS | **FAIL** |
| Custom Fields | UNKNOWN | PASS | UNKNOWN | UNKNOWN | **UNKNOWN** |
| Pipelines | PASS | PASS | PASS | PASS | **PASS** |
| Deals | FAIL | PASS | PASS | PASS | **FAIL** |
| WhatsApp Config | PASS | PASS | PASS | PASS | **PASS** |
| Templates | FAIL | FAIL | FAIL | FAIL | **FAIL** |
| Broadcasts | FAIL | PASS | FAIL | UNKNOWN | **FAIL** |
| Automations | FAIL | FAIL | FAIL | FAIL | **FAIL** |
| Flows | FAIL | FAIL | FAIL | FAIL | **FAIL** |
| Member Management | PASS | PASS | PASS | PASS | **PASS** |

**Legend:**
- **PASS**: Tenancy correctly enforced (uses `account_id` or join-based RLS).
- **FAIL**: Tenancy failure (missing `account_id` on insert, or using legacy `user_id` filter).
- **UNKNOWN**: CRUD action not discovered or implemented.
- **N/A**: Action not applicable to this feature.

**Key Observations:**
- Core communication (Inbox, WhatsApp Config) and membership logic are mostly tenancy-correct.
- **Operational features (Contacts, Automations, Flows, Broadcasts)** are heavily broken due to missing `account_id` on creation and legacy `user_id` filters on reads/updates.
- **Signup/Onboarding** is PASS, but the resulting user experience for a team will be broken as soon as they try to create shared resources.

## Phase 5 Findings

### Risk Assessment

Features are ranked by the severity of their tenancy breakage and the impact on the core business value.

| Feature | Risk Level | Rationale |
| --- | --- | --- |
| **Automations & Flows** | **CRITICAL** | Core automation engine. API creation paths miss `account_id` (causes 500s). Teammates cannot manage shared logic due to `user_id` filters. |
| **Contacts** | **CRITICAL** | Foundation of the CRM. Bulk import misses `account_id` (crashes). Duplicate contacts will be created due to legacy filters missing teammate's data. |
| **Broadcasts** | **HIGH** | Marketing engine. Creation and send paths miss `account_id`. Campaigns will fail to start or record recipients. |
| **Templates & Tags** | **HIGH** | Essential shared resources. Teammates cannot see or use each other's tags/templates, breaking the collaboration model. |
| **Deals & Pipelines** | **MEDIUM** | Sales tracking. Pipelines work, but individual deal creation misses `account_id` and will crash. |
| **Notes** | **MEDIUM** | Collaboration. Teammates can see notes (RLS), but cannot create them due to missing `account_id`. |
| **Inbox** | **LOW** | Messaging. Mostly tenancy-correct as it relies on RLS and joined tables. High confidence in real-time isolation. |
| **Auth & Membership** | **LOW** | Infrastructure. Correctly creates accounts and manages memberships via secure RPCs. |

### Top Tenancy-Risk Files
1. `src/app/api/automations/route.ts` (Broken Create)
2. `src/app/api/flows/route.ts` (Broken Create)
3. `src/hooks/use-broadcast-sending.ts` (Broken Create/Filter)
4. `src/components/contacts/import-modal.tsx` (Broken Bulk Insert)
5. `src/components/pipelines/deal-form.tsx` (Broken Create)
6. `src/components/settings/tag-manager.tsx` (Broken Create/Filter)
7. `src/components/settings/template-manager.tsx` (Broken Filter)
8. `src/app/(dashboard)/broadcasts/new/page.tsx` (Broken Draft)
9. `src/components/contacts/contact-detail-view.tsx` (Broken Note Create)10. `src/app/api/automations/[id]/route.ts` (Broken Filter)
```

## Phase 6 Findings

### Manual QA Checklist

This checklist provides a standard set of tests to verify tenancy isolation for any feature.

#### Global Tenancy Verification (Apply to ALL features)
- [ ] **Create**: Verify resource is created with correct `account_id` and `user_id`.
- [ ] **Multi-user View**: Verify teammate in the same account can see the resource.
- [ ] **Multi-user Edit**: Verify teammate with 'agent' or 'admin' role can edit the resource.
- [ ] **Isolation**: Verify a user in a DIFFERENT account CANNOT see or edit the resource.
- [ ] **DB Check**: Run `SELECT account_id, user_id FROM <table> WHERE id = ...` and verify `account_id` matches the tenant.

#### Feature-Specific Tests

**1. Contacts & Tags**
- [ ] Import CSV: Verify all imported contacts carry the correct `account_id`.
- [ ] Tag Create: Verify teammate can see and apply a newly created tag.
- [ ] Search: Verify searching for a teammate's contact works.

**2. Automations & Flows**
- [ ] Automation Create: Verify the API call returns 201 and the row has `account_id`.
- [ ] Flow Editor: Verify teammate can open and modify a flow built by another user.
- [ ] Execution: Verify a teammate's incoming message correctly triggers an automation.

**3. Broadcasts**
- [ ] Draft Save: Verify teammate can see and resume a draft created by another user.
- [ ] Send: Verify `broadcast_recipients` are created with correct `account_id`.
- [ ] Template Sync: Verify syncing templates as one user makes them available to all teammates.

**4. Pipelines & Deals**
- [ ] Deal Create: Verify creating a deal from a contact detail sheet works (currently predicted to fail).
- [ ] Pipeline Move: Verify teammate can drag-and-drop a deal between stages.

**5. Inbox**
- [ ] Realtime: Verify two teammates viewing the same thread both see incoming/outgoing messages instantly.
- [ ] Assignment: Verify assigning a conversation to a teammate correctly updates their view.