# Mission Control

> Mission Control is a lightweight desktop companion for AI-assisted software development.
>
> It provides a unified, always-accessible control center for autonomous coding agents running across multiple IDEs and AI tools such as Cursor, Claude Code, Codex CLI, and future integrations.

---

## Vision

Software development is rapidly evolving from using a single AI assistant to orchestrating multiple autonomous coding agents simultaneously.

Developers today often have several AI agents running in parallel:

- Cursor implementing a feature
- Claude Code reviewing architecture
- Codex CLI writing tests
- Another agent fixing bugs
- Additional agents generating documentation or refactoring code

Managing these agents is difficult.

Developers constantly switch between IDE windows and terminals to answer questions like:

- Is an agent still running?
- Which task just finished?
- Is something waiting for my approval?
- Which conversation should I open next?
- Which agent failed?

Mission Control solves this by acting as the operating system for AI development.

Instead of monitoring each IDE individually, developers get one lightweight desktop companion that continuously tracks every supported AI agent.

---

## Core Principles

Mission Control follows several guiding principles.

### Lightweight

The application should consume minimal CPU and memory while remaining responsive.

Performance is a product feature.

---

### Local First

All monitoring and orchestration happen locally.

No source code is uploaded.

No telemetry is collected unless explicitly enabled.

---

### IDE Agnostic

Mission Control should support multiple editors and AI tools through adapters rather than being tightly coupled to any single IDE.

---

### Event Driven

Everything inside the application is modeled as events.

Polling should be avoided whenever possible.

---

### Beautiful by Default

Mission Control should feel like a native operating system component rather than another Electron application.

Animations should be subtle, smooth and purposeful.

---

## MVP Features

Version 1 focuses on solving one problem exceptionally well:

Provide visibility into autonomous AI coding agents.

Core functionality includes:

- Floating desktop widget
- Real-time task timeline
- Running task monitoring
- Completion notifications
- Waiting-for-user indicators
- Open conversation shortcuts
- Send messages to running agents
- Queue messages
- Stop running tasks
- Local history
- Adapter architecture

---

## Planned Integrations

Initial integrations:

- Cursor
- Claude Code
- Codex CLI

Future integrations:

- Gemini CLI
- Continue
- Aider
- OpenHands
- Roo Code
- Windsurf
- JetBrains
- Neovim

---

## Technology Stack

### Desktop

- Tauri
- Rust

### Frontend

- React
- TypeScript
- Tailwind CSS
- Framer Motion

### Storage

- SQLite

### Communication

- JSON-RPC
- Local IPC
- WebSockets where appropriate

---

## Repository Structure

```
apps/
    desktop/

packages/
    ui/
    core/
    adapters/
    database/
    ipc/
    shared/

docs/
    PRODUCT.md
    ARCHITECTURE.md
    STANDARDS.md
    STATUS.md

.cursor/
    rules/
```

---

## Documentation

This repository is intentionally documentation-driven.

Before implementing new features, read the documents in the following order.

1. README.md
2. docs/PRODUCT.md
3. docs/ARCHITECTURE.md
4. docs/STANDARDS.md
5. docs/STATUS.md

These documents together form the project's single source of truth.

---

## Development Philosophy

Mission Control is built as if it were a commercial desktop application intended to serve millions of developers.

Every implementation should prioritize:

- simplicity
- maintainability
- performance
- consistency
- minimal dependencies
- strong typing
- production readiness

Features should only be added when they improve the overall developer experience.

---

## Current Status

This project is currently under active development.

See `docs/STATUS.md` for the current implementation status and next milestones.

---

## Development

```bash
npm install
npm run tauri:dev      # run desktop shell
npm run tauri:build    # production build
npm run typecheck
npm run lint
npm run test
```

Requires Node 20+, Rust (via rustup), and Xcode Command Line Tools on macOS.

---

## License

Proprietary.

All rights reserved.
