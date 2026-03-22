import { useState } from 'react'
import { useStore } from '../store/useStore'
import { format } from 'date-fns'
import { TimeJumper } from './TimeJumper'

export function TimeDisplay() {
  const navigatedTime = useStore((s) => s.navigatedTime)
  const [showJumper, setShowJumper] = useState(false)

  const weekday = format(navigatedTime, 'EEEE')
  const date = format(navigatedTime, 'yyyy-MM-dd')
  const time = format(navigatedTime, 'HH:mm:ss')

  return (
    <>
      <div className="time-display" onClick={() => setShowJumper(true)}>
        <div className="weekday">{weekday}</div>
        <div className="date">{date}</div>
        <div className="time">{time}</div>
      </div>
      {showJumper && <TimeJumper onClose={() => setShowJumper(false)} />}
    </>
  )
}
