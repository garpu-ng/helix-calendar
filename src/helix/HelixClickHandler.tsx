import { useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { tToDate } from '../calendar/dateMapping'

interface HelixClickHandlerProps {
  tStart: number
  tEnd: number
  resolution: number
}

export function HelixClickHandler({ tStart, tEnd, resolution }: HelixClickHandlerProps) {
  const { camera, raycaster, pointer } = useThree()
  const setSelectedTime = useStore((s) => s.setSelectedTime)

  const handleClick = useCallback((e: THREE.Event) => {
    const point = (e as any).point as THREE.Vector3
    if (!point) return

    const yMin = -tStart * 0.0004
    const yMax = -tEnd * 0.0004
    const yFraction = (point.y - yMin) / (yMax - yMin)
    const t = tStart + yFraction * (tEnd - tStart)
    const date = tToDate(t)

    setSelectedTime(date)
  }, [tStart, tEnd, setSelectedTime])

  return (
    <mesh onClick={handleClick} visible={false}>
      <cylinderGeometry args={[12, 12, Math.abs(tEnd - tStart) * 0.0004, 32, 1, true]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  )
}
