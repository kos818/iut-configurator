import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { PipeRenderer } from './PipeRenderer'
import { ConnectionPointsVisualizer } from './ConnectionPointsVisualizer'
import { ConnectionLinesVisualizer } from './ConnectionLinesVisualizer'
import { ZoomControls } from '../ui/ZoomControls'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// Camera controls component to handle zoom
const CameraControls: React.FC<{ controlsRef: React.MutableRefObject<OrbitControlsImpl | null> }> = ({ controlsRef }) => {
  const isDragging = useConfiguratorStore((state) => state.isDragging)

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={50}
    />
  )
}

export const Scene3D: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object
      const distance = camera.position.distanceTo(controls.target)
      const newDistance = Math.max(1, distance * 0.8) // Zoom in 20%

      const direction = camera.position.clone().sub(controls.target).normalize()
      camera.position.copy(controls.target.clone().add(direction.multiplyScalar(newDistance)))
      controls.update()
    }
  }

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object
      const distance = camera.position.distanceTo(controls.target)
      const newDistance = Math.min(50, distance * 1.2) // Zoom out 20%

      const direction = camera.position.clone().sub(controls.target).normalize()
      camera.position.copy(controls.target.clone().add(direction.multiplyScalar(newDistance)))
      controls.update()
    }
  }

  const handleResetView = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const camera = controls.object

      // Reset to default position
      camera.position.set(3, 3, 3)
      controls.target.set(0, 0, 0)
      controls.update()
    }
  }

  return (
    <div className="relative w-full h-full">
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
        <CameraControls controlsRef={controlsRef} />

        {/* Render all pipes */}
        <PipeRenderer />

        {/* Render connection points */}
        <ConnectionPointsVisualizer />

        {/* Render connection lines */}
        <ConnectionLinesVisualizer />
      </Suspense>
    </Canvas>

      {/* Zoom Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />
    </div>
  )
}
