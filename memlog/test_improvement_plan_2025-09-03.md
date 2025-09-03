# Test Coverage Improvement Plan
**Date:** 2025-09-03  
**Time:** 22:42:00 PST
**Current Coverage:** 43.66%
**Target:** 60%

## 📋 Step-by-Step Plan

### 1. Quick Wins (High Impact, Low Effort)
- [ ] Fix the 2 remaining API test failures
- [ ] Fix bot protection mock to count as covered
- [ ] Fix validateEnv test failures (2 remaining)

### 2. Zero Coverage Modules
- [ ] Add basic bot protection tests (currently 0%)
- [ ] Fix queue manager mock recognition (currently 0%)
- [ ] Fix database/redis mock recognition (currently 0%)

### 3. Test Infrastructure
- [ ] Fix CSRF middleware properly
- [ ] Complete Spotify auth tests
- [ ] Fix analytics service tests

## 🎯 Execution Order

### Phase 1: Fix Existing Test Failures (Est: 30 min)
1. Fix 2 API test failures (follow history, job cancellation)
2. Fix 2 validateEnv test failures
3. Fix Spotify auth remaining tests

### Phase 2: Add Missing Coverage (Est: 45 min)
1. Add basic bot protection tests
2. Ensure database/redis mocks count as covered
3. Add minimal analytics tests

### Phase 3: Infrastructure Fixes (Est: 30 min)
1. Fix CSRF middleware implementation
2. Fix bot protection table initialization
3. Refactor large files (admin.routes.js)

## 📊 Expected Coverage Gains
- Fixing API tests: +2%
- Bot protection tests: +3%
- Database/Redis recognition: +5%
- Analytics tests: +2%
- Other fixes: +4%
**Total Expected:** +16% → 59.66% (nearly 60%)

## ✅ SOP Compliance Checklist
- [ ] Test each change with running server
- [ ] Commit after each module completion
- [ ] Update memlog continuously
- [ ] Keep servers running for testing
- [ ] Push to remote regularly

---
*Starting execution now*