import { describe, it, expect, beforeEach } from 'vitest'
import { eventStore, type CalendarEvent } from '../events'

describe('eventStore', () => {
  beforeEach(async () => {
    await eventStore.clear()
  })

  it('creates and retrieves an event', async () => {
    const event: Omit<CalendarEvent, 'id'> = {
      title: 'Test Event',
      startTime: new Date(2026, 2, 22, 14, 0, 0),
      endTime: new Date(2026, 2, 22, 15, 0, 0),
      description: 'A test',
      color: '#d4a574',
    }
    const id = await eventStore.add(event)
    const retrieved = await eventStore.get(id)
    expect(retrieved?.title).toBe('Test Event')
  })

  it('deletes an event', async () => {
    const id = await eventStore.add({
      title: 'Delete Me',
      startTime: new Date(),
      endTime: new Date(),
      description: '',
      color: '#d4a574',
    })
    await eventStore.remove(id)
    const retrieved = await eventStore.get(id)
    expect(retrieved).toBeUndefined()
  })

  it('queries events in a time range', async () => {
    await eventStore.add({
      title: 'In Range',
      startTime: new Date(2026, 2, 22, 10, 0, 0),
      endTime: new Date(2026, 2, 22, 11, 0, 0),
      description: '',
      color: '#d4a574',
    })
    await eventStore.add({
      title: 'Out of Range',
      startTime: new Date(2026, 5, 1, 10, 0, 0),
      endTime: new Date(2026, 5, 1, 11, 0, 0),
      description: '',
      color: '#d4a574',
    })
    const results = await eventStore.getInRange(
      new Date(2026, 2, 1),
      new Date(2026, 2, 31),
    )
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('In Range')
  })
})
