# MinuteControl

**Reduce your time variance.**

MinuteControl is a lightweight macOS companion for AI-assisted development. It watches your coding agents and surfaces what’s running, what’s waiting, and what needs you — without forcing you back into every IDE window.

Miss Minutes floats on your desktop as a calm, always-available HUD for Cursor (and more adapters to come).

---

## Why

When several AI agents run at once, the hard part isn’t writing code — it’s supervision:

- Is something still running?
- Did a task finish?
- Is an agent blocked on approval or a question?
- Which chat should I open next?

MinuteControl answers those questions in one place, locally, with minimal resource use.

---

## What’s included (v0.1)

- **Hub launcher** — start Miss Minutes from a small desktop app
- **Floating overlay** — always-on-top companion that can appear over fullscreen Spaces
- **Live Cursor watch** — reads local agent transcripts and shows in-progress status bubbles
- **Status glow** — orange slow wave while agents work; red/yellow pulse when input is needed
- **Quick actions** — click a bubble to jump to Cursor; right-click for Reload / Clear All
- **Local-first** — SQLite on your Mac; no source code leaves the machine

---

## Install (share with others)

### Build a DMG

```bash
nvm use          # Node 20+
npm install
npm run tauri:build
```

Share the installer:

```text
apps/desktop/src-tauri/target/release/bundle/dmg/MinuteControl_0.1.0_aarch64.dmg
```

Recipients open the DMG, drag **MinuteControl.app** into Applications, then launch from Spotlight or the Dock.

### First launch notes

- Current release builds are **Apple Silicon** (`aarch64`).
- Builds are **ad-hoc signed** (not Apple-notarized yet). macOS may require **System Settings → Privacy & Security → Open Anyway**.
- Grant **Accessibility** (bring Cursor forward) and **Screen Recording** (fullscreen overlay) when prompted. If Screen Recording shows Off while Settings says On, use **I've enabled it** in the hub.

---

## Usage

1. Open **MinuteControl**
2. Click **Launch Miss Minutes**
3. Hover her face for status bubbles; drag to reposition
4. Click a bubble to focus Cursor
5. Right-click for **Reload** (refresh active agents) or **Clear All**

Idle hover with nothing in progress shows a quiet **I'm watching** note.

---

## Development

Requirements: Node 20+, Rust (rustup), Xcode Command Line Tools (macOS).

```bash
nvm use
npm install
npm run tauri:dev      # hub + Miss Minutes
npm run tauri:build    # .app + .dmg
npm run typecheck
npm run lint
npm run test
```

### Repository layout

```text
apps/desktop/     Tauri + React app (MinuteControl)
packages/         core, adapters, ipc, shared, ui, database
docs/             PRODUCT · ARCHITECTURE · STANDARDS · STATUS
```

### Documentation

| Doc | Purpose |
| --- | --- |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Product requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & ADRs |
| [docs/STANDARDS.md](docs/STANDARDS.md) | Engineering standards |
| [docs/STATUS.md](docs/STATUS.md) | Milestone progress |

---

## Local data

Everything stays on your machine.

| Data | Location |
| --- | --- |
| SQLite (settings, dismissed agents) | `~/Library/Application Support/com.minutecontrol.desktop/mission-control.db` |
| Cursor transcripts (read-only) | `~/.cursor/projects/*/agent-transcripts/` |

---

## Roadmap (near term)

- Broader live adapters (Claude Code, Codex, and friends)
- Notarized macOS distribution
- Universal binary (Apple Silicon + Intel)

See [docs/STATUS.md](docs/STATUS.md) for current milestone detail.

---

## License

Proprietary. All rights reserved.
