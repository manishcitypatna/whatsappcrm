# Audit Decisions Log

## Audit Recovery (2026-06-05)

### Current Phase
Phase 3 - Tenancy Query Audit

### Verified Completed Phases
- Phase 1: Database Tenancy Audit (Verified migration 017 findings in feature_test_report.md against DB source)
- Phase 2: Feature Discovery (Verified file structure and feature inventory)

### Invalid Completed Phases
- Phase 3: Tenancy Query Audit (Marked complete in worklist, but report indicates only initial sampling was done and full coverage is required)

### Remaining Phases
- Phase 3: Tenancy Query Audit (RESUMING)
- Phase 4: CRUD Coverage Audit
- Phase 5: Risk Assessment
- Phase 6: Manual QA Planning
- Phase 7: Final Audit Summary

### Remaining Tasks
- Full repository search for query patterns (.insert, .update, etc.)
- Audit all tenancy-sensitive operations for all features
- Classify PASS/FAIL/REVIEW REQUIRED for every feature
- Build CRUD matrix
- Perform Risk Assessment
- Create QA Checklist
- Generate Final Summary

---

## 2026-06-05 00:00

### Remediation Phase — Templates Module
FAIL

### Status
REMEDIAL ACTION REQUIRED

### Affected Files
- `src/app/api/whatsapp/templates/sync/route.ts`
- `src/app/api/whatsapp/templates/submit/route.ts`
- `src/app/api/whatsapp/templates/[id]/route.ts`
- `src/components/settings/template-manager.tsx`
- `src/components/inbox/template-picker.tsx`
- `src/components/broadcasts/step1-choose-template.tsx`

### Root Cause
1.  **Missing `account_id` on Inserts**: Several routes (Sync, Submit) are missing `account_id` in their `insert()` payloads, causing database crashes due to Migration 017's NOT NULL constraint.
2.  **Legacy `user_id` Filters**: Read and list paths use `.eq('user_id', ...)` or omit account filters entirely, which prevents teammates from seeing or managing shared templates.
3.  **Conflict Targets**: Upsert logic in `submit/route.ts` still uses `user_id` in its conflict target, which will eventually cause shadowing issues once the unique index is updated.

### Proposed Fixes
1.  **API Routes**: Resolve `accountId` via `profiles` (or `getCurrentAccount()` if available) and update all `.insert()`, `.upsert()`, and `.select()` calls to include `account_id`.
2.  **UI Components**: Update `useAuth` usage to retrieve `accountId` and filter template lists by account rather than user.
3.  **Sync Logic**: Ensure that synced templates are correctly attributed to the account and that lookups for existing templates are account-scoped.

### Risk Level
**HIGH** — Template synchronization and submission are currently broken for any account with multiple users. Teammates cannot collaborate on message templates.



