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
  private unlisten: UnlistenFn | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  async connect(): Promise<void> {
    this.connected = true;

    try {
      this.unlisten = await listen<CursorAgentSnapshot[]>("cursor-agents", (event) => {
        this.applySnapshots(event.payload);
      });
    } catch {
      // Fall back to polling if event listen is unavailable.
    }

    await this.refresh();

    this.pollTimer = setInterval(() => {
      void this.refresh().catch(() => {
        // Ignore transient scan errors while polling.
      });
    }, 2000);
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
    if (!this.known.has(taskId)) {
      await this.refresh();
    }

    const snapshot = this.known.get(taskId);
    await invoke("open_in_app", {
      app: "Cursor",
      path: snapshot?.projectPath ?? null,
    });

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

  private applySnapshots(agents: CursorAgentSnapshot[]): void {
    const nextIds = new Set(agents.map((agent) => agent.taskId));

    for (const agent of agents) {
      const previous = this.known.get(agent.taskId);
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
    if (agent.status === "waiting") {
      this.emit(
        createDomainEvent("task.waiting", {
          taskId: agent.taskId,
          source: "cursor",
          reason: agent.activity ?? "Waiting for input",
          title: agent.title,
        }),
      );
      return;
    }

    if (agent.status === "completed") {
      this.emit(
        createDomainEvent("task.updated", {
          taskId: agent.taskId,
          source: "cursor",
          activity: agent.activity ?? "Done",
          title: agent.title,
        }),
      );
      this.emit(
        createDomainEvent("task.completed", {
          taskId: agent.taskId,
          source: "cursor",
        }),
      );
      return;
    }

    this.emit(
      createDomainEvent("task.updated", {
        taskId: agent.taskId,
        source: "cursor",
        activity: agent.activity ?? `Active in ${agent.projectName}`,
        title: agent.title,
      }),
    );
  }

  private emit(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
