# STATUS.md

Version: 0.1.0

Status: Active Development

Last Updated: 2026-07-18

---

# Current Objective

Build a production-ready desktop application that acts as Mission Control for AI coding agents.

Current focus is **MVP only**.

Do not implement future roadmap features until the MVP is complete.

---

# Current Milestone

Milestone 2 — Core Infrastructure

Status:

🟡 In Progress

Goal:

Build the event-driven core: Event Bus, Timeline Store, Notification Engine, Adapter SDK, IPC, Logging, and Settings Store.

---

# Current Task

Implement Adapter SDK.

---

# Roadmap Progress

## Milestone 1 — Foundation

- [x] Initialize monorepo
- [x] Configure package manager
- [x] Setup Tauri
- [x] Setup React
- [x] Setup TypeScript
- [x] Setup Tailwind
- [x] Setup Framer Motion
- [x] Setup Rust backend
- [x] Setup SQLite
- [x] Setup linting
- [x] Setup formatting
- [x] Setup testing
- [x] Create shared packages
- [x] Verify production build

Status

100%

---

## Milestone 2 — Core Infrastructure

- [x] Event Bus
- [x] Timeline Store
- [x] Notification Engine
- [ ] Adapter SDK
- [ ] IPC Layer
- [ ] Logging
- [ ] Settings Store

Status

~43%

---

## Milestone 3 — Desktop UI

- [ ] Floating Widget
- [ ] Activity Ring
- [ ] Expand Animation
- [ ] Timeline Panel
- [ ] Task Cards
- [ ] Quick Actions
- [ ] Settings

Status

0%

---

## Milestone 4 — Cursor Integration

- [ ] Cursor Adapter
- [ ] Running Task Detection
- [ ] Completion Detection
- [ ] Open Conversation
- [ ] Send Message
- [ ] Queue Message
- [ ] Stop Task

Status

0%

---

## Milestone 5 — Claude Code

- [ ] Claude Adapter
- [ ] Shared Event Mapping

Status

0%

---

## Milestone 6 — Codex CLI

- [ ] Codex Adapter

Status

0%

---

## Milestone 7 — Polish

- [ ] Accessibility
- [ ] Performance
- [ ] Error Handling
- [ ] Packaging
- [ ] Documentation Review
- [ ] Final Testing

Status

0%

---

# Current Architecture Decisions

## Accepted

- Tauri v2
- Rust
- React
- TypeScript
- Zustand
- SQLite (rusqlite in Tauri backend)
- Tailwind CSS v4
- Framer Motion
- npm workspaces

---

## Pending

None

---

# Manual Actions

None required for Milestone 1.

Prerequisites already used during foundation setup:

- Node 20+ (via nvm)
- Rust via rustup
- Xcode Command Line Tools

---

# Known Issues

None.

---

# Technical Debt

Intentional and tracked:

- `@mission-control/database` is a TypeScript stub; SQLite lives in `apps/desktop/src-tauri` until Milestone 2 IPC lands.
- Packages `core`, `adapters`, `ipc` are empty barrels until Milestone 2+.

---

# Session Notes

Newest entries first.

---

## 2026-07-18 (Notification Engine)

Summary

- Added calm `NotificationEngine` in `@mission-control/core`.
- Notifies only on waiting / completed / failed; dismisses on conversation.opened or cancel.
- High-priority sorting for waiting/failed; manual `dismiss(taskId)` for badge clears.
- 6 new tests (23 total).

Next Task

Implement Adapter SDK.

---

## 2026-07-18 (Timeline Store)

Summary

- Implemented pure `reduceTimeline` reducer and `TimelineStore` bound to EventBus.
- Derived projections: visible / running / waiting tasks; dismiss completed tasks on `conversation.opened`.
- Added 7 Timeline Store tests (17 total).

Next Task

Implement Notification Engine.

---

## 2026-07-18 (Event Bus)

Summary

- Added immutable domain event types and `createDomainEvent` in `@mission-control/shared`.
- Implemented append-only `EventBus` in `@mission-control/core` (publish, subscribe, subscribeType, getHistory, reset).
- Covered with Vitest (10 tests total across packages).

Next Task

Implement Timeline Store.

---

## 2026-07-18

Summary

- Completed Milestone 1 — Foundation.
- Initialized npm workspaces monorepo (`apps/*`, `packages/*`).
- Scaffolded Tauri v2 + React + TypeScript desktop shell with Tailwind, Framer Motion, Lucide, Zustand.
- Created shared packages: shared, core, ui, adapters, database, ipc.
- Wired rusqlite with `app_meta` schema version and `get_app_info` command.
- Added ESLint, Prettier, Vitest.
- Verified: typecheck, lint, test, production build (`Mission Control.app` + DMG).

Next Task

Implement Event Bus (Milestone 2).

---

# Release Checklist

Before v1.0

- [ ] All milestones complete
- [ ] Documentation updated
- [ ] Builds pass
- [ ] Tests pass
- [ ] Manual QA completed
- [ ] Performance targets met
- [ ] Packaging completed

---

# Agent Instructions

At the beginning of every implementation session:

1. Read README.md.
2. Read PRODUCT.md.
3. Read ARCHITECTURE.md.
4. Read STANDARDS.md.
5. Read STATUS.md.

Then:

- Determine the current milestone.
- Continue from the first incomplete task.
- Avoid implementing future milestones.
- Keep changes focused.
- Update this document before ending the session.
- Recommend the single highest-priority next task.

Never leave the project in a partially broken state.

---

# Project Health

Architecture

🟢 Excellent

Documentation

🟢 Complete

Build

🟢 Passing

Tests

🟢 Passing

Performance

⚪ Not measured

MVP Progress

~20% (Milestone 1 done; Event Bus + Timeline Store + Notification Engine)

Overall Progress

~20%
