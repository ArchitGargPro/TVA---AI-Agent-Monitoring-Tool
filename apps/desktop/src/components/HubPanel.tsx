import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { APP_NAME } from "@mission-control/shared";
import { MissMinutesHi } from "./MissMinutesHi";

const APP_VERSION = "0.1.0";

export function HubPanel() {
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  async function launchMissMinutes() {
    setLaunching(true);
    setError(null);
    try {
      await invoke<boolean>("show_fidget_window");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLaunching(false);
    }
  }

  useEffect(() => {
    void invoke("get_app_info").catch(() => undefined);
  }, []);

  return (
    <main className="flex h-full flex-col overflow-hidden bg-[#f3ebe0] text-[#3f2a14]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-3 overflow-hidden px-7 pb-4 pt-6">
        <header className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="mt-0.5 font-sans text-[11px] text-[#8b7355]">v{APP_VERSION}</p>
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

        {/* Fixed-height status slot — avoids layout shift / scrollbar when errors appear */}
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
