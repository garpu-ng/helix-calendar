import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'

const SCRUB_SPEEDS: Record<number, number> = {
  0: 365.25 * 24 * 60 * 60 * 1000 * 10,
  1: 365.25 * 24 * 60 * 60 * 1000,
  2: 30 * 24 * 60 * 60 * 1000,
  3: 24 * 60 * 60 * 1000,
  4: 60 * 60 * 1000,
  5: 60 * 1000,
  6: 1000,
  7: 100,
}

export function TimeScrub() {
  const { gl } = useThree()
  const scrubTime = useStore((s) => s.scrubTime)
  const zoomLevel = useStore((s) => s.zoomLevel)
  const isDragging = useRef(false)
  const lastY = useRef(0)

  useEffect(() => {
    const canvas = gl.domElement

    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isDragging.current = true
        lastY.current = e.clientY
        e.preventDefault()
      }
    }

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const deltaY = e.clientY - lastY.current
      lastY.current = e.clientY

      const primaryLevel = Math.floor(zoomLevel)
      const speed = SCRUB_SPEEDS[primaryLevel] ?? SCRUB_SPEEDS[4]
      scrubTime(deltaY * speed * 0.5)
    }

    const onUp = (e: MouseEvent) => {
      if (e.button === 2) isDragging.current = false
    }

    const onContext = (e: MouseEvent) => e.preventDefault()

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('contextmenu', onContext)

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('contextmenu', onContext)
    }
  }, [gl, scrubTime, zoomLevel])

  return null
}
