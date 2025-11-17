# File Tracker Diff Rules and Structure

## Overview

This document details the three-state file tracking system that powers the diff viewer in the VSCode extension. The system tracks file changes across three distinct states to provide meaningful diff views for AI insights and version comparison.

---

## The Three States

### 1. `previousSaved`
**What it tracks:** The content from the save **before** the current one.

**When it changes:**
- When a file is saved (AND there was unsaved content before the save)
- Value transitions: `currentSaved` → `previousSaved`

**Initial value:** `null` or empty when file is first opened/created

### 2. `currentSaved`
**What it tracks:** The content from the **most recent save**.

**When it changes:**
- When a file is saved (AND there was unsaved content before the save)
- Value transitions: `liveUnsaved` (or new content) → `currentSaved`

**Initial value:** The current saved content on disk when file is first opened

**CRITICAL RULE:** `currentSaved` is ONLY updated by `transitionOnSave()` method. FileSystemWatcher events must NEVER overwrite this value (they preserve existing value).

### 3. `liveUnsaved`
**What it tracks:** Live content being edited **right now** (unsaved changes).

**When it changes:**
- Immediately when user types/edits in the editor
- Updated on every `onDidChangeTextDocument` event when `document.isDirty === true`

**When it clears:**
- When file is saved → transitions to `currentSaved`, then `liveUnsaved` becomes `null`
- When file is closed (if not dirty)

**Initial value:** `null` when file is first opened

---

## The Two Diff Views

### PREV View
**What it shows:** Diff between `previousSaved` vs `currentSaved`

**Purpose:** Shows changes from the last save to the current save (historical comparison)

**When it's useful:**
- After saving, to see what changed in the most recent save
- To compare the two most recent saved versions
- Empty until first save happens

**Display rules:**
- Lines in `previousSaved` only → shown as deleted (red/minus)
- Lines in `currentSaved` only → shown as added (green/plus)
- Identical lines → shown as unchanged

### NOW View
**What it shows:** Diff between `currentSaved` vs `liveUnsaved`

**Purpose:** Shows current unsaved changes being edited right now

**When it's useful:**
- While typing, to see what's changed since last save
- To understand current work-in-progress edits
- Empty when no unsaved changes exist

**Display rules:**
- Lines in `currentSaved` only → shown as deleted (red/minus)
- Lines in `liveUnsaved` only → shown as added (green/plus)
- Identical lines → shown as unchanged
- If `liveUnsaved` is `null`, uses `currentSaved` (shows no diff)

---

## State Transition Rules

### Rule 1: Opening a File
```
previousSaved = null (or from embedded data)
currentSaved = content from disk
liveUnsaved = null
```

### Rule 2: User Starts Typing
```
previousSaved = unchanged
currentSaved = unchanged
liveUnsaved = new content being typed
```

**IMPORTANT:** First character typed goes to `liveUnsaved`, NOT `currentSaved`.

### Rule 3: User Saves File
**Condition:** `hadUnsavedContent === true` (liveUnsaved !== null before save)

```
previousSaved = old currentSaved value
currentSaved = content from liveUnsaved (or new saved content)
liveUnsaved = null
```

**Atomic transition:** All three values update simultaneously when save event detected.

### Rule 4: User Continues Typing After Save
```
previousSaved = unchanged
currentSaved = unchanged
liveUnsaved = new content being typed
```

### Rule 5: User Closes File (Not Dirty)
```
liveUnsaved = null (cleared from tracking)
previousSaved and currentSaved remain in cache
```

### Rule 6: FileSystemWatcher Detects Change
```
previousSaved = PRESERVE existing value
currentSaved = PRESERVE existing value
liveUnsaved = PRESERVE existing value
```

**CRITICAL:** FileSystemWatcher is ONLY for detecting new files, NOT for updating content. All content updates happen through `transitionOnSave()` method.

---

## Complete Example Walkthrough

### Step 1: Empty File Opened
**User Action:** Open a new empty file

**State:**
```
previousSaved = null
currentSaved = "" (empty)
liveUnsaved = null
```

**PREV View:** Empty (no diff to show)

**NOW View:** Empty (no diff to show)

**Expected Behavior:** ✓ Both views show no changes

---

### Step 2: User Types "Hello World"
**User Action:** Type "Hello World" in the editor

**State:**
```
previousSaved = null
currentSaved = "" (empty)
liveUnsaved = "Hello World"
```

**PREV View:** Empty (previousSaved and currentSaved both empty)

**NOW View:**
```diff
+ Hello World
```

**Expected Behavior:** ✓ NOW view shows the new line as added (green)

---

### Step 3: First Save
**User Action:** Save the file (Cmd+S / Ctrl+S)

**State Transition:**
```
previousSaved = "" (old currentSaved)
currentSaved = "Hello World" (from liveUnsaved)
liveUnsaved = null (cleared)
```

**PREV View:**
```diff
+ Hello World
```

**NOW View:** Empty (currentSaved === liveUnsaved after save)

**Expected Behavior:** ✓ Content moves from NOW to PREV, NOW becomes empty

---

### Step 4: User Types "This is version 1"
**User Action:** Type a new line "This is version 1"

**State:**
```
previousSaved = "" (unchanged)
currentSaved = "Hello World" (unchanged)
liveUnsaved = "Hello World\nThis is version 1"
```

**PREV View:**
```diff
+ Hello World
```
(Still shows diff between "" and "Hello World")

**NOW View:**
```diff
  Hello World
+ This is version 1
```

**Expected Behavior:** ✓ PREV unchanged, NOW shows new unsaved line

**CRITICAL CHECK:** `previousSaved` and `currentSaved` must NOT change when typing! Only `liveUnsaved` changes.

---

### Step 5: Second Save
**User Action:** Save the file again

**State Transition:**
```
previousSaved = "Hello World" (old currentSaved)
currentSaved = "Hello World\nThis is version 1" (from liveUnsaved)
liveUnsaved = null (cleared)
```

**PREV View:**
```diff
  Hello World
+ This is version 1
```
(Shows diff between "Hello World" and "Hello World\nThis is version 1")

**NOW View:** Empty (currentSaved === liveUnsaved after save)

**Expected Behavior:** ✓ Both lines now visible in PREV, NOW becomes empty

---

### Step 6: User Types "This is version 2"
**User Action:** Type a third line "This is version 2"

**State:**
```
previousSaved = "Hello World" (unchanged)
currentSaved = "Hello World\nThis is version 1" (unchanged)
liveUnsaved = "Hello World\nThis is version 1\nThis is version 2"
```

**PREV View:**
```diff
  Hello World
+ This is version 1
```
(Still shows diff between "Hello World" and "Hello World\nThis is version 1")

**NOW View:**
```diff
  Hello World
  This is version 1
+ This is version 2
```

**Expected Behavior:** ✓ PREV unchanged, NOW shows newest unsaved line

**CRITICAL CHECK:** `previousSaved` still contains "Hello World", `currentSaved` still contains both previous lines. They do NOT change when typing!

---

## AI Insights Correlation Rules

### When to Trigger AI Insights

1. **On Save Events:**
   - Compare `previousSaved` vs `currentSaved` to analyze what changed in the save
   - Use PREV view diff data for context

2. **On Unsaved Changes:**
   - Compare `currentSaved` vs `liveUnsaved` to understand current work
   - Use NOW view diff data for real-time context

3. **For Historical Context:**
   - Track multiple saves over time by maintaining save history
   - Each save creates a snapshot: previousSaved → currentSaved → new save

### Data to Send to AI

**For Save Analysis:**
```javascript
{
  previousSaved: string,
  currentSaved: string,
  diffType: "PREV",
  changes: [/* line-by-line diff */]
}
```

**For Live Analysis:**
```javascript
{
  currentSaved: string,
  liveUnsaved: string,
  diffType: "NOW",
  changes: [/* line-by-line diff */]
}
```

---

## Verification Checklist

Use this checklist to verify the system is working correctly:

- [ ] Opening a file: Both views empty initially
- [ ] First character typed: Goes to `liveUnsaved`, NOT `currentSaved`
- [ ] Typing: Only `liveUnsaved` changes, other states unchanged
- [ ] NOW view: Shows diff while typing (green for new lines)
- [ ] First save: Content moves from NOW to PREV
- [ ] After save: NOW view becomes empty
- [ ] PREV view: Shows diff between last two saves
- [ ] Second typing session: PREV remains unchanged
- [ ] FileSystemWatcher: Does NOT overwrite `currentSaved` or `previousSaved`
- [ ] State transitions: Atomic and consistent

---

## Common Bugs to Avoid

### Bug 1: FileSystemWatcher Overwrites currentSaved
**Symptom:** PREV view shows no diff after typing starts

**Cause:** `_updateFileInCache()` sets `currentSaved = textContent` instead of preserving existing value

**Fix:** Always use `currentSaved: existingFile?.currentSaved || textContent`

### Bug 2: First Character Goes to currentSaved
**Symptom:** First character appears as saved before any save

**Cause:** First `isDirty=false` message treated as save event

**Fix:** Only transition states when `hadUnsavedContent === true`

### Bug 3: PREV View Overwrites on Save
**Symptom:** PREV view briefly shows correct diff then disappears

**Cause:** FileWatcher's `onDidChange` fires after save and overwrites `previousSaved`

**Fix:** Preserve `previousSaved: existingFile?.previousSaved` in `_updateFileInCache()`

### Bug 4: HTML Refresh Closes Viewer
**Symptom:** File viewer closes when saving

**Cause:** File change event triggers full HTML refresh

**Fix:** Remove HTML refresh on file changes, use message-based updates only

---

## Implementation Notes

### Backend (fileTrackerService.ts)
- Maintains `_fileCache` Map with all three states
- `updateLiveContent()` updates only `liveUnsaved`
- `transitionOnSave()` performs atomic state transition
- `_updateFileInCache()` preserves all existing states

### Frontend (fileTrackerInit.ts)
- Maintains `window.fileVersionsMap` mirror of backend
- Listens for `documentContent` messages
- Transitions states based on `isDirty` flag and `hadUnsavedContent`
- Refreshes diff viewer on content updates

### Diff Viewer (diffViewer.ts)
- `showPrevView()` generates diff from `previousSaved` vs `currentSaved`
- `showNowView()` generates diff from `currentSaved` vs `liveUnsaved`
- `refreshIfActive()` updates view when content changes

---

## Summary

The three-state system provides a complete picture of file evolution:
- **previousSaved** = where we were
- **currentSaved** = where we saved
- **liveUnsaved** = where we're going

The two views give different perspectives:
- **PREV** = historical (saved to saved)
- **NOW** = current (saved to unsaved)

Together, they enable powerful AI insights by providing complete context about code changes over time.
