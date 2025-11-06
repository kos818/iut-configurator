import React, { useRef, useState } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { findNearbyConnectionPoints } from '../../utils/connectionHelpers'
import { SNAP_DISTANCE } from '../../types'

interface DraggableComponentProps {
  componentId: string
  children: React.ReactNode
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  componentId,
  children,
}) => {
  const components = useConfiguratorStore((state) => state.components)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const [isDragging, setIsDragging] = useState(false)
  const dragPlane = useRef(new Vector3(0, 1, 0)) // Y-up plane
  const dragOffset = useRef(new Vector3())

  const component = components.find(c => c.id === componentId)
  if (!component) return null

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    selectComponent(componentId)
    setIsDragging(true)

    // Calculate offset from click point to component position
    const clickPoint = e.point
    dragOffset.current.copy(component.position).sub(clickPoint)

    // Set drag plane through the component
    dragPlane.current.copy(component.position).normalize()
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return
    e.stopPropagation()

    // Calculate new position
    const newPosition = e.point.clone().add(dragOffset.current)

    // Check for nearby connection points for snap preview
    const nearby = findNearbyConnectionPoints(components, newPosition, componentId)

    if (nearby.length > 0 && nearby[0].distance < SNAP_DISTANCE) {
      // Snap preview - show where it would snap
      // For now, just update position (snap logic will be in pointerUp)
      updateComponent(componentId, { position: newPosition })
    } else {
      // Normal drag
      updateComponent(componentId, { position: newPosition })
    }
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return
    e.stopPropagation()
    setIsDragging(false)

    // Check for nearby connection points for snap-to-connect
    const newPosition = component.position
    const nearby = findNearbyConnectionPoints(components, newPosition, componentId)

    if (nearby.length > 0 && nearby[0].distance < SNAP_DISTANCE) {
      // TODO: Implement snap-to-connect logic
      // For now, just leave it at the current position
      console.log('Would snap to:', nearby[0])
    }
  }

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerMissed={() => setIsDragging(false)}
    >
      {children}
    </group>
  )
}
