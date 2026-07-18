import { useSettings } from "../hooks/useSettings";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings();

  return (
    <section className="space-y-3" aria-label="Settings">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Settings</h2>
        <button
          type="button"
          className="text-xs text-zinc-500 hover:text-zinc-800"
          onClick={onClose}
        >
          Close
        </button>
      </header>

      <label className="flex items-center justify-between gap-3 text-sm text-zinc-700">
        <span>Enable demo adapter</span>
        <input
          type="checkbox"
          checked={settings.enableDemoAdapter}
          onChange={(event) => update({ enableDemoAdapter: event.target.checked })}
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm text-zinc-700">
        <span>Reduce motion</span>
        <input
          type="checkbox"
          checked={settings.reduceMotion}
          onChange={(event) => update({ reduceMotion: event.target.checked })}
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm text-zinc-700">
        <span>Theme</span>
        <select
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs"
          value={settings.theme}
          onChange={(event) => update({ theme: event.target.value as "system" | "light" | "dark" })}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </section>
  );
}
