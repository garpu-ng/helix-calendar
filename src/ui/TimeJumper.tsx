import { useState } from 'react'
import { useStore } from '../store/useStore'
import { format } from 'date-fns'

interface TimeJumperProps {
  onClose: () => void
}

export function TimeJumper({ onClose }: TimeJumperProps) {
  const navigatedTime = useStore((s) => s.navigatedTime)
  const setNavigatedTime = useStore((s) => s.setNavigatedTime)

  const [value, setValue] = useState(format(navigatedTime, "yyyy-MM-dd'T'HH:mm:ss"))

  const handleGo = () => {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      setNavigatedTime(date)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGo()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="time-jumper-overlay" onClick={onClose}>
      <div className="time-jumper" onClick={(e) => e.stopPropagation()}>
        <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#a0845c' }}>
          Jump to date & time
        </label>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          step="1"
          autoFocus
        />
        <div className="time-jumper-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleGo}>Go</button>
        </div>
      </div>
    </div>
  )
}
