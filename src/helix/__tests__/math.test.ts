import { describe, it, expect } from 'vitest'
import { helixPoint, generateHelixPoints } from '../math'
import { dateToT, tToDate, levelFraction } from '../../calendar/dateMapping'

describe('dateToT / tToDate', () => {
  it('roundtrips accurately to within 1 second', () => {
    const dates = [
      new Date(2026, 2, 22, 14, 30, 15),
      new Date(2000, 0, 1, 0, 0, 0),
      new Date(2024, 1, 29, 12, 0, 0),
      new Date(1999, 11, 31, 23, 59, 59),
    ]
    for (const d of dates) {
      const t = dateToT(d)
      const result = tToDate(t)
      expect(Math.abs(result.getTime() - d.getTime())).toBeLessThan(1000)
    }
  })

  it('is monotonically increasing', () => {
    const d1 = new Date(2026, 0, 1)
    const d2 = new Date(2026, 5, 15)
    const d3 = new Date(2026, 11, 31)
    expect(dateToT(d2)).toBeGreaterThan(dateToT(d1))
    expect(dateToT(d3)).toBeGreaterThan(dateToT(d2))
  })
})

describe('levelFraction', () => {
  it('returns 0-1 for all levels', () => {
    const date = new Date(2026, 2, 22, 14, 30, 15)
    for (let level = 0; level <= 7; level++) {
      const frac = levelFraction(date, level)
      expect(frac).toBeGreaterThanOrEqual(0)
      expect(frac).toBeLessThan(1)
    }
  })
})

describe('helixPoint', () => {
  it('returns a point on the vertical axis for level 0', () => {
    const t = dateToT(new Date(2026, 2, 22))
    const p = helixPoint(0, t)
    expect(p.x).toBeCloseTo(0, 5)
    expect(p.z).toBeCloseTo(0, 5)
    expect(p.y).toBeLessThan(0)
  })

  it('returns a point offset from parent axis for level 1', () => {
    const t = dateToT(new Date(2026, 2, 22))
    const p = helixPoint(1, t)
    expect(Math.sqrt(p.x ** 2 + p.z ** 2)).toBeGreaterThan(0)
  })

  it('nested levels produce different positions than their parent', () => {
    const t = dateToT(new Date(2026, 2, 22, 14, 30))
    const parent = helixPoint(3, t)
    const child = helixPoint(4, t)
    const dist = parent.distanceTo(child)
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThanOrEqual(1.0 + 1e-9)
  })

  it('generates finite geometry for all levels', () => {
    const t = dateToT(new Date())
    for (let level = 0; level <= 7; level++) {
      const p = helixPoint(level, t)
      expect(isFinite(p.x)).toBe(true)
      expect(isFinite(p.y)).toBe(true)
      expect(isFinite(p.z)).toBe(true)
    }
  })
})

describe('generateHelixPoints', () => {
  it('generates the requested number of points', () => {
    const t = dateToT(new Date())
    const points = generateHelixPoints(4, t - 10, t + 10, 50)
    expect(points.length).toBe(51)
  })
})
