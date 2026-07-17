# WhatsApp CRM Audit Worklist

## Phase 1 - Database Tenancy Audit
Status: [x] Complete

Tasks
- [x] Discover account-scoped tables
- [x] Discover account_role usage + role hierarchy
- [x] Discover account_id usage patterns
- [x] Discover RLS policies
- [x] Discover tenancy helper functions
- [x] Record findings

## Phase 2 - Feature Discovery
Status: [x] Complete

Tasks
- [x] Discover pages
- [x] Discover components
- [x] Discover API routes
- [x] Build feature inventory
- [x] Record findings

## Phase 3 - Tenancy Query Audit
Status: [x] Complete

Tasks
- [x] Audit inserts
- [x] Audit updates
- [x] Audit deletes
- [x] Audit user_id filters
- [x] Audit account_id filters
- [x] Determine PASS/FAIL/REVIEW REQUIRED per feature
- [x] Record findings

## Phase 4 - CRUD Coverage Audit
Status: [x] Complete

Tasks
- [x] Create CRUD matrix per major feature
- [x] Mark PASS/FAIL/UNKNOWN per CRUD action
- [x] Record findings

## Phase 5 - Risk Assessment
Status: [x] Complete

Tasks
- [x] Rank features by likely tenancy breakage
- [x] Record findings

## Phase 6 - Manual QA Planning
Status: [x] Complete

Tasks
- [x] Generate feature-by-feature QA checklist
- [x] Record findings

## Phase 7 - Final Audit Summary
Status: [x] Complete

Tasks
- [x] Compute totals (features, PASS/FAIL/REVIEW)
- [x] Identify top tenancy-risk files
- [x] Produce recommended repair / test order
- [x] Record findings

