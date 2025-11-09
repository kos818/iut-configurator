import React, { useState } from 'react'
import { Vector3, Euler } from 'three'
import { Text, Html } from '@react-three/drei'
import { Plus } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getWorldPosition, getWorldDirection, generateConnectionPoints } from '../../utils/connectionHelpers'
import { calculateConnectionRotation } from '../../utils/rotationHelpers'
import { ComponentTemplate, PipeComponent, ConnectionPoint, DNValue, ConnectionMethod } from '../../types'
import { QuickAddMenu } from '../ui/QuickAddMenu'

export const ConnectionPointsVisualizer: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)
  const snapTargets = useConfiguratorStore((state) => state.snapTargets)
  const addComponent = useConfiguratorStore((state) => state.addComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const dialogSelectableConnectionPoints = useConfiguratorStore((state) => state.dialogSelectableConnectionPoints)
  const dialogSelectedConnectionPoint = useConfiguratorStore((state) => state.dialogSelectedConnectionPoint)
  const setDialogSelectedConnectionPoint = useConfiguratorStore((state) => state.setDialogSelectedConnectionPoint)

  const [hoveredCP, setHoveredCP] = useState<string | null>(null)
  const [menuOpenForCP, setMenuOpenForCP] = useState<string | null>(null)

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
    let actualPosition = targetWorldPos.clone().sub(rotatedCPOffset)

    // If using flanged connection, add extra spacing for the flanges
    if (connectionMethod === 'flanged') {
      const pipeRadius = targetCP.dn / 2000
      const flangeThickness = pipeRadius * 0.4
      const flangeSpacing = flangeThickness * 2
      const targetDirection = getWorldDirection(targetComponent, targetCP)
      const spacingOffset = targetDirection.clone().multiplyScalar(flangeSpacing)
      actualPosition.add(spacingOffset)
    }

    // Add component at corrected position with calculated rotation
    addComponent(templateWithDN, actualPosition)

    // Wait for next tick to get the new component and apply rotation + connection
    setTimeout(() => {
      const allComponents = useConfiguratorStore.getState().components
      const newComponent = allComponents[allComponents.length - 1]

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
    }, 50)

    // Close the menu
    setMenuOpenForCP(null)
  }

  return (
    <group>
      {components.map((component) => {
        const isSelected = component.id === selectedComponent

        return component.connectionPoints.map((cp) => {
          // Get world position and direction of connection point
          const worldPos = getWorldPosition(component, cp)
          const worldDir = getWorldDirection(component, cp)
          const isConnected = cp.connectedTo !== null
          const isSnapTarget = snapTargets.includes(cp.id)
          const isDialogSelectable = dialogSelectableConnectionPoints.includes(cp.id)
          const isDialogSelected = dialogSelectedConnectionPoint === cp.id

          // Color coding:
          // - Purple/Magenta: dialog selectable (pulsing)
          // - Cyan: dialog selected
          // - Orange: snap target (nearby during drag)
          // - Green: available for connection
          // - Blue: connected
          // - Yellow: selected component's connection point
          let color = '#00ff00' // green
          let size = 0.03
          let emissiveIntensity = 0.5

          if (isDialogSelected) {
            color = '#00ffff' // cyan - selected in dialog
            size = 0.06 // extra large
            emissiveIntensity = 1.5 // very bright
          } else if (isDialogSelectable) {
            color = '#ff00ff' // magenta - selectable in dialog
            size = 0.05 // larger
            emissiveIntensity = 1.2 // brighter
          } else if (isSnapTarget) {
            color = '#ff6600' // orange - snap target
            size = 0.05 // larger
            emissiveIntensity = 1.0 // brighter
          } else if (isConnected) {
            color = '#0088ff' // blue
          } else if (isSelected) {
            color = '#ffff00' // yellow
          }

          const isHovered = hoveredCP === cp.id

          return (
            <group key={cp.id}>
              {/* Connection point sphere */}
              <mesh
                position={[worldPos.x, worldPos.y, worldPos.z]}
                onClick={(e) => {
                  e.stopPropagation()
                  // If this connection point is selectable in dialog, select it
                  if (isDialogSelectable) {
                    setDialogSelectedConnectionPoint(cp.id)
                  }
                }}
                onPointerEnter={(e) => {
                  e.stopPropagation()
                  if (!isConnected || isDialogSelectable) {
                    setHoveredCP(cp.id)
                  }
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation()
                  setHoveredCP(null)
                }}
              >
                <sphereGeometry args={[size, 16, 16]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={emissiveIntensity}
                  transparent
                  opacity={0.8}
                />
              </mesh>

              {/* Direction indicator (small cone) */}
              <mesh
                position={[
                  worldPos.x + worldDir.x * 0.05,
                  worldPos.y + worldDir.y * 0.05,
                  worldPos.z + worldDir.z * 0.05,
                ]}
                rotation={[
                  Math.atan2(worldDir.y, Math.sqrt(worldDir.x ** 2 + worldDir.z ** 2)),
                  Math.atan2(worldDir.x, worldDir.z),
                  0,
                ]}
              >
                <coneGeometry args={[0.015, 0.04, 8]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.6}
                />
              </mesh>

              {/* Alphabetic label */}
              <Text
                position={[worldPos.x, worldPos.y + 0.08, worldPos.z]}
                fontSize={0.06}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.002}
                outlineColor="#000000"
              >
                {cp.label}
              </Text>

              {/* Plus button - show for selected component's available connection points OR on hover */}
              {!isConnected && (isSelected || isHovered) && (
                <Html
                  position={[worldPos.x, worldPos.y + 0.15, worldPos.z]}
                  center
                  style={{ pointerEvents: 'auto', zIndex: menuOpenForCP === cp.id ? 9999 : 100 }}
                  transform
                  sprite
                >
                  {menuOpenForCP === cp.id ? (
                    <QuickAddMenu
                      onSelect={(template) => handleComponentSelect(template, cp.id)}
                      onClose={() => setMenuOpenForCP(null)}
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenForCP(cp.id)
                        setHoveredCP(null)
                      }}
                      className={`${
                        isSelected ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                      } text-white rounded-full shadow-lg transition-all transform hover:scale-110`}
                      title={`Komponente an ${cp.label} hinzufügen`}
                      style={{
                        cursor: 'pointer',
                        border: '1px solid white',
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
                </Html>
              )}
            </group>
          )
        })
      })}
    </group>
  )
}
