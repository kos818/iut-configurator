import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { PipeRenderer } from './PipeRenderer'
import { ConnectionPointsVisualizer } from './ConnectionPointsVisualizer'
import { ConnectionLinesVisualizer } from './ConnectionLinesVisualizer'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

export const Scene3D: React.FC = () => {
  const isDragging = useConfiguratorStore((state) => state.isDragging)

  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 60 }}
      shadows
      style={{ background: '#263238' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* Grid */}
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6f9fd8"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#2563eb"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* Camera controls - Disabled while dragging objects */}
        <OrbitControls
          enabled={!isDragging}
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={50}
        />

        {/* Render all pipes */}
        <PipeRenderer />

        {/* Render connection points */}
        <ConnectionPointsVisualizer />

        {/* Render connection lines */}
        <ConnectionLinesVisualizer />
      </Suspense>
    </Canvas>
  )
}
