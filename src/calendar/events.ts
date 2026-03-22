import Dexie, { type EntityTable } from 'dexie'

export interface CalendarEvent {
  id: number
  title: string
  startTime: Date
  endTime: Date
  description: string
  color: string
}

class HelixCalendarDB extends Dexie {
  events!: EntityTable<CalendarEvent, 'id'>

  constructor() {
    super('helix-calendar')
    this.version(1).stores({
      events: '++id, startTime, endTime',
    })
  }
}

const db = new HelixCalendarDB()

export const eventStore = {
  async add(event: Omit<CalendarEvent, 'id'>): Promise<number> {
    return await db.events.add(event as CalendarEvent)
  },

  async get(id: number): Promise<CalendarEvent | undefined> {
    return await db.events.get(id)
  },

  async update(id: number, changes: Partial<CalendarEvent>): Promise<void> {
    await db.events.update(id, changes)
  },

  async remove(id: number): Promise<void> {
    await db.events.delete(id)
  },

  async getInRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    return await db.events
      .where('startTime')
      .between(start, end, true, true)
      .toArray()
  },

  async getAll(): Promise<CalendarEvent[]> {
    return await db.events.toArray()
  },

  async clear(): Promise<void> {
    await db.events.clear()
  },
}
