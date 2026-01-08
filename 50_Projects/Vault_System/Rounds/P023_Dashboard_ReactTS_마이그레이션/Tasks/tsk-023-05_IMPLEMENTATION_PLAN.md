# tsk-023-05 Implementation Plan

## Status: Ready for Implementation

### Completed (Phase 1-3)
✅ **Type System Updates**
- Added new fields to `Task` interface: `links`, `validates`, `conditions_3y`, `_path`, `parent_id`, `outgoing_relations`
- Updated `TaskUpdatePayload` with `start_date` and `links`
- File: `src/types/task.ts`

✅ **API & Mutations**
- Added `taskApi.deleteTask()` endpoint
- Created `useDeleteTask()` mutation with proper cache invalidation
- File: `src/features/tasks/api.ts`, `src/features/tasks/queries.ts`

✅ **Build Test**
- Build passes: ✓ built in 1.45s
- No TypeScript errors
- Bundle sizes: 368KB main, 274KB index

### Codex Review Findings (Addressed)

**Critical Issues Fixed:**
1. ✅ Type system now includes all relation fields
2. ✅ Delete mutation includes cache invalidation and optimistic updates
3. ✅ Build validation passes

**Remaining Scope (Simplified):**
- Start Date field (with ISO date handling)
- Task Type Chips (fully wired with mutation)
- Delete button (already has mutation, need UI)
- Header improvements (share link, fullscreen with localStorage)
- Notes markdown (with DOMPurify sanitization)
- Relations section (read-only display)
- ❌ Links section (DEFERRED - needs API endpoints)
- ❌ Attachments (DEFERRED - needs extensive testing)

### Implementation Strategy

**File Structure:**
```
src/features/tasks/components/TaskDrawer/
├── index.tsx              # Main component (refactor)
├── TaskHeader.tsx         # NEW: Header with share/fullscreen
├── TaskTypeChips.tsx      # NEW: Type selection chips
├── RelationsSection.tsx   # NEW: Display relations
└── NotesSection.tsx       # NEW: Markdown rendering
```

**Utilities:**
```
src/utils/
└── markdown.ts            # NEW: Sanitized markdown renderer
```

### TaskDrawer Enhancements

#### 1. Start Date Field (+10 lines)
```tsx
<label className="text-zinc-500 py-1">Start Date</label>
<input
  type="date"
  value={task.start_date || ''}
  onChange={(e) => handleUpdate('start_date', e.target.value || null)}
  className="..."
/>
```
- Location: Before Due Date (line 153)
- ISO date handling with null fallback

#### 2. Task Type Chips (+40 lines, new component)
```tsx
// TaskTypeChips.tsx
- Pulls types from dashboardData.constants.task_types
- Visual chips (dev, bug, strategy, research, ops, meeting)
- Click handler: handleUpdate('type', value)
- Active state styling
```
- Location: Below Title (after line 93)

#### 3. Delete Button (+15 lines)
```tsx
const { mutate: deleteTask } = useDeleteTask();
const handleDelete = () => {
  if (confirm(`Delete task ${taskId}?`)) {
    deleteTask(taskId, { onSuccess: () => onClose() });
  }
};
// Button in Footer
<button onClick={handleDelete} className="text-red-600">Delete</button>
```
- Location: Footer left side (line 212)

#### 4. Header Component (+60 lines, new component)
```tsx
// TaskHeader.tsx
- Share link: Copy `${origin}/kanban?task=${taskId}`
- Fullscreen toggle: localStorage.getItem('taskDrawer_expanded')
- Keyboard: Shift+Cmd+F (scoped to drawer)
- Icons: 🔗 (share), ↗/↙ (expand/collapse)
```
- Replaces: Lines 66-79

#### 5. Notes Markdown (+50 lines)
```tsx
// utils/markdown.ts
- Port legacy renderMarkdown
- Add DOMPurify sanitization (npm install dompurify @types/dompurify)
- Render in NotesSection with dangerouslySetInnerHTML
```
- Updates: Lines 176-199

#### 6. Relations Section (+60 lines, new component)
```tsx
// RelationsSection.tsx
- Display: Project, Validates, Conditions (from task fields)
- Read-only for now (navigation hooks TBD)
- Replaces placeholder: Lines 201-206
```

### Security Measures

1. **Markdown Sanitization:**
   ```bash
   npm install dompurify @types/dompurify
   ```
   - DOMPurify.sanitize() before innerHTML
   - Prevent XSS from task.notes

2. **Date Validation:**
   - ISO 8601 format only
   - Null handling for empty inputs

3. **Keyboard Shortcuts:**
   - Scoped event listeners (cleanup on unmount)
   - Cross-platform fallback (Meta vs Ctrl)

### Success Criteria

- [ ] All 6 features implemented
- [ ] Build passes (npm run build)
- [ ] No TypeScript errors
- [ ] Kanban D&D still works
- [ ] Task edit/save works with new fields
- [ ] Codex final review passes

### Next Steps

1. User approval for implementation scope
2. Implement TaskDrawer changes (batch edit)
3. Create new components (Header, TypeChips, Relations, NotesSection)
4. Add DOMPurify dependency
5. Final build test
6. Codex code review

### Files Modified

- ✅ `src/types/task.ts` (types extended)
- ✅ `src/features/tasks/api.ts` (deleteTask added)
- ✅ `src/features/tasks/queries.ts` (useDeleteTask added)
- ⏳ `src/features/tasks/components/TaskDrawer/index.tsx` (pending refactor)
- ⏳ `src/features/tasks/components/TaskDrawer/TaskHeader.tsx` (new)
- ⏳ `src/features/tasks/components/TaskDrawer/TaskTypeChips.tsx` (new)
- ⏳ `src/features/tasks/components/TaskDrawer/RelationsSection.tsx` (new)
- ⏳ `src/features/tasks/components/TaskDrawer/NotesSection.tsx` (new)
- ⏳ `src/utils/markdown.ts` (new)
- ⏳ `package.json` (add dompurify)

### Estimated Scope

- Lines added: ~250 (vs original target of ~500)
- New files: 5
- Time estimate: 2-3 hours
- Risk: Low (build already passes, types validated)
