import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'

export function ZoomController() {
  const { gl } = useThree()
  const setZoomLevel = useStore((s) => s.setZoomLevel)
  const zoomLevel = useStore((s) => s.zoomLevel)

  useEffect(() => {
    const canvas = gl.domElement

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.15 : -0.15
      const newZoom = Math.max(0, Math.min(7, zoomLevel + delta))
      setZoomLevel(newZoom)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [gl, zoomLevel, setZoomLevel])

  return null
}
