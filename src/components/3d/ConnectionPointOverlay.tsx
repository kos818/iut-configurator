import React, { useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Plus } from 'lucide-react'
import { Vector3, Euler } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getWorldPosition, getWorldDirection, generateConnectionPoints } from '../../utils/connectionHelpers'
import { calculateConnectionRotation } from '../../utils/rotationHelpers'
import { QuickAddMenu } from '../ui/QuickAddMenu'
import { ComponentTemplate, PipeComponent, ConnectionPoint, DNValue, ConnectionMethod } from '../../types'

interface ScreenPosition {
  x: number
  y: number
  connectionPointId: string
  isVisible: boolean
  isSelected: boolean
  isConnected: boolean
}

// Store for screen positions - using a simple module-level store
let screenPositionsStore: ScreenPosition[] = []
let updateListeners: Array<() => void> = []

export const subscribeToPositions = (listener: () => void) => {
  updateListeners.push(listener)
  return () => {
    updateListeners = updateListeners.filter((l) => l !== listener)
  }
}

export const getScreenPositions = () => screenPositionsStore

export const setScreenPositions = (positions: ScreenPosition[]) => {
  screenPositionsStore = positions
  updateListeners.forEach((listener) => listener())
}

// Component that runs inside Canvas to calculate positions
export const ConnectionPointPositionTracker: React.FC = () => {
  const { camera, size } = useThree()
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)

  useFrame(() => {
    const positions: ScreenPosition[] = []

    components.forEach((component) => {
      const isSelected = component.id === selectedComponent

      component.connectionPoints.forEach((cp) => {
        const isConnected = cp.connectedTo !== null

        // Only show for unconnected points on selected or hovered components
        if (isConnected || !isSelected) return

        const worldPos = getWorldPosition(component, cp)

        // Project 3D position to 2D screen coordinates
        const vector = new Vector3(worldPos.x, worldPos.y, worldPos.z)
        vector.project(camera)

        // Convert to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * size.width
        const y = (-(vector.y * 0.5) + 0.5) * size.height

        // Check if behind camera (z > 1 means behind)
        const isVisible = vector.z < 1 && vector.z > -1

        positions.push({
          x,
          y,
          connectionPointId: cp.id,
          isVisible,
          isSelected,
          isConnected,
        })
      })
    })

    setScreenPositions(positions)
  })

  return null
}

// Component that renders outside the Canvas as 2D overlay
export const ConnectionPointUI: React.FC = () => {
  const [screenPositions, setScreenPositionsState] = useState<ScreenPosition[]>([])
  const [menuOpenForCP, setMenuOpenForCP] = useState<string | null>(null)
  const addComponent = useConfiguratorStore((state) => state.addComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const components = useConfiguratorStore((state) => state.components)

  useEffect(() => {
    const unsubscribe = subscribeToPositions(() => {
      setScreenPositionsState(getScreenPositions())
    })
    return unsubscribe
  }, [])

  const handleComponentSelect = (template: ComponentTemplate, targetCPId: string, connectionMethod: ConnectionMethod = 'welded', newComponentCPIndex: number = 0) => {
    // Find the target connection point
    let targetCP: any = null
    let targetComponent: any = null

    for (const comp of components) {
      const cp = comp.connectionPoints.find((p) => p.id === targetCPId)
      if (cp) {
        targetCP = cp
        targetComponent = comp
        break
      }
    }

    if (!targetCP || !targetComponent) return

    // Create new component with DN from target connection point
    const templateWithDN = { ...template, defaultDN: targetCP.dn as DNValue }

    // Calculate position: place new component at target connection point
    const targetWorldPos = getWorldPosition(targetComponent, targetCP)

    // Create a temporary component to calculate its default connection point direction and position
    const tempComponent: Partial<PipeComponent> = {
      id: 'temp',
      type: templateWithDN.type,
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
      dn: templateWithDN.defaultDN,
      length: templateWithDN.defaultLength,
      angle: templateWithDN.defaultAngle,
      armLength: templateWithDN.defaultArmLength,
      teeArmLengths: templateWithDN.defaultTeeArmLengths,
      elbowArmLengths: templateWithDN.defaultElbowArmLengths,
      price: 0,
      material: templateWithDN.material,
      connectionPoints: [],
      isValid: true,
      validationMessages: [],
    }
    const tempCPs = generateConnectionPoints(tempComponent as PipeComponent)
    const selectedCP = tempCPs.length > newComponentCPIndex ? tempCPs[newComponentCPIndex] : tempCPs[0]
    const selectedCPDirection = selectedCP ? selectedCP.direction : new Vector3(0, 1, 0)
    const selectedCPPosition = selectedCP ? selectedCP.position : new Vector3(0, 0, 0)

    // Get world direction of target connection point
    const targetWorldDirection = getWorldDirection(targetComponent, targetCP)

    // Calculate rotation to align new component with target
    const rotation = calculateConnectionRotation(targetWorldDirection, selectedCPDirection)

    // Apply rotation to the connection point position to get the offset in world space
    const rotatedCPOffset = selectedCPPosition.clone()
    rotatedCPOffset.applyEuler(new Euler(rotation.x, rotation.y, rotation.z))

    // Calculate the actual component position: target position minus the rotated CP offset
    const actualPosition = targetWorldPos.clone().sub(rotatedCPOffset)

    // Add component at corrected position with calculated rotation
    const newComponentId = addComponent(templateWithDN, actualPosition)

    // Apply rotation and connections immediately (not in setTimeout to avoid timing issues)
    const allComponents = useConfiguratorStore.getState().components
    const newComponent = allComponents.find(c => c.id === newComponentId)

    if (newComponent && newComponent.connectionPoints.length > newComponentCPIndex) {
      const newCP = newComponent.connectionPoints[newComponentCPIndex]

      // Apply rotation and mark both connection points as connected
      updateComponent(newComponent.id, {
        rotation,
        connectionPoints: newComponent.connectionPoints.map((cp: ConnectionPoint) =>
          cp.id === newCP.id ? { ...cp, connectedTo: targetCP.id, connectionMethod } : cp
        )
      })

      updateComponent(targetComponent.id, {
        connectionPoints: targetComponent.connectionPoints.map((cp: ConnectionPoint) =>
          cp.id === targetCP.id ? { ...cp, connectedTo: newCP.id, connectionMethod } : cp
        )
      })
    }

    // Close the menu
    setMenuOpenForCP(null)
  }

  // Calculate adjusted position to keep menu within viewport
  const getAdjustedMenuPosition = (x: number, y: number) => {
    const menuWidth = 240
    const menuHeight = 400
    const padding = 10

    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y
    let translateX = '-50%'
    let translateY = '-50%'

    // Check right boundary
    if (x + menuWidth / 2 + padding > viewportWidth) {
      // Position to the left of the connection point
      adjustedX = x - menuWidth / 2 - 20
      translateX = '0%'
    }

    // Check left boundary
    if (x - menuWidth / 2 - padding < 0) {
      // Position to the right of the connection point
      adjustedX = x + 20
      translateX = '0%'
    }

    // Check bottom boundary
    if (y + menuHeight / 2 + padding > viewportHeight) {
      // Position above the connection point
      adjustedY = y - menuHeight / 2 - 20
      translateY = '0%'
    }

    // Check top boundary
    if (y - menuHeight / 2 - padding < 0) {
      // Position below the connection point
      adjustedY = y + 20
      translateY = '0%'
    }

    return { x: adjustedX, y: adjustedY, translateX, translateY }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {screenPositions.map((pos) => {
        if (!pos.isVisible) return null

        const isMenuOpen = menuOpenForCP === pos.connectionPointId
        const adjustedPos = isMenuOpen ? getAdjustedMenuPosition(pos.x, pos.y) : { x: pos.x, y: pos.y, translateX: '-50%', translateY: '-50%' }

        return (
          <div
            key={pos.connectionPointId}
            style={{
              position: 'absolute',
              left: `${adjustedPos.x}px`,
              top: `${adjustedPos.y}px`,
              transform: `translate(${adjustedPos.translateX}, ${adjustedPos.translateY})`,
              pointerEvents: 'auto',
              zIndex: isMenuOpen ? 10000 : 1000,
            }}
          >
            {isMenuOpen ? (
              <div style={{ position: 'relative' }}>
                <QuickAddMenu
                  onSelect={(template: ComponentTemplate) => {
                    handleComponentSelect(template, pos.connectionPointId)
                  }}
                  onClose={() => setMenuOpenForCP(null)}
                />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpenForCP(pos.connectionPointId)
                }}
                className={`${
                  pos.isSelected
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white rounded-full shadow-lg transition-all transform hover:scale-110`}
                style={{
                  cursor: 'pointer',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  width: '28px',
                  height: '28px',
                }}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

