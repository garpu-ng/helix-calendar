import { create } from 'zustand'

interface HelixState {
  currentTime: Date
  navigatedTime: Date
  zoomLevel: number
  isFollowingNow: boolean

  tick: () => void
  setNavigatedTime: (time: Date) => void
  setZoomLevel: (level: number) => void
  snapToNow: () => void
  scrubTime: (deltaMs: number) => void
}

export const useStore = create<HelixState>((set, get) => ({
  currentTime: new Date(),
  navigatedTime: new Date(),
  zoomLevel: 4.0,
  isFollowingNow: true,

  tick: () => {
    const now = new Date()
    set((state) => ({
      currentTime: now,
      navigatedTime: state.isFollowingNow ? now : state.navigatedTime,
    }))
  },

  setNavigatedTime: (time: Date) => set({ navigatedTime: time, isFollowingNow: false }),

  setZoomLevel: (level: number) => set({ zoomLevel: Math.max(0, Math.min(7, level)) }),

  snapToNow: () => {
    const now = new Date()
    set({ currentTime: now, navigatedTime: now, isFollowingNow: true })
  },

  scrubTime: (deltaMs: number) => {
    set((state) => ({
      navigatedTime: new Date(state.navigatedTime.getTime() + deltaMs),
      isFollowingNow: false,
    }))
  },
}))
