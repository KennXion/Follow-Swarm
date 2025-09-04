# SOP PRE-FLIGHT CHECKLIST
## ⚠️ MANDATORY - DO NOT SKIP ANY ITEM

### 🔴 BEFORE STARTING ANY TASK:

#### 1. Environment Check
- [ ] Check what servers are currently running: `ps aux | grep node`
- [ ] Check port status: `lsof -i :3001 -i :5173`
- [ ] Check git status: `git status`
- [ ] Check last memlog entry timestamp

#### 2. Planning
- [ ] Break task into numbered steps (1, 2, 3...)
- [ ] Write plan in memlog with timestamp
- [ ] Create TodoWrite entries for each step
- [ ] Identify files that will be modified

#### 3. File Safety
- [ ] Create .bak for ANY file before modification
- [ ] Check current line count of files to modify: `wc -l <file>`
- [ ] Plan refactoring if any file exceeds 250 lines (buffer before 300)

### 🟡 DURING THE TASK:

#### 4. Continuous Updates
- [ ] Update memlog after EACH step with timestamp
- [ ] Update TodoWrite status as steps complete
- [ ] Check file line count after EACH edit
- [ ] Test after EACH significant change

#### 5. Server Management
- [ ] KILL existing servers before starting new ones
- [ ] Document which processes were killed
- [ ] Start servers in correct order: backend → frontend → tunnel
- [ ] Verify tunnel uses: strong-deer-grow.loca.lt

### 🟢 AFTER COMPLETING TASK:

#### 6. Validation
- [ ] All servers running properly
- [ ] Health check backend: `curl http://localhost:3001/health`
- [ ] Check frontend: `curl http://localhost:5173`
- [ ] Check tunnel: `curl https://strong-deer-grow.loca.lt/health`
- [ ] All modified files under 300 lines

#### 7. Documentation & Git
- [ ] Final memlog entry with timestamp and summary
- [ ] Git add all changes
- [ ] Git commit with detailed message
- [ ] Git push to remote
- [ ] Verify push succeeded

### 🚫 VIOLATION PROTOCOL:
If ANY item is skipped or fails:
1. STOP immediately
2. Document the violation in memlog
3. Fix the violation before proceeding
4. Re-run the entire checklist

### 📝 CHECKLIST USAGE:
- Copy relevant sections into response
- Check off items as completed
- Show the checklist status in responses
- If user asks "why are you doing X?" → point to checklist

---
**Last Updated**: 2025-09-03
**Purpose**: Ensure 100% SOP compliance on every task
**Result**: No more reminders needed from user