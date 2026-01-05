---
id: task-14
title: Refactor right sidebar collapse state
status: To Do
assignee: []
created_date: '2026-01-05 05:09'
labels:
  - refactor
  - ui
  - sidebar
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refactor the global layout and right sidebar collapse behavior. The Quick Actions menu provides no real value. The sidebar should be collapsed by default and auto-open only when an action context is triggered (e.g., asset details, new character form). This improves UX by reducing visual clutter and making the sidebar behavior more intentional.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Right sidebar is collapsed by default on app load
- [ ] #2 Quick Actions empty state component is removed entirely
- [ ] #3 Sidebar auto-opens when action context is set (new character, asset details, etc)
- [ ] #4 Sidebar auto-closes when action context is cleared (cancel, complete, X button)
- [ ] #5 rightSidebarOpen is no longer persisted to localStorage
- [ ] #6 Right sidebar width increased from 320px to 400px when expanded
- [ ] #7 Toggle button in workspace header only visible when action context exists
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
### Overview
Refactor the right sidebar to be collapsed by default, remove the pointless Quick Actions empty state, and auto-open/close based on action context.

### Step 1: Update Store (lib/store.ts)

1. **Line 192**: Change default value
   ```typescript
   // Before
   rightSidebarOpen: true,
   
   // After
   rightSidebarOpen: false,
   ```

2. **Line 291**: Update clearActionContext to also close sidebar
   ```typescript
   // Before
   clearActionContext: () => set({ actionContext: { type: "none" } }),
   
   // After
   clearActionContext: () => set({ actionContext: { type: "none" }, rightSidebarOpen: false }),
   ```

3. **Lines 297-303**: Remove rightSidebarOpen from persisted state
   ```typescript
   partialize: (state) => ({
     currentProjectId: state.currentProjectId,
     tabs: state.tabs,
     activeTabId: state.activeTabId,
     leftSidebarOpen: state.leftSidebarOpen,
     // rightSidebarOpen removed - now derived from actionContext
   }),
   ```

### Step 2: Update Right Sidebar Component (components/ide/right-sidebar.tsx)

1. **Lines 147-236**: Delete the entire EmptyActionState function

2. **Line 143 in ActionContextContent**: Update the default case
   ```typescript
   // Before
   default:
     return <EmptyActionState hasProject={!!currentProject} />;
   
   // After
   default:
     return null; // Sidebar should be closed when type is "none"
   ```

3. **Line 3**: Remove Wand2 from imports (no longer used)

4. **Lines 77-79**: Update default icon case in ActionContextIcon
   ```typescript
   default:
     return null;
   ```

5. **Lines 102-103**: Update default title case in ActionContextTitle
   ```typescript
   default:
     return "";
   ```

### Step 3: Update App Layout Width (components/ide/app-layout.tsx)

**Line 12**: Increase sidebar width
```typescript
// Before
const RIGHT_SIDEBAR_WIDTH = 320;

// After
const RIGHT_SIDEBAR_WIDTH = 400;
```

### Step 4: Handle Toggle Button (components/ide/workspace.tsx)

**Lines 104-113**: Make toggle button context-aware - only show when context exists
```typescript
{!rightSidebarOpen && actionContext.type !== "none" && (
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 flex-shrink-0"
    onClick={toggleRightSidebar}
  >
    <PanelRight className="h-4 w-4" />
  </Button>
)}
```
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Key files:
- lib/store.ts (lines 143-306): Zustand store with rightSidebarOpen state and clearActionContext
- components/ide/right-sidebar.tsx (lines 1-238): Contains EmptyActionState to remove
- components/ide/app-layout.tsx (lines 1-68): RIGHT_SIDEBAR_WIDTH constant
- components/ide/workspace.tsx (lines 104-113): Toggle button logic

Test scenarios:
1. App Load: Right sidebar should be closed
2. Click "New Character" in left sidebar: Sidebar opens with form
3. Click "Cancel" in form: Sidebar closes
4. Complete form successfully: Sidebar closes
5. Click X button in sidebar header: Sidebar closes
6. Switch projects: Sidebar closes
7. Asset thumbnail context menu -> "View Details": Sidebar opens with asset metadata
8. Close asset metadata panel: Sidebar closes
<!-- SECTION:NOTES:END -->
