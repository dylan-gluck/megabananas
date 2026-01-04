---
description: Refine a task, find all relevant context and add to the backlog
argument-hint: [task-description]
allowed-tools: Bash(codebase-map:*), Bash(backlog:*), Bash(git:*), Task(Plan), Task(project-manager-backlog), Task(Explore)
---

Refine the task described below.

## Task

$ARGUMENTS

## Codebase Indexed

!`codebase-map scan`

## Workflow

### 1. Understand

Read the task carefully. Think step-by-step about the objective and requirements.

### 2. Explore

Use `codebase-map` cli to visualize the index and find relevant context:

- `codebase-map format -f tree` — directory structure
- `codebase-map format -f markdown` — files with functions/constants
- `codebase-map format -f dsl` — compact signatures with dependencies
- `codebase-map format -f graph` — dependency graph + signatures
- `codebase-map list --deps` — files with most dependencies
- `codebase-map list --entries` — entry points (no dependents)
- `codebase-map list --leaves` — leaf files (no dependencies)

Use `--include` or `--exclude` patterns to filter results (e.g., `--include "components/**"`).

Use Task tool with `subagent_type=Explore` for deeper investigation of specific files or patterns.

### 3. Design Implementation Plan

**CRITICAL:** Use the `Task` tool with `subagent_type=Plan` to create a detailed implementation plan.

Provide the Plan agent with:
- The task objective from step 1
- All relevant context discovered in step 2 (file paths, functions, patterns, dependencies)
- Any architectural constraints or patterns observed in the codebase

The Plan agent will return:
- Step-by-step implementation plan with specific file paths and line numbers
- Critical files that need modification
- Architectural considerations and trade-offs
- Technical dependencies between steps

**Preserve the full plan output** — do not summarize or condense. This detailed context is essential for the backlog task.

### 4. Create Backlog Item

Use the `Task` tool with `subagent_type=project-manager-backlog` to create the backlog task.

Provide the backlog agent with:
- The task title and description from step 1
- The **complete implementation plan** from step 3 (do NOT summarize)
- All technical context: file paths, line numbers, functions, dependencies
- Acceptance criteria derived from the plan steps

**IMPORTANT:** Pass the full Plan agent output to preserve all architectural context. The backlog agent will structure it properly into the task format without losing critical details.

Example prompt to backlog agent:
```
Create a task for: [task objective]

Implementation Plan (from Plan agent):
[paste complete plan output here]

Technical Context:
- Key files: [list from exploration]
- Dependencies: [any task dependencies]
- Priority: [high/medium/low]
```

**Other useful commands:**
- `backlog task list --status <status>` — list tasks by status
- `backlog search "<query>"` — search existing tasks/docs
- `backlog board` — kanban view
