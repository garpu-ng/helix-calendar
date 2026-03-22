import * as THREE from 'three'

/**
 * Helix Calendar — 8 levels from spine to seconds.
 *
 * Performance: each level is built from a CACHED parent curve.
 * No recursive calls — O(n) per level, O(1) lookups via interpolation.
 *
 * Hierarchy:
 *   Spine → Year (1 rev/decade) → Month (1 rev/month) → Day (1 rev/day)
 *   → Hour (1 rev/hour) → Minute (1 rev/minute) → Second (1 rev/second)
 */

// ─── Constants ───────────────────────────────────────────────────────────

const RADIUS = 3
const MONTH_RADIUS = 0.25
const DAY_RADIUS = 0.04
const HOUR_RADIUS = 0.006
const MINUTE_RADIUS = 0.001
const PITCH = 8

// ─── Calendar helpers ────────────────────────────────────────────────────

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 1 && isLeapYear(year)) return 29
  return MONTH_DAYS[month]
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

/** Full calendar breakdown from fractional year. */
export function yearToCalendarFull(y: number) {
  const yr = Math.floor(y)
  const totalDayFrac = (y - yr) * daysInYear(yr)

  let remaining = totalDayFrac
  let month = 0
  for (let m = 0; m < 12; m++) {
    const dim = daysInMonth(yr, m)
    if (remaining < dim) {
      month = m
      break
    }
    remaining -= dim
    if (m === 11) { month = 11; remaining = Math.min(remaining, MONTH_DAYS[11] - 0.001) }
  }

  const dayFrac = remaining           // 0-based float day within month
  const day = Math.floor(dayFrac) + 1 // 1-based day
  const hourFrac = (dayFrac % 1) * 24
  const hour = Math.floor(hourFrac)
  const minuteFrac = (hourFrac % 1) * 60
  const minute = Math.floor(minuteFrac)
  const secondFrac = (minuteFrac % 1) * 60
  const second = Math.floor(secondFrac)

  // Day of week (Zeller-like, using JS Date for simplicity)
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  // Approximate — use year/month/day
  const jsDate = new Date(yr, month, day, hour, minute, second)
  const weekdayName = weekday[jsDate.getDay()] ?? 'Sun'

  return { year: yr, month, day, dayFrac: remaining, dim: daysInMonth(yr, month), hour, minute, second, weekdayName }
}

// ─── CurveCache — the performance core ───────────────────────────────────

interface CacheSample {
  pos: THREE.Vector3
  normal: THREE.Vector3
  binormal: THREE.Vector3
}

export class CurveCache {
  samples: CacheSample[]
  tStart: number
  tEnd: number
  count: number
  private dt: number

  constructor(tStart: number, tEnd: number, count: number) {
    this.tStart = tStart
    this.tEnd = tEnd
    this.count = count
    this.dt = (tEnd - tStart) / count
    this.samples = new Array(count + 1)
  }

  /** O(1) index from t value */
  private index(t: number): number {
    return ((t - this.tStart) / this.dt)
  }

  /** Interpolated position at t */
  getPoint(t: number): THREE.Vector3 {
    const idx = this.index(t)
    const i = Math.max(0, Math.min(this.count - 1, Math.floor(idx)))
    const frac = idx - i
    const a = this.samples[i]
    const b = this.samples[Math.min(i + 1, this.count)]
    return new THREE.Vector3().lerpVectors(a.pos, b.pos, frac)
  }

  /** Interpolated frame at t (lerp + renormalize) */
  getFrame(t: number): { normal: THREE.Vector3; binormal: THREE.Vector3 } {
    const idx = this.index(t)
    const i = Math.max(0, Math.min(this.count - 1, Math.floor(idx)))
    const frac = idx - i
    const a = this.samples[i]
    const b = this.samples[Math.min(i + 1, this.count)]

    const normal = new THREE.Vector3().lerpVectors(a.normal, b.normal, frac).normalize()
    const binormal = new THREE.Vector3().lerpVectors(a.binormal, b.binormal, frac).normalize()
    return { normal, binormal }
  }
}

// ─── Spine (level 0) — computed directly, no parent cache ────────────────

function spineXZ(rev: number): { x: number; z: number } {
  const x =
    Math.sin(rev * 0.05) * 60 + Math.sin(rev * 0.11 + 1.3) * 30 +
    Math.sin(rev * 0.23 + 2.7) * 15 + Math.sin(rev * 0.41 + 4.1) * 8 +
    Math.sin(rev * 0.67 + 5.8) * 4
  const z =
    Math.sin(rev * 0.06 + 0.5) * 60 + Math.sin(rev * 0.14 + 2.1) * 30 +
    Math.sin(rev * 0.27 + 3.4) * 15 + Math.sin(rev * 0.43 + 5.2) * 8 +
    Math.sin(rev * 0.71 + 6.3) * 4
  return { x, z }
}

function spinePointDirect(rev: number): THREE.Vector3 {
  const { x, z } = spineXZ(rev)
  return new THREE.Vector3(x, -rev * PITCH, z)
}

function buildSpineCache(tStart: number, tEnd: number, count: number): CurveCache {
  const cache = new CurveCache(tStart, tEnd, count)
  const revStart = tStart / 10
  const revEnd = tEnd / 10

  // First pass: compute positions
  for (let i = 0; i <= count; i++) {
    const t = tStart + (tEnd - tStart) * i / count
    const rev = t / 10
    cache.samples[i] = {
      pos: spinePointDirect(rev),
      normal: new THREE.Vector3(),
      binormal: new THREE.Vector3(),
    }
  }

  // Second pass: tangent + parallel-transport frame
  let prevNormal: THREE.Vector3 | null = null
  for (let i = 0; i <= count; i++) {
    const prev = cache.samples[Math.max(0, i - 1)]
    const next = cache.samples[Math.min(count, i + 1)]
    const tangent = new THREE.Vector3().subVectors(next.pos, prev.pos).normalize()

    if (!prevNormal) {
      // Initialize frame
      const ref = Math.abs(tangent.x) > 0.95
        ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
      prevNormal = new THREE.Vector3().crossVectors(tangent, ref).normalize()
    } else {
      // Parallel transport: project previous normal onto plane perpendicular to new tangent
      const dot = prevNormal.dot(tangent)
      prevNormal = prevNormal.clone().addScaledVector(tangent, -dot).normalize()
      if (prevNormal.lengthSq() < 1e-6) {
        const ref = Math.abs(tangent.x) > 0.95
          ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
        prevNormal = new THREE.Vector3().crossVectors(tangent, ref).normalize()
      }
    }

    cache.samples[i].normal = prevNormal.clone()
    cache.samples[i].binormal = new THREE.Vector3().crossVectors(tangent, prevNormal).normalize()
  }

  return cache
}

// ─── Generic helix builder from parent cache ─────────────────────────────

function buildHelixCache(
  parentCache: CurveCache,
  tStart: number,
  tEnd: number,
  count: number,
  radius: number,
  angleFn: (t: number) => number,
): CurveCache {
  const cache = new CurveCache(tStart, tEnd, count)

  // First pass: compute positions by coiling around parent
  for (let i = 0; i <= count; i++) {
    const t = tStart + (tEnd - tStart) * i / count
    const angle = angleFn(t)
    const pp = parentCache.getPoint(t)
    const { normal, binormal } = parentCache.getFrame(t)

    cache.samples[i] = {
      pos: pp.clone()
        .addScaledVector(normal, Math.cos(angle) * radius)
        .addScaledVector(binormal, Math.sin(angle) * radius),
      normal: new THREE.Vector3(),
      binormal: new THREE.Vector3(),
    }
  }

  // Second pass: parallel-transport frame
  let prevNormal: THREE.Vector3 | null = null
  for (let i = 0; i <= count; i++) {
    const prev = cache.samples[Math.max(0, i - 1)]
    const next = cache.samples[Math.min(count, i + 1)]
    const tangent = new THREE.Vector3().subVectors(next.pos, prev.pos).normalize()

    if (!prevNormal) {
      // Use parent radial as initial reference
      const t = tStart + (tEnd - tStart) * i / count
      const angle = angleFn(t)
      const { normal: pn, binormal: pb } = parentCache.getFrame(t)
      const radial = new THREE.Vector3()
        .addScaledVector(pn, Math.cos(angle))
        .addScaledVector(pb, Math.sin(angle))
      prevNormal = new THREE.Vector3().crossVectors(tangent, radial).normalize()
      if (prevNormal.lengthSq() < 1e-6) {
        const ref = Math.abs(tangent.x) > 0.95
          ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
        prevNormal = new THREE.Vector3().crossVectors(tangent, ref).normalize()
      }
    } else {
      const dot = prevNormal.dot(tangent)
      prevNormal = prevNormal.clone().addScaledVector(tangent, -dot).normalize()
      if (prevNormal.lengthSq() < 1e-6) {
        const ref = Math.abs(tangent.x) > 0.95
          ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
        prevNormal = new THREE.Vector3().crossVectors(tangent, ref).normalize()
      }
    }

    cache.samples[i].normal = prevNormal.clone()
    cache.samples[i].binormal = new THREE.Vector3().crossVectors(tangent, prevNormal).normalize()
  }

  return cache
}

// ─── Angle functions per level ───────────────────────────────────────────

function yearAngle(t: number): number {
  return (t / 10) * Math.PI * 2
}

function monthAngle(t: number): number {
  return (t - Math.floor(t)) * 12 * Math.PI * 2
}

function dayAngle(t: number): number {
  const yr = Math.floor(t)
  const totalDayFrac = (t - yr) * daysInYear(yr)
  let remaining = totalDayFrac
  for (let m = 0; m < 12; m++) {
    const dim = daysInMonth(yr, m)
    if (remaining < dim) return remaining * Math.PI * 2
    remaining -= dim
  }
  return remaining * Math.PI * 2
}

function hourAngle(t: number): number {
  // Extract fractional day, multiply by 24 for hour revolutions
  const yr = Math.floor(t)
  const totalDayFrac = (t - yr) * daysInYear(yr)
  let remaining = totalDayFrac
  for (let m = 0; m < 12; m++) {
    const dim = daysInMonth(yr, m)
    if (remaining < dim) break
    remaining -= dim
  }
  // remaining = days into month (float). Fractional part = time within day
  const dayTime = remaining % 1 // 0-1 within a day
  return dayTime * 24 * Math.PI * 2
}

function minuteAngle(t: number): number {
  const yr = Math.floor(t)
  const totalDayFrac = (t - yr) * daysInYear(yr)
  let remaining = totalDayFrac
  for (let m = 0; m < 12; m++) {
    const dim = daysInMonth(yr, m)
    if (remaining < dim) break
    remaining -= dim
  }
  const dayTime = remaining % 1
  const hourTime = (dayTime * 24) % 1 // fractional hour
  return hourTime * 60 * Math.PI * 2
}


// ─── Build all caches ────────────────────────────────────────────────────

export interface HelixCaches {
  spine: CurveCache
  year: CurveCache
  month: CurveCache | null
  day: CurveCache | null
  hour: CurveCache | null
  minute: CurveCache | null
}

export function buildCaches(navigatedYear: number): HelixCaches {
  const YEAR_START = 0
  const YEAR_END = 3000

  // Spine: full range, ~1 sample per 3 years
  const spine = buildSpineCache(YEAR_START, YEAR_END, 1000)

  // Year: full range, ~2 samples per year
  const year = buildHelixCache(spine, YEAR_START, YEAR_END, 6000, RADIUS, yearAngle)

  // Month: ±20 years, 12 rev/yr, 50 samples/rev = 600/yr
  const mStart = Math.max(YEAR_START, navigatedYear - 20)
  const mEnd = Math.min(YEAR_END, navigatedYear + 20)
  const month = buildHelixCache(year, mStart, mEnd, Math.round((mEnd - mStart) * 600), MONTH_RADIUS, monthAngle)

  // Day: ±0.5 years, 365 rev/yr, 50 samples/rev = 18250/yr
  const dStart = Math.max(YEAR_START, navigatedYear - 0.5)
  const dEnd = Math.min(YEAR_END, navigatedYear + 0.5)
  const day = buildHelixCache(month, dStart, dEnd, Math.round((dEnd - dStart) * 18250), DAY_RADIUS, dayAngle)

  // Hour: ±0.02 years (~1 week), 8760 rev/yr, 50 samples/rev = 438000/yr
  const hStart = Math.max(YEAR_START, navigatedYear - 0.02)
  const hEnd = Math.min(YEAR_END, navigatedYear + 0.02)
  const hour = buildHelixCache(day, hStart, hEnd, Math.round((hEnd - hStart) * 438000), HOUR_RADIUS, hourAngle)

  // Minute: ±0.0003 years (~2.6 hours), 525600 rev/yr, 50 samples/rev = 26280000/yr
  const miStart = Math.max(YEAR_START, navigatedYear - 0.0003)
  const miEnd = Math.min(YEAR_END, navigatedYear + 0.0003)
  const minute = buildHelixCache(hour, miStart, miEnd, Math.round((miEnd - miStart) * 26280000), MINUTE_RADIUS, minuteAngle)

  return { spine, year, month, day, hour, minute }
}

// ─── Point functions using caches (for renderer) ─────────────────────────

export function cachedPoint(cache: CurveCache, t: number): THREE.Vector3 {
  return cache.getPoint(t)
}

export function cachedRadial(cache: CurveCache, parentCache: CurveCache, t: number, angleFn: (t: number) => number): THREE.Vector3 {
  const angle = angleFn(t)
  const { normal, binormal } = parentCache.getFrame(t)
  return new THREE.Vector3()
    .addScaledVector(normal, Math.cos(angle))
    .addScaledVector(binormal, Math.sin(angle))
}

// Keep legacy exports for tick radial functions
export { yearAngle, monthAngle, dayAngle, hourAngle, minuteAngle }
export { RADIUS, PITCH, MONTH_RADIUS, DAY_RADIUS, HOUR_RADIUS, MINUTE_RADIUS }
