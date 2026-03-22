import { getDaysInMonth, isLeapYear } from 'date-fns'

export function daysInMonth(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month))
}

export function daysInYear(year: number): number {
  return isLeapYear(new Date(year, 0, 1)) ? 366 : 365
}
