import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { HelixRenderer } from './helix/HelixRenderer'
import { useStore } from './store/useStore'
import { yearToCalendarFull } from './helix/math'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function CameraDistTracker({ distRef }: { distRef: React.MutableRefObject<number> }) {
  useFrame(({ camera }) => {
    distRef.current = camera.position.length()
  })
  return null
}

function ZoomIndicator({ distRef }: { distRef: React.MutableRefObject<number> }) {
  const [dist, setDist] = useState(14)
  useEffect(() => {
    const id = setInterval(() => setDist(distRef.current), 200)
    return () => clearInterval(id)
  }, [distRef])
  return (
    <div className="zoom-indicator">
      zoom: {dist.toFixed(1)}
    </div>
  )
}

function TimeDisplay() {
  const navigatedYear = useStore((s) => s.navigatedYear)
  const cal = yearToCalendarFull(navigatedYear)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="time-display">
      <div className="weekday">{cal.weekdayName}</div>
      <div className="date">{cal.year}-{pad(cal.month + 1)}-{pad(cal.day)}</div>
      <div className="time">{pad(cal.hour)}:{pad(cal.minute)}:{pad(cal.second)}</div>
    </div>
  )
}

export function App() {
  const scrubYear = useStore((s) => s.scrubYear)
  const tick = useStore((s) => s.tick)
  const navigatedYear = useStore((s) => s.navigatedYear)
  const camDistRef = useRef(14)

  // Real-time tick every second
  useEffect(() => {
    const id = setInterval(tick, 100) // smooth sub-second movement
    return () => clearInterval(id)
  }, [tick])

  // Right-click drag for time scrubbing
  const isDragging = useRef(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isDragging.current = true
        lastY.current = e.clientY
      }
    }
    const onMove = (e: MouseEvent) => {
      if (!(e.buttons & 2)) {
        isDragging.current = false
        return
      }
      if (!isDragging.current) return
      const dy = e.clientY - lastY.current
      lastY.current = e.clientY
      scrubYear(dy * 0.5)
    }
    const onUp = (e: MouseEvent) => {
      if (e.button === 2) isDragging.current = false
    }
    const prevent = (e: Event) => e.preventDefault()

    window.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('contextmenu', prevent)

    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('contextmenu', prevent)
    }
  }, [scrubYear])

  return (
    <>
      <Canvas
        camera={{ position: [10, 0, 10], fov: 50, near: 0.0000001, far: 100000 }}
        gl={{ antialias: true }}
        style={{ background: '#f5f0eb' }}
      >
        <HelixRenderer navigatedYear={navigatedYear} />
        <CameraDistTracker distRef={camDistRef} />
        <OrbitControls
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: undefined as any,
          }}
          enableDamping
          dampingFactor={0.1}
          minDistance={0.0000001}
        />
      </Canvas>
      <div className="overlay">
        <div className="scanline" />
        <TimeDisplay />
        <ZoomIndicator distRef={camDistRef} />
      </div>
    </>
  )
}
