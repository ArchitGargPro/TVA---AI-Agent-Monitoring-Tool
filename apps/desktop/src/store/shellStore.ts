import { create } from "zustand";

interface ShellState {
  status: string;
  setStatus: (status: string) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  status: "Starting…",
  setStatus: (status) => set({ status }),
}));
