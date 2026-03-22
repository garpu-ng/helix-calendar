import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HELIX_LEVELS } from './levels'
import { createHelixCurve, tubeRadius } from './geometry'
import { useStore } from '../store/useStore'
import { dateToT } from '../calendar/dateMapping'
import { helixPoint } from './math'

interface HelixRendererProps {
  primaryLevel: number
  tCenter: number
  zoomFraction: number
}

function NowIndicator({ level }: { level: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const currentTime = useStore((s) => s.currentTime)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = dateToT(currentTime)
    const pos = helixPoint(level, t)
    meshRef.current.position.copy(pos)

    const pulse = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3
    meshRef.current.scale.setScalar(pulse)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial
        color="#fae0aa"
        emissive="#fae0aa"
        emissiveIntensity={2.0}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

export function HelixRenderer({ primaryLevel, tCenter, zoomFraction }: HelixRendererProps) {
  const levelsToRender = useMemo(() => {
    const levels: { level: number; opacity: number }[] = []

    if (primaryLevel > 0) {
      levels.push({ level: primaryLevel - 1, opacity: 0.3 })
    }

    levels.push({ level: primaryLevel, opacity: 1.0 })

    if (primaryLevel < HELIX_LEVELS.length - 1 && zoomFraction > 0.2) {
      const childOpacity = Math.min(1, (zoomFraction - 0.2) / 0.6)
      levels.push({ level: primaryLevel + 1, opacity: childOpacity })
    }

    return levels
  }, [primaryLevel, zoomFraction])

  return (
    <group>
      {levelsToRender.map(({ level, opacity }) => (
        <HelixLevel
          key={level}
          level={level}
          tCenter={tCenter}
          opacity={opacity}
        />
      ))}
      <NowIndicator level={primaryLevel} />
    </group>
  )
}

function HelixLevel({ level, tCenter, opacity }: { level: number; tCenter: number; opacity: number }) {
  const levelDef = HELIX_LEVELS[level]

  const { curve, radius } = useMemo(() => {
    const span = 3.0 // how many t-units to show (NOTE: t is in days, so this is 3 days — may need tuning)
    const c = createHelixCurve({
      level,
      tStart: tCenter - span / 2,
      tEnd: tCenter + span / 2,
      resolution: 400,
    })
    return { curve: c, radius: tubeRadius(level) }
  }, [level, tCenter])

  return (
    <mesh>
      <tubeGeometry args={[curve, 400, radius, 8, false]} />
      <meshStandardMaterial
        color={levelDef.color}
        emissive={levelDef.color}
        emissiveIntensity={levelDef.emissiveIntensity * opacity}
        transparent={opacity < 1}
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
