import { create } from 'zustand'
import { eventStore, type CalendarEvent } from '../calendar/events'

interface HelixState {
  currentTime: Date
  navigatedTime: Date
  zoomLevel: number
  isFollowingNow: boolean
  selectedTime: Date | null
  events: CalendarEvent[]

  tick: () => void
  setNavigatedTime: (time: Date) => void
  setZoomLevel: (level: number) => void
  snapToNow: () => void
  scrubTime: (deltaMs: number) => void
  setSelectedTime: (time: Date | null) => void
  loadEvents: () => Promise<void>
}

export const useStore = create<HelixState>((set, get) => ({
  currentTime: new Date(),
  navigatedTime: new Date(),
  zoomLevel: 4.0,
  isFollowingNow: true,
  selectedTime: null,
  events: [],

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

  setSelectedTime: (time: Date | null) => set({ selectedTime: time }),

  loadEvents: async () => {
    const events = await eventStore.getAll()
    set({ events })
  },
}))
