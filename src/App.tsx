import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { HelixRenderer } from './helix/HelixRenderer'
import { HelixClickHandler } from './helix/HelixClickHandler'
import { dateToT } from './calendar/dateMapping'
import { useStore } from './store/useStore'
import { Scanline } from './ui/Scanline'
import { TimeDisplay } from './ui/TimeDisplay'
import { SnapToNow } from './ui/SnapToNow'
import { ZoomController } from './camera/ZoomController'
import { TimeScrub } from './camera/TimeScrub'

export function App() {
  const navigatedTime = useStore((s) => s.navigatedTime)
  const zoomLevel = useStore((s) => s.zoomLevel)
  const tick = useStore((s) => s.tick)

  useEffect(() => {
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  const primaryLevel = Math.floor(zoomLevel)
  const zoomFraction = zoomLevel - primaryLevel
  const tCenter = dateToT(navigatedTime)

  return (
    <>
      <Canvas
        camera={{ position: [8, -5, 8], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: '#0d0a07' }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.3} />
        <HelixRenderer
          primaryLevel={primaryLevel}
          tCenter={tCenter}
          zoomFraction={zoomFraction}
        />
        <HelixClickHandler tStart={tCenter - 500} tEnd={tCenter + 500} resolution={400} />
        <OrbitControls mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: undefined }} />
        <fog attach="fog" args={['#0d0a07', 15, 40]} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        </EffectComposer>
        <ZoomController />
        <TimeScrub />
      </Canvas>
      <div className="overlay">
        <Scanline />
        <TimeDisplay />
        <SnapToNow />
      </div>
    </>
  )
}
