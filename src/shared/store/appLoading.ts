import { create } from "zustand"

type AppLoadingState = {
  pendingCount: number
  start: () => void
  stop: () => void
}

export const useAppLoading = create<AppLoadingState>((set) => ({
  pendingCount: 0,
  start: () =>
    set((state) => ({
      pendingCount: state.pendingCount + 1,
    })),
  stop: () =>
    set((state) => ({
      pendingCount: Math.max(0, state.pendingCount - 1),
    })),
}))
