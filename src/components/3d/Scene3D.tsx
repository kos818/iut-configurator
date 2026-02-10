import React, { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { PipeRenderer } from './PipeRenderer'
import { ConnectionPointsVisualizer } from './ConnectionPointsVisualizer'
import { ConnectionLinesVisualizer } from './ConnectionLinesVisualizer'
import { ConnectionPointPositionTracker, ConnectionPointUI } from './ConnectionPointOverlay'
import { ZoomControls } from '../ui/ZoomControls'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { useCADStore } from '../../store/cadStore'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3, Box3, OrthographicCamera, Mesh } from 'three'
import { getWorldPosition } from '../../utils/connectionHelpers'

// Camera controls component to handle zoom
const CameraControls: React.FC<{ controlsRef: React.MutableRefObject<OrbitControlsImpl | null> }> = ({ controlsRef }) => {
  const isDragging = useConfiguratorStore((state) => state.isDragging)

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      enableDamping
      dampingFactor={0.05}
    />
  )
}

// Outline effect reading selected mesh from cadStore
const OutlineEffect: React.FC = () => {
  const selectedId = useCADStore((s) => s.selectedId)
  const meshRefs = useCADStore((s) => s.meshRefs)

  const selectedMeshes = useMemo(() => {
    if (!selectedId) return []
    const meshes: Mesh[] = []
    // Gather all mesh refs that match the selectedId
    for (const [id, ref] of meshRefs) {
      if (id === selectedId && ref.current) {
        meshes.push(ref.current)
      }
    }
    return meshes
  }, [selectedId, meshRefs])

  if (selectedMeshes.length === 0) return null

  return (
    <EffectComposer autoClear={false}>
      <Outline
        selection={selectedMeshes}
        edgeStrength={3}
        pulseSpeed={0}
        visibleEdgeColor={0x1a1a1a}
        hiddenEdgeColor={0x1a1a1a}
        blur
        xRay={false}
      />
    </EffectComposer>
  )
}

export const Scene3D: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const components = useConfiguratorStore((state) => state.components)
  const setSelected = useCADStore((s) => s.setSelected)

  // Automatically frame all components when they change (count or positions)
  useEffect(() => {
    if (components.length > 0 && controlsRef.current) {
      const timer = setTimeout(() => {
        handleFrameComponents()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [components.length, components.map(c => `${c.position.x},${c.position.y},${c.position.z}`).join('|')])

  const handleFrameComponents = () => {
    if (!controlsRef.current || components.length === 0) return

    const controls = controlsRef.current
    const camera = controls.object as OrthographicCamera

    // Calculate bounding box of all components
    const bbox = new Box3()

    components.forEach((component) => {
      bbox.expandByPoint(component.position)
      component.connectionPoints.forEach((cp) => {
        const worldPos = getWorldPosition(component, cp)
        bbox.expandByPoint(worldPos)
      })
    })

    // Calculate center and size
    const center = new Vector3()
    bbox.getCenter(center)
    const size = new Vector3()
    bbox.getSize(size)

    const maxDim = Math.max(size.x, size.y, size.z)

    // For orthographic camera, set zoom based on bounding box size
    // The camera frustum half-height at zoom=1 is roughly canvas_height/2
    // We want the bounding box to fit with some padding
    const paddingFactor = components.length === 1 ? 1.5 : 1.0
    const targetZoom = Math.max(10, 80 / Math.max(0.1, maxDim) * paddingFactor)

    camera.zoom = Math.min(200, targetZoom)
    camera.updateProjectionMatrix()

    // Position camera at an angle (45 degrees elevation, 45 degrees azimuth)
    const cameraDistance = 20
    const angle = Math.PI / 4
    const elevation = Math.PI / 4

    const offset = new Vector3(
      Math.cos(elevation) * Math.sin(angle) * cameraDistance,
      Math.sin(elevation) * cameraDistance,
      Math.cos(elevation) * Math.cos(angle) * cameraDistance
    )

    camera.position.copy(center.clone().add(offset))
    controls.target.copy(center)
    controls.update()
  }

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as OrthographicCamera
      camera.zoom = Math.min(500, camera.zoom * 1.25)
      camera.updateProjectionMatrix()
      controlsRef.current.update()
    }
  }

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as OrthographicCamera
      camera.zoom = Math.max(5, camera.zoom * 0.8)
      camera.updateProjectionMatrix()
      controlsRef.current.update()
    }
  }

  const handleResetView = () => {
    handleFrameComponents()
  }

  const handlePanUp = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const panAmount = 0.5
      controls.target.y += panAmount
      controls.object.position.y += panAmount
      controls.update()
    }
  }

  const handlePanDown = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const panAmount = 0.5
      controls.target.y -= panAmount
      controls.object.position.y -= panAmount
      controls.update()
    }
  }

  const handlePanLeft = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const panAmount = 0.5
      controls.target.x -= panAmount
      controls.object.position.x -= panAmount
      controls.update()
    }
  }

  const handlePanRight = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      const panAmount = 0.5
      controls.target.x += panAmount
      controls.object.position.x += panAmount
      controls.update()
    }
  }

  const handlePointerMissed = () => {
    setSelected(null)
  }

  return (
    <div className="relative w-full h-full">
    <Canvas
      orthographic
      camera={{ zoom: 80, position: [10, 10, 10] }}
      style={{ background: '#263238' }}
      onPointerMissed={handlePointerMissed}
    >
      <Suspense fallback={null}>
        {/* Flat CAD lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, 8, -3]} intensity={0.4} />

        {/* Dark grid at y=0 */}
        <Grid
          infiniteGrid
          sectionSize={1}
          sectionColor="#444444"
          cellSize={0.25}
          cellColor="#222222"
          cellThickness={0.5}
          sectionThickness={1}
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
        />

        {/* Camera controls */}
        <CameraControls controlsRef={controlsRef} />

        {/* Render all pipes */}
        <PipeRenderer />

        {/* Render connection points */}
        <ConnectionPointsVisualizer />

        {/* Render connection lines */}
        <ConnectionLinesVisualizer />

        {/* Track connection point positions for 2D overlay */}
        <ConnectionPointPositionTracker />

        {/* Outline postprocessing */}
        <OutlineEffect />
      </Suspense>
    </Canvas>

      {/* 2D overlay for connection point UI */}
      <ConnectionPointUI />

      {/* Zoom & Pan Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onPanUp={handlePanUp}
        onPanDown={handlePanDown}
        onPanLeft={handlePanLeft}
        onPanRight={handlePanRight}
      />
    </div>
  )
}
