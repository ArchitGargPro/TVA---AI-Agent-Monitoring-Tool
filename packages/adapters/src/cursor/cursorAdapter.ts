import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { createDomainEvent, type DomainEvent } from "@mission-control/shared";
import type {
  AgentAdapter,
  AdapterEventHandler,
  AdapterHealth,
  AdapterUnsubscribe,
  RunningTaskSnapshot,
} from "../types";

export interface CursorAgentSnapshot {
  taskId: string;
  title: string;
  projectName: string;
  projectPath: string | null;
  transcriptPath: string;
  status: "running" | "waiting" | "completed" | string;
  activity: string | null;
  updatedAt: number;
  /** Raw filesystem mtime — dismiss/revive uses this, not content-hash updatedAt. */
  mtimeMs: number;
}

/**
 * Live Cursor adapter — watches local agent transcripts via the Tauri backend.
 */
export class CursorAdapter implements AgentAdapter {
  readonly id = "cursor";
  readonly name = "Cursor";
  readonly source = "cursor" as const;

  private connected = false;
  private readonly handlers = new Set<AdapterEventHandler>();
  private readonly known = new Map<string, CursorAgentSnapshot>();
  /** Dismissed until the transcript gets new activity (updatedAt / status change). */
  private readonly dismissed = new Map<string, number>();
  private unlisten: UnlistenFn | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  async connect(): Promise<void> {
    this.connected = true;

    try {
      const saved = await invoke<string[]>("get_dismissed_agents");
      // Stamp far enough ahead of current transcript mtimes so a webview Reload
      // does not revive already-cleared bubbles until new activity lands.
      const stamp = Date.now();
      for (const taskId of saved) {
        this.dismissed.set(taskId, stamp);
      }
    } catch {
      // Optional persistence — ignore if command unavailable.
    }

    try {
      this.unlisten = await listen<CursorAgentSnapshot[]>("cursor-agents", (event) => {
        this.applySnapshots(event.payload);
      });
    } catch (error) {
      console.warn("[cursor] event listen unavailable; polling only", error);
    }

    await this.refresh().catch((error: unknown) => {
      console.warn("[cursor] initial scan failed", error);
    });

    this.pollTimer = setInterval(() => {
      void this.refresh().catch((error: unknown) => {
        console.warn("[cursor] poll scan failed", error);
      });
    }, 800);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.unlisten) {
      this.unlisten();
      this.unlisten = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async health(): Promise<AdapterHealth> {
    if (!this.connected) {
      return { status: "disconnected", message: "Cursor adapter disconnected" };
    }
    return {
      status: "healthy",
      message: `Tracking ${this.known.size} Cursor session(s)`,
    };
  }

  subscribe(handler: AdapterEventHandler): AdapterUnsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async sendMessage(): Promise<void> {
    throw new Error("Send into live Cursor chat is not available yet");
  }

  async queueMessage(): Promise<void> {
    throw new Error("Queue into live Cursor chat is not available yet");
  }

  async stopTask(): Promise<void> {
    throw new Error("Stop live Cursor agent is not available yet");
  }

  async openConversation(taskId: string): Promise<void> {
    try {
      await invoke("focus_app", { app: "Cursor" });
    } catch (error) {
      console.warn("[cursor] focus failed", error);
    }
    // Always dismiss the bubble, even if focus fails.
    await this.acknowledgeTask(taskId);
  }

  async acknowledgeTask(taskId: string): Promise<void> {
    this.markDismissed(taskId);
    this.emit(
      createDomainEvent("conversation.opened", {
        taskId,
        source: "cursor",
      }),
    );
  }

  async getRunningTasks(): Promise<readonly RunningTaskSnapshot[]> {
    return [...this.known.values()]
      .filter((agent) => agent.status === "running" || agent.status === "waiting")
      .map((agent) => ({
        taskId: agent.taskId,
        title: agent.title,
        source: "cursor" as const,
        startedAt: agent.updatedAt,
        activity: agent.activity,
      }));
  }

  async refresh(): Promise<void> {
    const agents = await invoke<CursorAgentSnapshot[]>("scan_cursor_agents");
    this.applySnapshots(agents);
  }

  private markDismissed(taskId: string) {
    const snapshot = this.known.get(taskId);
    // Stamp with wall clock so status/content-hash churn cannot revive immediately.
    const stamp = Math.max(Date.now(), (snapshot?.mtimeMs ?? 0) + 1);
    this.dismissed.set(taskId, stamp);
    void invoke("save_dismissed_agents", {
      taskIds: [...this.dismissed.keys()],
    }).catch(() => {
      // Persistence is best-effort.
    });
  }

  private applySnapshots(agents: CursorAgentSnapshot[]): void {
    const nextIds = new Set(agents.map((agent) => agent.taskId));

    for (const agent of agents) {
      const previous = this.known.get(agent.taskId);

      const dismissStamp = this.dismissed.get(agent.taskId);
      if (dismissStamp !== undefined) {
        // Revive only when the transcript file itself is newer than dismiss.
        if (agent.mtimeMs <= dismissStamp) {
          continue;
        }
        this.dismissed.delete(agent.taskId);
        void invoke("save_dismissed_agents", {
          taskIds: [...this.dismissed.keys()],
        }).catch(() => undefined);
      }

      this.known.set(agent.taskId, agent);

      if (!previous) {
        this.emit(
          createDomainEvent(
            "task.started",
            {
              taskId: agent.taskId,
              source: "cursor",
              title: agent.title,
            },
            { timestamp: agent.updatedAt },
          ),
        );
        this.emitStatus(agent);
        continue;
      }

      if (
        agent.status !== previous.status ||
        agent.activity !== previous.activity ||
        agent.title !== previous.title ||
        agent.updatedAt !== previous.updatedAt
      ) {
        this.emitStatus(agent);
      }
    }

    for (const [taskId, previous] of [...this.known.entries()]) {
      if (!nextIds.has(taskId)) {
        if (previous.status !== "completed") {
          this.emit(
            createDomainEvent("task.completed", {
              taskId,
              source: "cursor",
            }),
          );
        }
        this.known.delete(taskId);
      }
    }
  }

  private emitStatus(agent: CursorAgentSnapshot): void {
    const at = { timestamp: agent.updatedAt };
    if (agent.status === "waiting") {
      this.emit(
        createDomainEvent(
          "task.waiting",
          {
            taskId: agent.taskId,
            source: "cursor",
            reason: agent.activity ?? "Waiting…",
            title: agent.title,
          },
          at,
        ),
      );
      return;
    }

    if (agent.status === "completed") {
      this.emit(
        createDomainEvent(
          "task.completed",
          {
            taskId: agent.taskId,
            source: "cursor",
            activity: agent.activity ?? undefined,
            title: agent.title,
          },
          at,
        ),
      );
      return;
    }

    this.emit(
      createDomainEvent(
        "task.updated",
        {
          taskId: agent.taskId,
          source: "cursor",
          activity: agent.activity ?? "Working…",
          title: agent.title,
        },
        at,
      ),
    );
  }

  private emit(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
