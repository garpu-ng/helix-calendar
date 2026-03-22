import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CalendarEvent } from '../calendar/events'
import { dateToT } from '../calendar/dateMapping'
import { helixPoint } from '../helix/math'

interface EventMarkersProps {
  events: CalendarEvent[]
  primaryLevel: number
  onEventClick?: (event: CalendarEvent) => void
}

export function EventMarkers({ events, primaryLevel, onEventClick }: EventMarkersProps) {
  return (
    <group>
      {events.map((event) => (
        <SingleMarker key={event.id} event={event} level={primaryLevel} onEventClick={onEventClick} />
      ))}
    </group>
  )
}

function SingleMarker({ event, level, onEventClick }: { event: CalendarEvent; level: number; onEventClick?: (event: CalendarEvent) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const t = dateToT(event.startTime)
  const position = helixPoint(level, t)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.15
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <mesh ref={meshRef} position={position} onClick={(e) => {
      e.stopPropagation()
      onEventClick?.(event)
    }}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={event.color}
        emissive={event.color}
        emissiveIntensity={1.2}
      />
    </mesh>
  )
}
