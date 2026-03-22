import { differenceInMilliseconds, getDaysInMonth } from 'date-fns'

const EPOCH = new Date(2000, 0, 1, 0, 0, 0)
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function dateToT(date: Date): number {
  return differenceInMilliseconds(date, EPOCH) / MS_PER_DAY
}

export function tToDate(t: number): Date {
  return new Date(EPOCH.getTime() + t * MS_PER_DAY)
}

export function levelFraction(date: Date, level: number): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const ms = date.getMilliseconds()

  switch (level) {
    case 0: return (year % 100) / 100
    case 1: return (year % 10) / 10
    case 2: return month / 12
    case 3: { const dim = getDaysInMonth(date); return (day - 1) / dim }
    case 4: return (hour + minute / 60 + second / 3600) / 24
    case 5: return (minute + second / 60) / 60
    case 6: return (second + ms / 1000) / 60
    case 7: return ms / 1000
    default: return 0
  }
}
