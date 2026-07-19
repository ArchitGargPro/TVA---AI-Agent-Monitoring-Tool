import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CircleHelp } from "lucide-react";
import { APP_NAME } from "@mission-control/shared";
import { MissMinutesHi } from "./MissMinutesHi";

const APP_VERSION = "0.1.0";

interface PermissionStatus {
  accessibility: boolean;
  screenRecording: boolean;
}

export function HubPanel() {
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [perms, setPerms] = useState<PermissionStatus | null>(null);
  const [showPerms, setShowPerms] = useState(false);

  async function refreshPermissions() {
    try {
      const next = await invoke<PermissionStatus>("get_permission_status");
      setPerms(next);
    } catch {
      setPerms(null);
    }
  }

  async function launchMissMinutes() {
    setLaunching(true);
    setError(null);
    try {
      await invoke<boolean>("show_fidget_window");
      await refreshPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLaunching(false);
    }
  }

  async function openPermission(kind: "accessibility" | "screenRecording") {
    try {
      await invoke("open_permission_settings", { kind });
      // Give TCC a moment, then refresh (window-list probe + Request cache).
      window.setTimeout(() => void refreshPermissions(), 800);
      window.setTimeout(() => void refreshPermissions(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function confirmScreenRecording() {
    try {
      const next = await invoke<PermissionStatus>("confirm_screen_recording");
      setPerms(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void invoke("get_app_info").catch(() => undefined);
    void refreshPermissions();
    const id = window.setInterval(() => void refreshPermissions(), 2500);
    return () => window.clearInterval(id);
  }, []);

  const needsPerms = perms && (!perms.accessibility || !perms.screenRecording);

  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-[#f3ebe0] text-[#3f2a14]">
      <div className="absolute right-3 top-3 z-20">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#c47a3a]/35 bg-[#fef3c7]/80 text-[#9a3412] shadow-sm transition hover:bg-[#fef3c7]"
          aria-label="Permission status"
          onMouseEnter={() => setShowPerms(true)}
          onMouseLeave={() => setShowPerms(false)}
          onFocus={() => setShowPerms(true)}
          onBlur={() => setShowPerms(false)}
          onClick={() => setShowPerms((value) => !value)}
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
        </button>
        {showPerms ? (
          <div className="absolute right-0 top-8 w-56 rounded-xl border border-[#c47a3a]/30 bg-[#fefce8] p-3 shadow-lg">
            <p className="mb-2 font-sans text-[11px] font-medium leading-snug text-[#7c2d12]">
              Need these permissions to function as expected
            </p>
            <ul className="space-y-1.5 font-sans text-[11px] text-[#5c4a36]">
              <li className="flex items-center justify-between gap-2">
                <span>Accessibility</span>
                <StatusPill ok={perms?.accessibility === true} />
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Screen Recording</span>
                <StatusPill ok={perms?.screenRecording === true} />
              </li>
            </ul>
            <p className="mt-2 font-sans text-[10px] leading-snug text-[#8b7355]">
              Accessibility brings Cursor forward. Screen Recording helps fullscreen overlays. If
              Settings already shows On but we still say Off, tap I&apos;ve enabled it.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-3 overflow-hidden px-7 pb-4 pt-6">
        <header className="shrink-0 pr-8">
          <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="mt-0.5 flex items-center gap-2 font-sans text-[11px] text-[#8b7355]">
            <span>v{APP_VERSION}</span>
            <span className="text-[#c47a3a]/70" aria-hidden>
              ·
            </span>
            <span className="text-[#6b5640]">I help reduce your time variance</span>
          </p>
        </header>

        <div className="shrink-0">
          <MissMinutesHi />
        </div>

        <div className="shrink-0 space-y-1.5 font-sans text-[12px] leading-relaxed text-[#5c4a36]">
          <p>Miss Minutes watches your AI agents and floats over your desktop.</p>
          <ul className="list-disc space-y-1 pl-4 text-[#6b5640]">
            <li>She glows when something changes</li>
            <li>Hover to see updates on chats</li>
            <li>Drag to move · click a bubble to jump to Cursor</li>
          </ul>
        </div>

        {needsPerms ? (
          <div className="shrink-0 rounded-xl border border-[#c47a3a]/30 bg-[#fef3c7]/60 px-3 py-2">
            <p className="font-sans text-[11px] leading-snug text-[#7c2d12]">
              Need these permissions to function as expected
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {!perms?.accessibility ? (
                <button
                  type="button"
                  className="rounded-lg bg-[#9a3412] px-2.5 py-1 font-sans text-[11px] font-medium text-[#fef3c7]"
                  onClick={() => void openPermission("accessibility")}
                >
                  Open Accessibility
                </button>
              ) : null}
              {!perms?.screenRecording ? (
                <>
                  <button
                    type="button"
                    className="rounded-lg bg-[#9a3412] px-2.5 py-1 font-sans text-[11px] font-medium text-[#fef3c7]"
                    onClick={() => void openPermission("screenRecording")}
                  >
                    Open Screen Recording
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[#9a3412]/40 bg-transparent px-2.5 py-1 font-sans text-[11px] font-medium text-[#9a3412]"
                    onClick={() => void confirmScreenRecording()}
                  >
                    I&apos;ve enabled it
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <p
          className="h-4 shrink-0 font-sans text-[11px] leading-4 text-rose-600"
          role={error ? "alert" : undefined}
        >
          {error ?? "\u00a0"}
        </p>

        <div className="mt-auto shrink-0">
          <button
            type="button"
            onClick={() => void launchMissMinutes()}
            disabled={launching}
            className="w-full rounded-xl bg-[#9a3412] px-4 py-3 font-sans text-sm font-semibold text-[#fef3c7] shadow transition hover:bg-[#7c2d12] disabled:opacity-60"
          >
            {launching ? "Launching…" : "Launch Miss Minutes"}
          </button>
        </div>
      </div>

      <footer className="shrink-0 border-t border-[#c47a3a]/25 px-7 py-2.5 text-center font-sans text-[11px] text-[#8b7355]">
        made by{" "}
        <button
          type="button"
          className="font-medium text-[#9a3412] underline-offset-2 hover:underline"
          onClick={() => void openUrl("https://github.com/ArchitGargPro")}
        >
          @ArchitGargPro
        </button>
      </footer>
    </main>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 font-sans text-[9px] font-semibold ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
      }`}
    >
      {ok ? "On" : "Off"}
    </span>
  );
}
