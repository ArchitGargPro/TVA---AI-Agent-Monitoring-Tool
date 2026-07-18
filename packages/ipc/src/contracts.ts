import type { DomainEvent } from "@mission-control/shared";
import type { AppSettings } from "@mission-control/core";
import type { AdapterHealth, RunningTaskSnapshot } from "@mission-control/adapters";

/** Typed Tauri command names and payloads for the desktop shell. */
export const IpcCommands = {
  getAppInfo: "get_app_info",
  getTimelineSnapshot: "get_timeline_snapshot",
  getNotifications: "get_notifications",
  getSettings: "get_settings",
  updateSettings: "update_settings",
  sendMessage: "send_message",
  queueMessage: "queue_message",
  stopTask: "stop_task",
  openConversation: "open_conversation",
  runDemoScenario: "run_demo_scenario",
} as const;

export type IpcCommand = (typeof IpcCommands)[keyof typeof IpcCommands];

export interface AppInfoDto {
  readonly appName: string;
  readonly schemaVersion: number;
  readonly databasePath: string;
}

export interface TimelineSnapshotDto {
  readonly events: readonly DomainEvent[];
  readonly tasks: readonly TimelineTaskDto[];
}

export interface TimelineTaskDto {
  readonly taskId: string;
  readonly title: string;
  readonly source: string;
  readonly status: string;
  readonly startedAt: number;
  readonly updatedAt: number;
  readonly activity: string | null;
  readonly waitingReason: string | null;
  readonly error: string | null;
  readonly dismissed: boolean;
}

export interface NotificationDto {
  readonly id: string;
  readonly taskId: string;
  readonly kind: string;
  readonly title: string;
  readonly body: string;
  readonly priority: string;
  readonly source: string;
  readonly createdAt: number;
}

export interface UpdateSettingsRequest {
  readonly patch: Partial<AppSettings>;
}

export interface TaskMessageRequest {
  readonly taskId: string;
  readonly message: string;
}

export interface TaskIdRequest {
  readonly taskId: string;
}

/** Events emitted from Rust → frontend (Tauri event names). */
export const IpcEvents = {
  domainEvent: "domain://event",
  timelineUpdated: "timeline://updated",
  notificationsUpdated: "notifications://updated",
  settingsUpdated: "settings://updated",
  adapterHealth: "adapter://health",
} as const;

export interface AdapterHealthEvent {
  readonly adapterId: string;
  readonly health: AdapterHealth;
}

export type { AppSettings, DomainEvent, RunningTaskSnapshot };
