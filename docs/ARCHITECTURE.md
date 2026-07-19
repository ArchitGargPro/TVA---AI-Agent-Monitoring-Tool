# ARCHITECTURE.md

# System Architecture

Version: 1.0

Status: Active

---

# Philosophy

Mission Control is a desktop application.

It is **not** a web application wrapped in a desktop shell.

Desktop capabilities should be treated as first-class citizens.

The application should feel closer to Raycast, Docker Desktop, or Notion Calendar than an Electron website.

Architecture decisions should always optimize for:

- simplicity
- performance
- maintainability
- extensibility
- low resource usage
- native experience

---

# Core Architecture

The application is composed of four layers.

```
                 React UI

                     │

          Tauri Command Layer

                     │

             Rust Core Engine

                     │

             Adapter Interface

                     │

        Cursor / Claude / Codex
```

Every layer has a single responsibility.

---

# Repository Structure

```
mission-control/

apps/

    desktop/

packages/

    core/

    ui/

    adapters/

    database/

    ipc/

    shared/

docs/

.cursor/
```

---

# apps/

Contains runnable applications.

Current

desktop

Future

website

---

# packages/

Contains reusable modules.

Every package should be independently testable.

Packages must not depend on applications.

Applications may depend on packages.

---

# Package Responsibilities

## core

Contains business logic.

Examples

- Event Bus
- Task Manager
- Timeline Manager
- Notification Manager
- Adapter Manager

No UI.

No React.

---

## ui

Reusable UI components.

Examples

Button

Timeline

Widget

Icons

Animation components

No business logic.

---

## database

SQLite layer.

Responsibilities

Schema

Queries

Repositories

Migrations

No UI.

---

## adapters

Every supported AI tool lives here.

Example

```
adapters/

cursor/

claude/

codex/
```

Each adapter implements the same interface.

---

## ipc

Everything related to communication between

React

↓

Tauri

↓

Rust

---

## shared

Shared types.

Constants.

Utilities.

Validation.

Never place business logic here.

---

# State Management

Use Zustand.

Do not introduce Redux.

Do not introduce MobX.

Do not introduce Context for global state.

React Context should only be used for dependency injection.

---

# Data Flow

Everything is event driven.

```
Adapter

↓

Event Bus

↓

Timeline Store

↓

React UI
```

React should never poll.

---

# Event Model

Every meaningful action becomes an event.

Examples

TaskStarted

TaskUpdated

TaskCompleted

TaskFailed

TaskCancelled

WaitingForApproval

MessageQueued

MessageSent

ConversationOpened

---

# Event Rules

Events are immutable.

Events are append-only.

Never mutate historical events.

State is derived from events.

---

# Adapter Architecture

Adapters translate tool-specific behavior into universal events.

Cursor

↓

TaskStarted

Claude

↓

TaskStarted

Codex

↓

TaskStarted

The UI should never know which tool produced the event.

---

# Adapter Interface

Every adapter must expose:

Connect

Disconnect

Health

Subscribe

SendMessage

QueueMessage

StopTask

OpenConversation

GetRunningTasks

---

# IPC

Communication between frontend and backend uses Tauri commands.

Long-running updates use events.

Do not implement polling unless absolutely unavoidable.

---

# Database

SQLite

One database.

One connection.

Schema managed through migrations.

No ORM-heavy abstractions.

Repositories should remain thin.

---

# UI Architecture

Component hierarchy

```
App

Overlay

Floating Widget

Timeline

Task Card

Quick Actions

Settings
```

Components should be small.

Prefer composition.

---

# Styling

Tailwind CSS.

Use utility classes.

Avoid custom CSS unless necessary.

Animations use Framer Motion.

---

# Icons

Lucide.

No mixed icon libraries.

---

# Logging

Structured.

No console.log in production.

Logging levels

Debug

Info

Warning

Error

---

# Error Handling

Errors should be recoverable whenever possible.

Never crash the application because one adapter fails.

One adapter must not affect another.

---

# Dependency Rules

Allowed

App

↓

Packages

Forbidden

Package

↓

App

Forbidden

Package

↓

Package

unless explicitly documented.

Avoid circular dependencies.

---

# Performance Budget

Cold startup

< 2 seconds

Idle RAM

< 70 MB

Busy RAM

< 120 MB

UI

60 FPS

Database queries

< 20 ms

Widget open animation

< 150 ms

---

# Security

Everything local.

No telemetry.

No cloud APIs.

No external uploads.

Credentials stored using platform secure storage.

Never in SQLite.

---

# Testing

Core packages

High coverage.

UI

Behavior-focused.

Adapters

Mock integration.

Avoid snapshot-heavy testing.

---

# Code Organization

Prefer many small files over very large files.

Target limits

React components

< 300 lines

Rust modules

< 300 lines

Functions

< 50 lines

Avoid "utils.ts" dumping grounds.

---

# Architecture Rules

Always prefer extending existing modules before creating new abstractions.

Avoid generic abstractions until at least three concrete implementations exist.

Do not introduce frameworks to solve simple problems.

Every dependency must have a clear justification.

Architecture should remain understandable by a new engineer within one hour.

---

# Architecture Decision Records

Major architectural decisions should be documented here.

Example

---

## ADR-001

Decision

Use Tauri instead of Electron.

Reason

Lower RAM usage.

Smaller binary.

Native desktop APIs.

Status

Accepted.

---

## ADR-002

Decision

Use Zustand instead of Redux.

Reason

Smaller API.

Less boilerplate.

Better fit for event-driven desktop applications.

Status

Accepted.

---

## ADR-003

Decision

Use npm workspaces for the JavaScript/TypeScript monorepo.

Reason

Ships with Node; no extra package-manager install.

Sufficient for current workspace linking without Turborepo.

Status

Accepted.

---

## ADR-004

Decision

Keep SQLite (rusqlite) inside `apps/desktop/src-tauri` for MVP; leave `@mission-control/database` as a TypeScript stub until IPC exists.

Reason

Database access is a native desktop concern.

Avoid premature abstraction across packages before the IPC layer ships.

Status

Accepted.

---

## ADR-005

Decision

Keep the Mission Control engine (EventBus, TimelineStore, adapters) as a process-lifetime singleton in the React renderer for MVP.

Reason

React StrictMode remounts dispose short-lived engine instances and drop Cursor event subscriptions. A singleton preserves live watchers across remounts without moving the full event core into Rust yet.

Status

Accepted.

---

## ADR-006

Decision

Convert the Miss Minutes fidget window to an `NSPanel` (`tauri-nspanel`) with nonactivating style, `FullScreenAuxiliary` + `CanJoinAllSpaces`, then elevate with `CGShieldingWindowLevel` (else above main menu) and `orderFrontRegardless`. Elevation must run on the main thread only (AppKit); the cursor watch loop re-asserts via `run_on_main_thread`. Keep a Dock icon (Regular activation policy) so **MinuteControl** can be relaunched after quit. The fidget window is a fixed large transparent canvas (~480×420) so agent bubbles are not cropped; drag uses `startDragging` after a move threshold. Right-click Miss Minutes for **Clear all bubbles**. Launching Miss Minutes twice is a no-op.

Agent status for glow: `running` when the user spoke last or the assistant is still working; `waiting` only when the assistant paused and is asking for user input; `completed` when the turn ended without an input ask.

Reason

Only `NSPanel` reliably draws over other apps’ fullscreen Spaces on modern macOS. A plain elevated `NSWindow` is not enough. Hiding the Dock icon (Accessory / LSUIElement) made relaunch confusing for MVP users.

Status

Accepted.
