import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { APP_NAME } from "@mission-control/shared";
import { Button } from "@mission-control/ui";
import { useShellStore } from "./store/shellStore";

interface AppInfo {
  appName: string;
  schemaVersion: number;
  databasePath: string;
}

export default function App() {
  const status = useShellStore((state) => state.status);
  const setStatus = useShellStore((state) => state.setStatus);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAppInfo() {
      try {
        const result = await invoke<AppInfo>("get_app_info");
        if (cancelled) {
          return;
        }
        setInfo(result);
        setStatus("Foundation ready");
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("Database unavailable");
      }
    }

    void loadAppInfo();

    return () => {
      cancelled = true;
    };
  }, [setStatus]);

  return (
    <main className="flex h-full items-center justify-center p-8">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-md space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-zinc-500">{status}</p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {info ? (
          <dl className="space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between gap-4">
              <dt>Schema</dt>
              <dd className="font-medium text-zinc-900">v{info.schemaVersion}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt>Database</dt>
              <dd className="break-all font-mono text-xs text-zinc-500">{info.databasePath}</dd>
            </div>
          </dl>
        ) : null}

        <Button
          onClick={() => {
            setStatus("Foundation ready");
          }}
        >
          Confirm shell
        </Button>
      </motion.section>
    </main>
  );
}
