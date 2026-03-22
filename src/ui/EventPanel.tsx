import { useState } from 'react'
import { useStore } from '../store/useStore'
import { eventStore } from '../calendar/events'
import { format } from 'date-fns'

interface EventPanelProps {
  initialTime: Date
  eventId?: number
  initialTitle?: string
  initialDescription?: string
  initialColor?: string
  initialEndTime?: Date
  onClose: () => void
}

export function EventPanel({ initialTime, eventId, initialTitle, initialDescription, initialColor, initialEndTime, onClose }: EventPanelProps) {
  const loadEvents = useStore((s) => s.loadEvents)
  const [title, setTitle] = useState(initialTitle ?? '')
  const [startTime, setStartTime] = useState(format(initialTime, "yyyy-MM-dd'T'HH:mm"))
  const [endTime, setEndTime] = useState(
    format(initialEndTime ?? new Date(initialTime.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
  )
  const [description, setDescription] = useState(initialDescription ?? '')

  const handleSave = async () => {
    if (!title.trim()) return
    if (eventId) {
      await eventStore.update(eventId, {
        title: title.trim(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description,
      })
    } else {
      await eventStore.add({
        title: title.trim(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description,
        color: initialColor ?? '#e8b87a',
      })
    }
    await loadEvents()
    onClose()
  }

  const handleDelete = async () => {
    if (eventId) {
      await eventStore.remove(eventId)
      await loadEvents()
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="event-panel-overlay" onClick={onClose}>
      <div className="event-panel" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Event title" />
        <label>Start</label>
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <label>End</label>
        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
        <div className="time-jumper-actions">
          {eventId && (
            <button style={{ color: '#ff6b6b', borderColor: '#ff6b6b33' }} onClick={handleDelete}>
              Delete
            </button>
          )}
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>{eventId ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export function AddEventButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="add-event-btn" onClick={onClick}>+</button>
  )
}
