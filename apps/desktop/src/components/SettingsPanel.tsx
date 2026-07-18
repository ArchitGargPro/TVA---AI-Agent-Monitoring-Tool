import { useSettings } from "../hooks/useSettings";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings();

  return (
    <section className="space-y-4 p-1" aria-label="Settings">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--mc-text)]">Settings</h2>
        <button
          type="button"
          className="text-xs text-[var(--mc-muted)] hover:text-[var(--mc-text)]"
          onClick={onClose}
        >
          Back to timeline
        </button>
      </header>

      <label className="flex items-center justify-between gap-3 text-sm text-[var(--mc-text)]">
        <span>Enable demo controls</span>
        <input
          type="checkbox"
          checked={settings.enableDemoAdapter}
          onChange={(event) => update({ enableDemoAdapter: event.target.checked })}
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm text-[var(--mc-text)]">
        <span>Reduce motion</span>
        <input
          type="checkbox"
          checked={settings.reduceMotion}
          onChange={(event) => update({ reduceMotion: event.target.checked })}
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm text-[var(--mc-text)]">
        <span>Theme</span>
        <select
          className="max-w-[9rem] rounded-md border border-[var(--mc-border)] bg-[var(--mc-surface)] py-1.5 pl-2 pr-8 text-xs text-[var(--mc-text)] outline-none focus:border-[var(--mc-focus)] focus:ring-2 focus:ring-[var(--mc-focus)]/40"
          value={settings.theme}
          onChange={(event) => update({ theme: event.target.value as "system" | "light" | "dark" })}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <p className="text-xs leading-relaxed text-[var(--mc-muted)]">
        Live Cursor sessions are read from local agent transcripts under{" "}
        <code className="text-[11px]">~/.cursor/projects</code>. Demo controls are optional for UI
        testing only.
      </p>
    </section>
  );
}
