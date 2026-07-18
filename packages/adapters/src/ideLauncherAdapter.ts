import { invoke } from "@tauri-apps/api/core";
import type { AgentSource, DomainEvent } from "@mission-control/shared";
import type {
  AgentAdapter,
  AdapterEventHandler,
  AdapterHealth,
  AdapterUnsubscribe,
  RunningTaskSnapshot,
} from "./types";

/**
 * IDE adapter that can open its host app. Live session scanning is optional
 * until that tool writes discoverable local state on disk.
 */
export class IdeLauncherAdapter implements AgentAdapter {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly source: AgentSource,
    private readonly appName: string,
  ) {}

  private connected = false;
  private readonly handlers = new Set<AdapterEventHandler>();

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async health(): Promise<AdapterHealth> {
    return {
      status: this.connected ? "healthy" : "disconnected",
      message: this.connected
        ? `${this.name} ready (open via task click when available)`
        : "Disconnected",
    };
  }

  subscribe(handler: AdapterEventHandler): AdapterUnsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async sendMessage(): Promise<void> {
    throw new Error(`${this.name} does not support send yet`);
  }

  async queueMessage(): Promise<void> {
    throw new Error(`${this.name} does not support queue yet`);
  }

  async stopTask(): Promise<void> {
    throw new Error(`${this.name} does not support stop yet`);
  }

  async openConversation(): Promise<void> {
    await invoke("open_in_app", { app: this.appName, path: null });
  }

  async getRunningTasks(): Promise<readonly RunningTaskSnapshot[]> {
    return [];
  }

  protected emit(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}

export class ClaudeAdapter extends IdeLauncherAdapter {
  constructor() {
    super("claude", "Claude Code", "claude", "Claude");
  }
}

export class CodexAdapter extends IdeLauncherAdapter {
  constructor() {
    super("codex", "Codex CLI", "codex", "Terminal");
  }
}

export class WindsurfAdapter extends IdeLauncherAdapter {
  constructor() {
    super("windsurf", "Windsurf", "unknown", "Windsurf");
  }
}

export class ContinueAdapter extends IdeLauncherAdapter {
  constructor() {
    super("continue", "Continue", "unknown", "Cursor");
  }
}

export class GeminiAdapter extends IdeLauncherAdapter {
  constructor() {
    super("gemini", "Gemini CLI", "unknown", "Terminal");
  }
}
