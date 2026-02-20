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
import { DN_TO_MM } from '../../types'
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
  const animationRef = useRef<number | null>(null)
  const prevCountRef = useRef(0)

  // Automatically frame all components when a new one is added
  useEffect(() => {
    if (components.length > 0 && controlsRef.current) {
      // Slightly longer delay for the first component (model might still be loading)
      const delay = prevCountRef.current === 0 ? 350 : 200
      const timer = setTimeout(() => {
        fitToView(components.length !== prevCountRef.current)
      }, delay)
      prevCountRef.current = components.length
      return () => clearTimeout(timer)
    }
    prevCountRef.current = components.length
  }, [components.length, components.map(c => `${c.position.x},${c.position.y},${c.position.z}`).join('|')])

  /**
   * Frame all components so the arrangement nearly fills the viewport.
   * Uses the orthographic camera's actual frustum dimensions for an accurate zoom.
   */
  const fitToView = (animate = true) => {
    if (!controlsRef.current || components.length === 0) return

    const controls = controlsRef.current
    const camera = controls.object as OrthographicCamera

    // --- 1. Build a bounding box from all components ---
    const bbox = new Box3()

    components.forEach((component) => {
      // Add component centre
      bbox.expandByPoint(component.position)
      // Add all connection point world positions
      component.connectionPoints.forEach((cp) => {
        const worldPos = getWorldPosition(component, cp)
        bbox.expandByPoint(worldPos)
      })
    })

    // Expand bbox by the largest pipe radius so thin pipes aren't zero-thickness
    const maxRadius = Math.max(
      ...components.map(c => (DN_TO_MM[c.dn] || 100) / 2 / 1000),
      0.025 // minimum 25mm radius to keep very small parts visible
    )
    bbox.expandByScalar(maxRadius)

    // --- 2. Compute centre and 3D size ---
    const center = new Vector3()
    bbox.getCenter(center)
    const size = new Vector3()
    bbox.getSize(size)

    // --- 3. Estimate projected size for the isometric view ---
    // Camera looks from 45° azimuth / 45° elevation.
    // Projected width  ≈ size.x·cos45 + size.z·sin45
    // Projected height ≈ size.y·cos45 + max(size.x, size.z)·sin45·sin45
    const cos45 = Math.SQRT1_2
    const projectedWidth  = (size.x + size.z) * cos45
    const projectedHeight = size.y * cos45 + Math.max(size.x, size.z) * cos45 * cos45

    // Use the larger of the two projections as the limiting dimension
    const projectedSize = Math.max(projectedWidth, projectedHeight, 0.05)

    // --- 4. Calculate the zoom that makes projectedSize fill ~75 % of the viewport ---
    // In R3F orthographic mode the frustum is set in pixel units:
    //   visibleWorldWidth  = (camera.right - camera.left)  / camera.zoom
    //   visibleWorldHeight = (camera.top   - camera.bottom) / camera.zoom
    const frustumWidth  = camera.right - camera.left   // pixels
    const frustumHeight = camera.top   - camera.bottom  // pixels
    const padding = 1.35 // 35 % breathing room around the content

    const targetZoom = Math.min(
      frustumWidth  / (projectedSize * padding),
      frustumHeight / (projectedSize * padding)
    )

    // Clamp to sensible range
    const clampedZoom = Math.max(20, Math.min(800, targetZoom))

    // --- 5. Camera position: 45 ° isometric looking at the centre ---
    const cameraDistance = 20
    const angle = Math.PI / 4
    const elevation = Math.PI / 4
    const targetPosition = center.clone().add(new Vector3(
      Math.cos(elevation) * Math.sin(angle) * cameraDistance,
      Math.sin(elevation) * cameraDistance,
      Math.cos(elevation) * Math.cos(angle) * cameraDistance
    ))

    // --- 6. Apply (with optional smooth animation) ---
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    if (!animate) {
      camera.zoom = clampedZoom
      camera.position.copy(targetPosition)
      camera.updateProjectionMatrix()
      controls.target.copy(center)
      controls.update()
      return
    }

    // Smooth animation over ~400 ms
    const startZoom = camera.zoom
    const startPosition = camera.position.clone()
    const startTarget = controls.target.clone()
    const startTime = performance.now()
    const duration = 400

    const animateStep = (time: number) => {
      const elapsed = time - startTime
      // ease-out cubic
      const rawT = Math.min(elapsed / duration, 1)
      const t = 1 - Math.pow(1 - rawT, 3)

      camera.zoom = startZoom + (clampedZoom - startZoom) * t
      camera.position.lerpVectors(startPosition, targetPosition, t)
      controls.target.lerpVectors(startTarget, center, t)
      camera.updateProjectionMatrix()
      controls.update()

      if (rawT < 1) {
        animationRef.current = requestAnimationFrame(animateStep)
      } else {
        animationRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animateStep)
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [])

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
    fitToView(true)
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
