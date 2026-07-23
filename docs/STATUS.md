# STATUS.md

Version: 0.1.0

Status: Active Development

Last Updated: 2026-07-23

---

# Current Objective

Build a production-ready desktop application (**MinuteControl**) that acts as Mission Control for AI coding agents.

Current focus is **MVP only**.

Do not implement future roadmap features until the MVP is complete.

---

# Current Milestone

Milestone 7 — Polish

Status:

🟡 In Progress

Goal:

Ship a polished Miss Minutes overlay with status bubbles and reliable Cursor refocus.

---

# Current Task

Push polished MVP to GitHub; QA shared DMG install path.

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
- [x] Adapter SDK
- [x] IPC Layer
- [x] Logging
- [x] Settings Store

Status

100%

---

## Milestone 3 — Desktop UI

- [x] Floating Widget
- [x] Activity Ring
- [x] Expand Animation (hover + click; OpenWhip-style spring)
- [x] Timeline Panel
- [x] Task Cards
- [x] Quick Actions (row click opens IDE)
- [x] Settings (theme store; panel deferred from minimal shell)

Status

100%

---

## Milestone 4 — Cursor Integration

- [x] Cursor Adapter (live transcript watcher)
- [x] Running Task Detection (live)
- [x] Completion Detection (live)
- [x] Open Conversation (opens project in Cursor)
- [ ] Send Message (live Cursor API not available)
- [ ] Queue Message (live Cursor API not available)
- [ ] Stop Task (live Cursor API not available)

Status

~70%

---

## Milestone 5 — Claude Code

- [x] Claude Adapter (launcher stub)
- [x] Shared Event Mapping (via DomainEvent + AdapterManager)

Status

~50% (launcher ready; live hooks pending)

---

## Milestone 6 — Codex CLI

- [x] Codex Adapter (launcher stub)

Status

~40% (launcher ready; live hooks pending)

---

## Milestone 7 — Polish

- [x] Accessibility (labels, keyboard expand, reduce-motion)
- [ ] Performance (not profiled on-device yet)
- [x] Error Handling (adapter failures logged; Result-style Rust DB)
- [x] Packaging (tauri build previously verified)
- [x] Documentation Review (STATUS synchronized)
- [x] TVA clock character + whip expand motion
- [ ] Final Testing (on-device QA in progress)

Status

~75%

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
- TypeScript EventBus / stores in renderer; adapters publish DomainEvents
- Mission Control engine is a process-lifetime singleton (survives React StrictMode remounts)

---

## Pending

None

---

# Manual Actions

None for Cursor live scan (uses local `~/.cursor/projects/*/agent-transcripts`).

For deeper Claude/Codex hooks later:

- Map each tool's local session/transcript signals into adapters

---

# Known Issues

- Cursor send / queue / stop require a public agent control API that does not exist yet.

---

# Technical Debt

- Claude / Codex / Windsurf / Continue / Gemini adapters are launchers only (no live session scan yet).
- IPC contracts exist; most UI still talks to the TS engine directly in-process.

---

# Session Notes

Newest entries first.

---

## 2026-07-19 (Face-only hover / click-through)

Summary

- Hover/expand only on Miss Minutes’ face hit circle (not the full 480×420 window).
- Empty overlay chrome uses `setIgnoreCursorEvents` hit-testing so clicks pass through to apps below; bubbles + context menu remain interactive.

Next Task

Reinstall and QA: cursor passes through around Miss Minutes; hover/drag/context menu still work on her face.

---

## 2026-07-19 (Reload = active agents only)

Summary

- Miss Minutes bubbles show **active** tasks only (running + waiting), not completed leftovers.
- Context-menu **Reload** hard-refreshes Cursor scan: force-emits latest status, undismisses still-active agents, dismisses completed from the HUD, and expands bubbles.

Next Task

Right-click Miss Minutes → Reload; confirm only in-progress agents appear with fresh activity text.

---

## 2026-07-18 (Glow mapping + Screen Recording truth + NSPanel)

Summary

- Root cause of red/yellow during in-progress: `last_role == user` was mapped to `waiting`. Now user-last = `running` (orange slow wave). `waiting` is only when the assistant paused and is clearly asking for input.
- Screen Recording status: window-list probe (other apps’ window titles visible ⇒ granted) + hub **I've enabled it** confirm for TCC edge cases.
- Fullscreen: convert fidget to `NSPanel` via `tauri-nspanel` (`FullScreenAuxiliary` + `CanJoinAllSpaces` + nonactivating), then elevate.

Next Task

Launch Miss Minutes from `/Applications/MinuteControl.app`, confirm orange wavy while an agent is working, red/yellow only when she asks you something, and visibility over a true fullscreen app.

---

## 2026-07-18 (Glow modes + perms cache + overlay)

Summary

- Glow modes: idle = faint static · processing = rotating wave · waiting = red/yellow aggressive pulse.
- Idle copy: “I'm watching”; hub tagline beside version.
- Screen Recording: cache grant via `CGRequestScreenCaptureAccess` (Preflight lies on unsigned builds); Info.plist usage strings.
- Fullscreen overlay: clear opaque chrome, exact shielding level, Transient collection behavior.

Next Task

Launch Miss Minutes, open Screen Recording once from hub if still Off, then QA over a fullscreen app.

---

## 2026-07-18 (Stale bubbles + drag + perms fix)

Summary

- Root cause of “Briefly inform…”: same Cursor session UUID under multiple project folders; scan now dedupes by task id (latest mtime) and filters noise titles.
- Clear/dismiss uses wall-clock + raw mtime so content-hash churn cannot revive bubbles.
- Miss Minutes anchored to top of overlay window so she can be dragged to the top of the screen.
- Accessibility status uses System Events probe (AXIsProcessTrusted alone was wrong for unsigned builds).
- Stronger always-on glow + update pulse.

Next Task

Reinstall; Clear All once; grant Screen Recording to `/Applications/MinuteControl.app` specifically for fullscreen.

---

## 2026-07-18 (Permissions + glow + context menu)

Summary

- Right-click: **Reload** + **Clear All** with icons; no bubble scrollbar (cap 6).
- Bubble: smaller CURSOR label, larger reply preview; faint always-on glow + strong update glow.
- Hub `?` shows Accessibility / Screen Recording status + deep-links to System Settings.
- `reset_local_data` + wiped local SQLite for clean QA.

Next Task

Grant Screen Recording + Accessibility if prompted; QA Miss Minutes over fullscreen.

---

## 2026-07-18 (Fullscreen + glance + clear-all)

Summary

- Fullscreen HUD: main-thread elevate, `orderFrontRegardless`, drop Stationary behavior.
- Eyes glance L/R again; slightly more float; shorter tick marks.
- Bubble click always removes item; right-click → **Clear all bubbles** (no native Reload menu).
- Dismissed agents stay hidden across webview reload until new activity.

Next Task

Install and QA over a true fullscreen app.

---

## 2026-07-18 (Hub polish + launch crash fix)

Summary

- Speech bubble tail points at Miss Minutes’ face; copy: AI agents / Hover to see updates on chats.
- Hub window sized to avoid scrollbar; overflow hidden; no layout-shifting hint.
- Fixed crash: AppKit window-level was set from the cursor-watch background thread → now `run_on_main_thread`.

Next Task

Install and QA Launch Miss Minutes.

---

## 2026-07-18 (Hub Miss Minutes Hi + install)

Summary

- MinuteControl hub shows a static Miss Minutes saying “Hi”.
- Production build installed to `/Applications/MinuteControl.app`.

Next Task

On-device QA of installed MinuteControl (Launch Miss Minutes, fullscreen).

---

## 2026-07-18 (MinuteControl + Miss Minutes UX)

Summary

- App renamed to **MinuteControl**; Miss Minutes face Dock icon (transparent BG).
- Hub is minimal: short how-it-works + Launch Miss Minutes (+ version). Launch twice is a no-op.
- No shake on hover; glow + badge clear on hover/click (badge resets to 0); bubbles stay visible while hovering.
- Bubbles are two lines: user preview · `CURSOR` + status/reply.
- Fullscreen: `CGShieldingWindowLevel` + re-elevate while visible.
- Dismiss revive only on newer transcript activity (fixes sticky badge / stale HUD).

Next Task

On-device QA over a true fullscreen app; then live Claude/Codex adapters or notarized packaging.

---

## 2026-07-18 (Miss Minutes polish)

Summary

- Floating widget is **Miss Minutes** (orange body, arms/gloves, legs/shoes, glancing eyes).
- Hub CTA: **Launch Miss Minutes**; glows on agent updates until hover/click.
- Fixed crop: fidget window stays ~480×360 (no shrink-to-clock).
- Drag starts only after pointer move (fixes broken drag + click).
- Fullscreen: elevate after show to near-screensaver window level; `start-dragging` permission explicit.

Next Task

On-device QA, then live Claude/Codex adapters or notarized packaging.

---

## 2026-07-18 (Rename TVA + hub launcher)

Summary

- App renamed to **TVA** (productName, window titles, APP_NAME).
- Hub window replaces dead M1 "Confirm shell" CTA with **Launch floating clock**.
- Footer credit @ArchitGargPro → GitHub; new TVA clock Dock icon (replaced default Tauri Activity icon).
- Faster agent scan (~1s Rust / 800ms adapter). Old release Mission Control.app must not be used.

Next Task

Quit any old Mission Control.app; run `npm run tauri:dev` and use Launch floating clock.

---

## 2026-07-18 (Drag + launch docs + 90% bubble opacity)

Summary

- Clock is draggable via startDragging + drag region; click (no move) toggles expand.
- Bubbles use ~10% transparency (`bg-white/90`).
- Dock icon restored for relaunch; README documents launch, share/DMG, and local SQLite path.

Next Task

Live Claude/Codex adapters, or notarized release packaging.

---

## 2026-07-18 (Dismiss + live status + bubble previews)

Summary

- Fixed completed→waiting/running revive so pending/in-progress chats update again.
- Bubble click focuses Cursor and dismisses the item (badge count drops); dismissed IDs persist in SQLite until new activity.
- Bubbles show: user message preview, app name (Cursor), reply preview (not "done").
- Idle assistant turns become completed after ~35s; waiting shows "Waiting for you".

Next Task

Live Claude/Codex adapters, or detect Cursor-native "viewed" state if/when available.

---

## 2026-07-18 (Bubble readability + fullscreen overlay)

Summary

- Whitish message clouds with black sans text; status shown via colored left accent.
- Smaller denser bubbles; badge count = visible agent count.
- Titles use latest meaningful user query (skip URLs / bootstrap prompts).
- Click unminimizes + activates Cursor (specific agent tab still unavailable).
- Overlay: Accessory policy, visibleOnAllWorkspaces, elevated NSWindow level for fullscreen Spaces.
- Settings now persist to SQLite via get_settings / save_settings.

Next Task

Deepen Claude/Codex live adapters, or menu-bar / launch-at-login wiring for persisted settings.

---

## 2026-07-18 (Floating clock overlay)

Summary

- Replaced framed window UI with transparent undecorated floating TVA clock.
- Hover expands independent status-colored agent bubbles (sky / rose / emerald).
- Clock aura pulses by dominant status; red badge shows count.
- Click focuses Cursor via osascript activate (no path open — fixes crash/close).
- Window resizes anchored bottom-right between compact clock and bubble tray.

Next Task

Finish M7 on-device QA (drag, hover, focus), then settings persistence or live Claude/Codex adapters.

---

## 2026-07-18 (Hover expand + TVA whip polish)

Summary

- Fixed empty agent list: StrictMode was disposing the engine; Cursor watch only emitted on fingerprint change so remounts missed snapshots.
- Engine is now a process-lifetime singleton; Rust watch always emits; Cursor adapter logs scan failures.
- Hover (and click/keyboard) expands the agent list with an OpenWhip-style spring.
- TVA clock character with face + whip crack on expand / attention.
- Title extraction prefers `<user_query>` body.

Next Task

Finish Milestone 7 final on-device QA, then deepen Claude/Codex live adapters (or settings persistence).

---

## 2026-07-18 (MVP shell for on-device QA)

Summary

- Milestone 3 Desktop UI: widget, activity attention ring, expand timeline, task cards, quick actions, settings.
- DemoAdapter scripted scenario for verification without live IDEs.
- Cursor / Claude / Codex stub adapters registered.
- Ready for `npm run tauri:dev` on-device QA.

Next Task

Deepen live Cursor adapter after demo verification.

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

~85% (floating clock overlay + live Cursor; other IDE live hooks pending)

Overall Progress

~85%
