# PRODUCT.md

# Product Requirements Document (PRD)

Version: 1.0

Status: Active

Owner: Founding Team

---

# Vision

Mission Control is a lightweight desktop companion that gives developers complete visibility and control over autonomous AI coding agents.

As AI coding becomes increasingly autonomous, developers no longer struggle to write code—they struggle to supervise multiple agents running simultaneously.

Mission Control becomes the single place where developers monitor, control, and interact with every AI coding agent without constantly switching between IDEs, terminals, and chat windows.

Mission Control is not another AI.

Mission Control is the operating system for AI-assisted software development.

---

# Problem Statement

Modern AI development workflows are fragmented.

A developer may have:

- Cursor implementing a feature
- Claude Code reviewing architecture
- Codex CLI writing tests
- Another agent fixing bugs
- Documentation generation running elsewhere

These agents operate independently with almost no visibility.

Developers constantly ask:

- Is it still running?
- Which task finished?
- Which agent failed?
- Is something waiting for me?
- Which conversation should I open?
- Can I quickly send another instruction?

Current workflows require repeatedly switching between IDEs and terminals, creating unnecessary context switching and reducing productivity.

Mission Control removes this friction.

---

# Goals

Mission Control should allow developers to:

- Monitor every AI coding agent in one place.
- Interact with agents without opening their IDE.
- Immediately notice when attention is required.
- Reduce context switching.
- Keep resource usage extremely low.
- Feel like a native desktop utility.

---

# Non Goals

Mission Control is NOT:

- another IDE
- another AI assistant
- another chat interface
- another code editor
- another terminal
- another code review platform

It complements existing AI tools rather than replacing them.

---

# Target Users

Primary

- Developers using Cursor daily.
- Developers running multiple AI coding tools simultaneously.
- AI-first software engineers.

Secondary

- Engineering teams.
- Tech leads.
- Open source maintainers.
- Startup founders.

---

# Design Principles

## Invisible

Mission Control should stay out of the way until needed.

---

## Instant

Every interaction should feel immediate.

Opening the widget should never feel slow.

---

## Calm

Avoid noisy notifications.

Use subtle animations.

Avoid interrupting developer flow.

---

## Universal

Support multiple AI ecosystems.

Avoid coupling to any single IDE.

---

## Native Feeling

Everything should feel like it belongs to the operating system.

---

# MVP

Version 1 focuses on one problem only:

Making AI agents visible and controllable.

The MVP intentionally avoids workflow automation and enterprise functionality.

---

# MVP Features

## Floating Widget (Miss Minutes)

A small always-on-top floating Miss Minutes mascot (transparent, undecorated overlay) launched from **MinuteControl**.

Responsibilities:

- Orange clock character with arms, legs, and glancing eyes.
- Glow + badge on agent updates until the user hovers or clicks her (badge resets to 0).
- On hover, reveal two-line status bubbles (user preview · app · status/reply).
- Drag to reposition; click a bubble to jump to Cursor.
- Appear over fullscreen Spaces when possible.
- Hub CTA: **Launch Miss Minutes** (second launch is a no-op).

---

## Timeline

Displays every important event.

Supported event types:

- Task started
- Task updated
- Task completed
- Task failed
- Waiting for user
- Message received
- Message queued

Completed events remain until the related conversation has been opened.

---

## Running Tasks

Display:

- task name
- elapsed time
- current activity
- originating agent

---

## Waiting State

Waiting tasks receive visual priority.

Examples:

- waiting for approval
- waiting for credentials
- waiting for clarification

---

## Quick Actions

Every running task should support:

Open Conversation

Send Message

Queue Message

Stop Task

Retry Task (if supported)

---

## Multi Agent Support

MVP supports:

- Cursor
- Claude Code
- Codex CLI

---

## Local History

Store task history locally.

Allow users to review completed tasks.

No cloud storage.

---

# User Flow

Developer starts Cursor.

↓

Cursor begins implementing a feature.

↓

Mission Control detects a new task.

↓

Widget indicates activity.

↓

Developer clicks widget.

↓

Timeline opens.

↓

Developer sees running tasks.

↓

Developer sends:

"Skip tests."

↓

Agent receives instruction.

↓

Task finishes.

↓

Timeline displays completion.

↓

Developer opens Cursor conversation.

↓

Completed notification disappears.

---

# Success Metrics

The MVP succeeds if developers:

- spend significantly less time switching windows
- immediately notice completed tasks
- immediately notice waiting tasks
- prefer keeping Mission Control open during development

---

# Future Versions

## V2

- Activity summaries
- Better progress reporting
- Multiple workspace support
- Search history
- Smart notifications

---

## V3

- Cross-agent workflows
- Workflow automation
- Agent orchestration
- Shared context
- Team collaboration

---

## V4

- Enterprise dashboard
- Shared monitoring
- Slack integration
- Approval routing
- Usage analytics

---

# Explicitly Out of Scope (MVP)

Do NOT implement:

- cloud sync
- authentication
- accounts
- mobile apps
- browser extensions
- plugins marketplace
- AI-generated summaries
- workflow automation
- enterprise features

Keep the MVP intentionally small.

---

# Roadmap

## Phase 1

Repository setup

Desktop application

React

Tauri

Rust backend

SQLite

---

## Phase 2

Floating widget

Animations

Timeline

Notifications

---

## Phase 3

Cursor adapter

Task monitoring

Conversation opening

Quick actions

---

## Phase 4

Claude Code adapter

Codex adapter

Unified event system

---

## Phase 5

Polish

Accessibility

Performance

Testing

Packaging

---

# Definition of Done

A feature is considered complete only when:

- implementation is complete
- architecture remains clean
- documentation is updated
- project state is updated
- no TODO comments remain
- no placeholder implementations remain
- builds pass
- tests pass where applicable
- code follows ENGINEERING.md

Incomplete work should never be marked complete.

---

# Product Philosophy

Mission Control should eventually become as indispensable to AI developers as Docker Desktop is to containerized development.

Developers should instinctively launch Mission Control at the beginning of every coding session.
