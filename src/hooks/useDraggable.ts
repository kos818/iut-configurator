import { useState, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useConfiguratorStore } from '../store/useConfiguratorStore'
import { findNearbyConnectionPoints, getWorldPosition, validateDNConnection } from '../utils/connectionHelpers'
import { SNAP_DISTANCE } from '../types'

export const useDraggable = (componentId: string) => {
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)
  const components = useConfiguratorStore((state) => state.components)
  const setSnapTargets = useConfiguratorStore((state) => state.setSnapTargets)
  const setGlobalDragging = useConfiguratorStore((state) => state.setIsDragging)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Vector3 | null>(null)

  const component = components.find(c => c.id === componentId)

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    selectComponent(componentId)
    setIsDragging(true)
    setGlobalDragging(true)
    if (component) {
      setDragStart(e.point.clone())
    }
  }, [componentId, selectComponent, component, setGlobalDragging])

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragStart || !component) return
    e.stopPropagation()

    // Calculate delta movement
    const delta = e.point.clone().sub(dragStart)

    // Update component position
    const newPosition = component.position.clone().add(delta)
    updateComponent(componentId, { position: newPosition })

    // Check for nearby connection points for snap preview
    const availableCP = component.connectionPoints.find(cp => cp.connectedTo === null)
    if (availableCP) {
      const cpWorldPos = getWorldPosition(component, availableCP)
      const nearby = findNearbyConnectionPoints(components, cpWorldPos, componentId)

      if (nearby.length > 0 && nearby[0].distance < SNAP_DISTANCE) {
        // Set snap target to highlight it
        setSnapTargets([nearby[0].connectionPoint.id])
      } else {
        // Clear snap targets if nothing nearby
        setSnapTargets([])
      }
    }

    // Update drag start for next move
    setDragStart(e.point.clone())
  }, [isDragging, dragStart, component, componentId, components, updateComponent, setSnapTargets])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation()
      setIsDragging(false)
      setGlobalDragging(false)
      setDragStart(null)
      setSnapTargets([]) // Clear snap targets

      // Check for snap-to-connect
      if (component) {
        // Find the closest available connection point on this component
        const availableCP = component.connectionPoints.find(cp => cp.connectedTo === null)
        if (!availableCP) return

        // Get world position of this connection point
        const cpWorldPos = getWorldPosition(component, availableCP)

        // Find nearby connection points on other components
        const nearby = findNearbyConnectionPoints(components, cpWorldPos, componentId)

        if (nearby.length > 0 && nearby[0].distance < SNAP_DISTANCE) {
          const targetCP = nearby[0].connectionPoint
          const targetComponent = nearby[0].component

          // Validate DN compatibility
          const validation = validateDNConnection(availableCP.dn, targetCP.dn)

          if (validation.isValid) {
            // Calculate snap position: align the connection points
            const targetCPWorldPos = getWorldPosition(targetComponent, targetCP)
            const offset = cpWorldPos.clone().sub(component.position)
            const snapPosition = targetCPWorldPos.clone().sub(offset)

            // Update position to snap
            updateComponent(componentId, {
              position: snapPosition,
              connectionPoints: component.connectionPoints.map(cp =>
                cp.id === availableCP.id ? { ...cp, connectedTo: targetCP.id } : cp
              )
            })

            // Update target component's connection point
            updateComponent(targetComponent.id, {
              connectionPoints: targetComponent.connectionPoints.map(cp =>
                cp.id === targetCP.id ? { ...cp, connectedTo: availableCP.id } : cp
              )
            })
          } else {
            console.warn('Cannot connect:', validation.message)
          }
        }
      }
    }
  }, [isDragging, component, components, componentId, updateComponent, setSnapTargets, setGlobalDragging])

  return {
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: () => {
        setIsDragging(false)
        setGlobalDragging(false)
        setDragStart(null)
        setSnapTargets([]) // Clear snap targets
      }
    }
  }
}
