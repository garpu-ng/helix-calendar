import { create } from 'zustand'

interface HelixState {
  currentTime: Date
  navigatedYear: number
  isFollowingNow: boolean

  tick: () => void
  setNavigatedYear: (year: number) => void
  scrubYear: (delta: number) => void
  snapToNow: () => void
}

function dateToYear(d: Date): number {
  const year = d.getFullYear()
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  return year + (d.getTime() - start) / (end - start)
}

export const useStore = create<HelixState>((set) => ({
  currentTime: new Date(),
  navigatedYear: dateToYear(new Date()),
  isFollowingNow: true,

  tick: () => {
    const now = new Date()
    set((s) => ({
      currentTime: now,
      navigatedYear: s.isFollowingNow ? dateToYear(now) : s.navigatedYear,
    }))
  },

  setNavigatedYear: (year: number) =>
    set({ navigatedYear: Math.max(0, Math.min(3000, year)), isFollowingNow: false }),

  scrubYear: (delta: number) =>
    set((s) => ({
      navigatedYear: Math.max(0, Math.min(3000, s.navigatedYear + delta)),
      isFollowingNow: false,
    })),

  snapToNow: () => {
    const now = new Date()
    set({ currentTime: now, navigatedYear: dateToYear(now), isFollowingNow: true })
  },
}))
