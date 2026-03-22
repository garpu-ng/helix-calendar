import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import {
  buildCaches, cachedPoint, cachedRadial, CurveCache,
  yearAngle, monthAngle, dayAngle, hourAngle, minuteAngle,
} from './math'
import {
  HELIX_COLOR, MONTH_HELIX_COLOR, DAY_HELIX_COLOR,
  HOUR_HELIX_COLOR, MINUTE_HELIX_COLOR,
  YEAR_START, YEAR_END,
} from './levels'

const MAX_POINTS = 40000

// ─── Level definitions ───────────────────────────────────────────────────

interface LevelDef {
  name: string
  color: string
  range: number         // ±years from navigatedYear
  edgeFade: number      // fade zone in years at each edge
  computeCutoff: number // camDist above which we skip compute
  tickStep: number      // years between ticks (0 = no ticks)
  tickWindow: number    // ±years for ticks
  tickLength: number
  tickFadeStart: number
  tickFadeRange: number
  minPtsPerYear: number
  bands: { dist3D: number; ptsPerYear: number }[]
}

const LEVELS: LevelDef[] = [
  { // Year
    name: 'year', color: HELIX_COLOR,
    range: (YEAR_END - YEAR_START) / 2, edgeFade: 0,
    computeCutoff: Infinity,
    tickStep: 1, tickWindow: 200, tickLength: 0.8,
    tickFadeStart: 30, tickFadeRange: 60,
    minPtsPerYear: 2,
    bands: [
      { dist3D: 5, ptsPerYear: 200 },
      { dist3D: 20, ptsPerYear: 50 },
      { dist3D: 100, ptsPerYear: 10 },
      { dist3D: Infinity, ptsPerYear: 2 },
    ],
  },
  { // Month
    name: 'month', color: MONTH_HELIX_COLOR,
    range: 20, edgeFade: 5,
    computeCutoff: 500,
    tickStep: 1 / 12, tickWindow: 15, tickLength: 0.08,
    tickFadeStart: 330, tickFadeRange: 120,
    minPtsPerYear: 180,
    bands: [
      { dist3D: 2, ptsPerYear: 600 },
      { dist3D: 6, ptsPerYear: 360 },
      { dist3D: Infinity, ptsPerYear: 180 },
    ],
  },
  { // Day — 365 rev/yr, need 30+ pts/rev = 11k pts/yr min
    name: 'day', color: DAY_HELIX_COLOR,
    range: 0.5, edgeFade: 0.1,
    computeCutoff: 50,
    tickStep: 1 / 365.25, tickWindow: 0.25, tickLength: 0.01,
    tickFadeStart: 2, tickFadeRange: 5,
    minPtsPerYear: 11000,
    bands: [
      { dist3D: 0.5, ptsPerYear: 25000 },
      { dist3D: 1.5, ptsPerYear: 15000 },
      { dist3D: Infinity, ptsPerYear: 11000 },
    ],
  },
  { // Hour — 8760 rev/yr, need 30+ pts/rev = 263k pts/yr min
    name: 'hour', color: HOUR_HELIX_COLOR,
    range: 0.02, edgeFade: 0.005,
    computeCutoff: 5,
    tickStep: 1 / (365.25 * 24), tickWindow: 0.005, tickLength: 0.002,
    tickFadeStart: 0.3, tickFadeRange: 0.5,
    minPtsPerYear: 263000,
    bands: [
      { dist3D: 0.05, ptsPerYear: 500000 },
      { dist3D: 0.15, ptsPerYear: 350000 },
      { dist3D: Infinity, ptsPerYear: 263000 },
    ],
  },
  { // Minute — 525600 rev/yr, need 30+ pts/rev = 15.8M pts/yr min
    name: 'minute', color: MINUTE_HELIX_COLOR,
    range: 0.0003, edgeFade: 0.00005,
    computeCutoff: 0.5,
    tickStep: 1 / (365.25 * 24 * 60), tickWindow: 0.00008, tickLength: 0.0003,
    tickFadeStart: 0.03, tickFadeRange: 0.05,
    minPtsPerYear: 15800000,
    bands: [
      { dist3D: 0.005, ptsPerYear: 30000000 },
      { dist3D: 0.015, ptsPerYear: 20000000 },
      { dist3D: Infinity, ptsPerYear: 15800000 },
    ],
  },
]

// Cache key names matching buildCaches output
const CACHE_KEYS = ['year', 'month', 'day', 'hour', 'minute'] as const
const PARENT_KEYS = ['spine', 'year', 'month', 'day', 'hour'] as const
const ANGLE_FNS = [yearAngle, monthAngle, dayAngle, hourAngle, minuteAngle]

// ─── Generator (uses cached points) ─────────────────────────────────────

function generateLine(
  cache: CurveCache,
  navP: THREE.Vector3,
  camPos: THREE.Vector3,
  bands: { dist3D: number; ptsPerYear: number }[],
  rangeStart: number,
  rangeEnd: number,
): [number, number, number][] {
  const points: [number, number, number][] = []
  const lowestRes = bands[bands.length - 1].ptsPerYear
  let t = rangeStart

  while (t <= rangeEnd) {
    const p = cache.getPoint(t)
    const ox = p.x - navP.x
    const oy = p.y - navP.y
    const oz = p.z - navP.z
    points.push([ox, oy, oz])

    if (points.length >= MAX_POINTS) {
      t += 1 / lowestRes
      continue
    }

    const dx = ox - camPos.x
    const dy = oy - camPos.y
    const dz = oz - camPos.z
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz)

    let ptsPerYear = lowestRes
    for (const band of bands) {
      if (d < band.dist3D) {
        ptsPerYear = band.ptsPerYear
        break
      }
    }
    t += 1 / ptsPerYear
  }

  return points
}

function generateTicks(
  cache: CurveCache,
  parentCache: CurveCache,
  angleFn: (t: number) => number,
  navP: THREE.Vector3,
  navigatedYear: number,
  halfWindow: number,
  step: number,
  tickLength: number,
): number[] {
  const start = Math.max(cache.tStart, Math.ceil((navigatedYear - halfWindow) / step) * step)
  const end = Math.min(cache.tEnd, Math.floor((navigatedYear + halfWindow) / step) * step)
  const positions: number[] = []

  for (let y = start; y <= end + step * 0.01; y += step) {
    if (y < cache.tStart || y > cache.tEnd) continue
    const p = cache.getPoint(y)
    const r = cachedRadial(cache, parentCache, y, angleFn)
    const ox = p.x - navP.x
    const oy = p.y - navP.y
    const oz = p.z - navP.z
    positions.push(ox, oy, oz)
    positions.push(
      ox + r.x * tickLength,
      oy + r.y * tickLength,
      oz + r.z * tickLength,
    )
  }

  return positions
}

// ─── Build line with edge fade ───────────────────────────────────────────

function buildFadedLine(
  pts: [number, number, number][],
  color: string,
  navigatedYear: number,
  rangeStart: number,
  rangeEnd: number,
  edgeFade: number,
): THREE.Line {
  const positions = new Float32Array(pts.length * 3)
  const colors = new Float32Array(pts.length * 4)
  const baseColor = new THREE.Color(color)
  const range = (rangeEnd - rangeStart) / 2
  const fadeStart = range - edgeFade

  for (let i = 0; i < pts.length; i++) {
    positions[i * 3] = pts[i][0]
    positions[i * 3 + 1] = pts[i][1]
    positions[i * 3 + 2] = pts[i][2]

    const t = pts.length > 1 ? i / (pts.length - 1) : 0
    const year = rangeStart + (rangeEnd - rangeStart) * t
    const dist = Math.abs(year - navigatedYear)
    const alpha = edgeFade > 0
      ? THREE.MathUtils.clamp(1 - (dist - fadeStart) / edgeFade, 0, 1)
      : 1

    colors[i * 4] = baseColor.r
    colors[i * 4 + 1] = baseColor.g
    colors[i * 4 + 2] = baseColor.b
    colors[i * 4 + 3] = alpha
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4))
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true }))
}

// ─── Component ───────────────────────────────────────────────────────────

interface HelixRendererProps {
  navigatedYear: number
}

export function HelixRenderer({ navigatedYear }: HelixRendererProps) {
  const tickMatRefs = useRef<(THREE.LineBasicMaterial | null)[]>(new Array(6).fill(null))

  const [camPos, setCamPos] = useState(() => new THREE.Vector3(10, 0, 10))
  const [camDist, setCamDist] = useState(14)
  const lastCamPos = useRef(new THREE.Vector3(10, 0, 10))

  useFrame(({ camera }) => {
    const dist = camera.position.length()

    const moved = camera.position.distanceTo(lastCamPos.current)
    if (moved / Math.max(0.001, dist) > 0.05) {
      lastCamPos.current.copy(camera.position)
      setCamPos(camera.position.clone())
      setCamDist(dist)
    }

    // Fade tick materials
    for (let i = 0; i < LEVELS.length; i++) {
      const mat = tickMatRefs.current[i]
      if (!mat) continue
      const level = LEVELS[i]
      const opacity = THREE.MathUtils.clamp(1 - (dist - level.tickFadeStart) / level.tickFadeRange, 0, 1)
      mat.opacity = opacity
      mat.visible = opacity > 0.01
    }
  })

  // Build all caches once per navigatedYear
  const caches = useMemo(() => buildCaches(navigatedYear), [navigatedYear])

  // Nav point = deepest available cache position
  const navP = useMemo(() => {
    const deepest = caches.minute ?? caches.hour ?? caches.day ?? caches.month ?? caches.year
    return deepest.getPoint(navigatedYear)
  }, [caches, navigatedYear])

  // Generate all level lines
  const levelData = useMemo(() => {
    const allCaches = [caches.year, caches.month, caches.day, caches.hour, caches.minute]
    const parentCaches = [caches.spine, caches.year, caches.month, caches.day, caches.hour]

    // Determine which level is the "focus" based on camera distance
    // The deepest visible level is the focus; parents get lighter
    let focusLevel = 0
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (camDist < LEVELS[i].computeCutoff) { focusLevel = i; break }
    }
    // Color interpolation: focus level = #222, each parent step lighter
    const colorForLevel = (i: number): string => {
      const stepsFromFocus = Math.max(0, focusLevel - i)
      // Each step away: darken less (222 → 777 → aaa → ccc → ddd)
      const grey = Math.min(0xdd, 0x22 + stepsFromFocus * 0x33)
      const hex = grey.toString(16).padStart(2, '0')
      return `#${hex}${hex}${hex}`
    }

    return LEVELS.map((level, i) => {
      const cache = allCaches[i]
      const parentCache = parentCaches[i]
      if (!cache || camDist >= level.computeCutoff) return null

      const start = i === 0
        ? YEAR_START
        : Math.max(cache.tStart, navigatedYear - level.range)
      const end = i === 0
        ? YEAR_END
        : Math.min(cache.tEnd, navigatedYear + level.range)

      // Line
      const pts = generateLine(cache, navP, camPos, level.bands, start, end)

      // Dynamic color: focus level is dark, parents are lighter
      const dynColor = colorForLevel(i)

      // Build line object (with edge fade for non-year levels)
      const lineObj = level.edgeFade > 0
        ? buildFadedLine(pts, dynColor, navigatedYear, start, end, level.edgeFade)
        : null // year level uses drei Line
      const linePoints = level.edgeFade === 0 ? pts : null

      // Ticks
      let tickGeo: THREE.BufferGeometry | null = null
      if (level.tickStep > 0 && parentCache) {
        const tickPos = generateTicks(
          cache, parentCache, ANGLE_FNS[i],
          navP, navigatedYear, level.tickWindow, level.tickStep, level.tickLength,
        )
        if (tickPos.length > 0) {
          tickGeo = new THREE.BufferGeometry()
          tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPos, 3))
        }
      }

      return { lineObj, linePoints, tickGeo, level, dynColor }
    })
  }, [caches, navigatedYear, navP, camPos, camDist])

  // Nav dot
  const circleMap = useMemo(() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    return new THREE.CanvasTexture(canvas)
  }, [])

  const dotGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    return geo
  }, [])

  return (
    <group>
      {levelData.map((data, i) => {
        if (!data) return null
        const { lineObj, linePoints, tickGeo, level, dynColor } = data
        return (
          <group key={level.name}>
            {linePoints && <Line points={linePoints} color={dynColor} lineWidth={1} />}
            {lineObj && <primitive object={lineObj} />}
            {tickGeo && (
              <lineSegments geometry={tickGeo}>
                <lineBasicMaterial
                  ref={(el) => { tickMatRefs.current[i] = el }}
                  color={dynColor}
                  transparent
                />
              </lineSegments>
            )}
          </group>
        )
      })}

      <points geometry={dotGeo}>
        <pointsMaterial
          color="#111111"
          size={7}
          sizeAttenuation={false}
          map={circleMap}
          alphaTest={0.5}
          transparent
        />
      </points>
    </group>
  )
}
