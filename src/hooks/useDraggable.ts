import { useState, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useConfiguratorStore } from '../store/useConfiguratorStore'

export const useDraggable = (componentId: string) => {
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)
  const components = useConfiguratorStore((state) => state.components)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Vector3 | null>(null)

  const component = components.find(c => c.id === componentId)

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    selectComponent(componentId)
    setIsDragging(true)
    if (component) {
      setDragStart(e.point.clone())
    }
  }, [componentId, selectComponent, component])

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragStart || !component) return
    e.stopPropagation()

    // Calculate delta movement
    const delta = e.point.clone().sub(dragStart)

    // Update component position
    const newPosition = component.position.clone().add(delta)
    updateComponent(componentId, { position: newPosition })

    // Update drag start for next move
    setDragStart(e.point.clone())
  }, [isDragging, dragStart, component, componentId, updateComponent])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation()
      setIsDragging(false)
      setDragStart(null)

      // TODO: Check for snap-to-connect here
    }
  }, [isDragging])

  return {
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: () => {
        setIsDragging(false)
        setDragStart(null)
      }
    }
  }
}
