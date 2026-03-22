import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { HelixRenderer } from './helix/HelixRenderer'
import { dateToT } from './calendar/dateMapping'

export function App() {
  const now = new Date()
  const tCenter = dateToT(now)

  return (
    <Canvas
      camera={{ position: [8, -5, 8], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: '#0d0a07' }}
    >
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.3} />
      <HelixRenderer primaryLevel={4} tCenter={tCenter} zoomFraction={0.0} />
      <OrbitControls />
      <fog attach="fog" args={['#0d0a07', 15, 40]} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
      </EffectComposer>
    </Canvas>
  )
}
