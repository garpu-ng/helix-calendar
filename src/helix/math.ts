import * as THREE from 'three'
import { HELIX_LEVELS, Y_SCALE } from './levels'
import { tToDate, levelFraction } from '../calendar/dateMapping'

export function helixPoint(level: number, t: number): THREE.Vector3 {
  if (level === 0) {
    return new THREE.Vector3(0, -t * Y_SCALE, 0)
  }

  const levelDef = HELIX_LEVELS[level]
  const parentPoint = helixPoint(level - 1, t)

  const date = tToDate(t)
  const fraction = levelFraction(date, level)
  const angle = fraction * Math.PI * 2

  const r = levelDef.radius
  const offset = new THREE.Vector3(
    Math.cos(angle) * r,
    0,
    Math.sin(angle) * r,
  )

  return parentPoint.clone().add(offset)
}

export function generateHelixPoints(
  level: number,
  tStart: number,
  tEnd: number,
  resolution: number = 200,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= resolution; i++) {
    const t = tStart + (tEnd - tStart) * (i / resolution)
    points.push(helixPoint(level, t))
  }
  return points
}
