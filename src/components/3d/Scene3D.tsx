import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { PipeRenderer } from './PipeRenderer'
import { ConnectionPointsVisualizer } from './ConnectionPointsVisualizer'
import { ConnectionLinesVisualizer } from './ConnectionLinesVisualizer'
import { ZoomControls } from '../ui/ZoomControls'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3, Box3 } from 'three'
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
      minDistance={1}
      maxDistance={50}
    />
  )
}

export const Scene3D: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const components = useConfiguratorStore((state) => state.components)
  const [gridSize, setGridSize] = React.useState(20)
  const [gridCellSize, setGridCellSize] = React.useState(0.5)

  // Update grid based on camera distance (zoom level) and components
  useEffect(() => {
    if (!controlsRef.current) return

    const updateGrid = () => {
      if (!controlsRef.current) return

      const controls = controlsRef.current
      const camera = controls.object
      const distance = camera.position.distanceTo(controls.target)

      // Adjust cell size based on camera distance (zoom level)
      // Closer = smaller cells, farther = larger cells
      const baseCellSize = Math.max(0.1, Math.min(2.0, distance / 10))
      setGridCellSize(baseCellSize)

      // Adjust grid size based on components or camera distance
      let newGridSize = Math.max(20, distance * 2)

      if (components.length > 0) {
        // Calculate bounding box to determine optimal grid size
        const bbox = new Box3()
        components.forEach((component) => {
          bbox.expandByPoint(component.position)
          component.connectionPoints.forEach((cp) => {
            const worldPos = getWorldPosition(component, cp)
            bbox.expandByPoint(worldPos)
          })
        })

        const size = new Vector3()
        bbox.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)

        // Grid should be at least 2x the bounding box size
        newGridSize = Math.max(newGridSize, maxDim * 3)
      }

      setGridSize(Math.ceil(newGridSize))
    }

    // Update grid initially and on control changes
    updateGrid()

    const controls = controlsRef.current
    controls.addEventListener('change', updateGrid)

    return () => {
      controls.removeEventListener('change', updateGrid)
    }
  }, [components, controlsRef.current])

  // Automatically frame all components when they change
  useEffect(() => {
    if (components.length > 0 && controlsRef.current) {
      // Small delay to ensure components are rendered
      const timer = setTimeout(() => {
        handleFrameComponents()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [components.length])

  const handleFrameComponents = () => {
    if (!controlsRef.current || components.length === 0) return

    const controls = controlsRef.current
    const camera = controls.object

    // Calculate bounding box of all components
    const bbox = new Box3()

    components.forEach((component) => {
      // Add component position to bounding box
      bbox.expandByPoint(component.position)

      // Also consider connection points for more accurate bounds
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

    // Calculate diagonal of bounding box
    const maxDim = Math.max(size.x, size.y, size.z)

    // Calculate camera distance based on FOV and bounding box size
    const fov = 60 // degrees
    const fovRadians = (fov * Math.PI) / 180
    // For first element, use 1.1 padding (90% fill), otherwise use 1.5 padding
    const paddingFactor = components.length === 1 ? 1.1 : 1.5
    const cameraDistance = Math.max(3, maxDim / Math.tan(fovRadians / 2)) * paddingFactor

    // Position camera at an angle (45 degrees elevation, 45 degrees azimuth)
    const angle = Math.PI / 4 // 45 degrees
    const elevation = Math.PI / 4 // 45 degrees

    const offset = new Vector3(
      Math.cos(elevation) * Math.sin(angle) * cameraDistance,
      Math.sin(elevation) * cameraDistance,
      Math.cos(elevation) * Math.cos(angle) * cameraDistance
    )

    camera.position.copy(center.clone().add(offset))
    controls.target.copy(center)
    controls.update()

    // Adjust grid size based on bounding box
    const gridSizeValue = Math.max(10, Math.ceil(maxDim * 2))
    setGridSize(gridSizeValue)
  }

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
    // Frame all components instead of resetting to default position
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

        {/* Grid - adapts to zoom level and components */}
        <Grid
          args={[gridSize, gridSize]}
          cellSize={gridCellSize}
          cellThickness={gridCellSize * 0.5}
          cellColor="#6f9fd8"
          sectionSize={gridCellSize * 4}
          sectionThickness={gridCellSize}
          sectionColor="#2563eb"
          fadeDistance={Math.max(25, gridSize * 1.5)}
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
