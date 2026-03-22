import * as THREE from 'three'
import { generateHelixPoints } from './math'

export interface HelixCurveOptions {
  level: number
  tStart: number
  tEnd: number
  resolution?: number
}

export function createHelixCurve(opts: HelixCurveOptions): THREE.CatmullRomCurve3 {
  const points = generateHelixPoints(
    opts.level,
    opts.tStart,
    opts.tEnd,
    opts.resolution ?? 300,
  )
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
}

export function tubeRadius(level: number): number {
  const baseRadius = 0.15
  return baseRadius * Math.pow(0.6, level)
}
