import { describe, it, expect } from 'vitest'
import { dateToT, tToDate } from '../calendar/dateMapping'
import { helixPoint, generateHelixPoints } from '../helix/math'
import { HELIX_LEVELS } from '../helix/levels'

describe('integration: helix rendering pipeline', () => {
  it('generates valid geometry for all levels', () => {
    const now = new Date()
    const t = dateToT(now)

    for (let level = 0; level < HELIX_LEVELS.length; level++) {
      const points = generateHelixPoints(level, t - 1, t + 1, 50)
      expect(points.length).toBe(51)
      for (const p of points) {
        expect(isFinite(p.x)).toBe(true)
        expect(isFinite(p.y)).toBe(true)
        expect(isFinite(p.z)).toBe(true)
      }
    }
  })

  it('date roundtrip is accurate to within 1 second', () => {
    const dates = [
      new Date(),
      new Date(2000, 0, 1),
      new Date(2024, 1, 29, 12, 30, 45),
      new Date(1990, 6, 15, 8, 0, 0),
    ]
    for (const d of dates) {
      const t = dateToT(d)
      const result = tToDate(t)
      expect(Math.abs(result.getTime() - d.getTime())).toBeLessThan(1000)
    }
  })
})
