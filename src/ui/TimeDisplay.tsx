import { useStore } from '../store/useStore'
import { format } from 'date-fns'

export function TimeDisplay() {
  const navigatedTime = useStore((s) => s.navigatedTime)

  const weekday = format(navigatedTime, 'EEEE')
  const date = format(navigatedTime, 'yyyy-MM-dd')
  const time = format(navigatedTime, 'HH:mm:ss')

  return (
    <div className="time-display">
      <div className="weekday">{weekday}</div>
      <div className="date">{date}</div>
      <div className="time">{time}</div>
    </div>
  )
}
