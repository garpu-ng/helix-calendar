import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function HelixStrand() {
  const points: THREE.Vector3[] = []
  const radius = 2
  const turns = 5
  const segments = 200

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const angle = t * turns * Math.PI * 2
    const y = -t * 20
    points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
  }

  const curve = new THREE.CatmullRomCurve3(points)

  return (
    <mesh>
      <tubeGeometry args={[curve, 200, 0.15, 8, false]} />
      <meshStandardMaterial color="#d4a574" emissive="#d4a574" emissiveIntensity={0.8} />
    </mesh>
  )
}

export function App() {
  return (
    <Canvas
      camera={{ position: [8, -5, 8], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: '#0d0a07' }}
    >
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.3} />
      <HelixStrand />
      <OrbitControls />
      <fog attach="fog" args={['#0d0a07', 15, 40]} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
      </EffectComposer>
    </Canvas>
  )
}
