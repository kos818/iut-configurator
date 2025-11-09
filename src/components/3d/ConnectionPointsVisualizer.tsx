import React from 'react'
import { Text } from '@react-three/drei'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getWorldPosition, getWorldDirection } from '../../utils/connectionHelpers'

export const ConnectionPointsVisualizer: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)
  const snapTargets = useConfiguratorStore((state) => state.snapTargets)
  const dialogSelectableConnectionPoints = useConfiguratorStore((state) => state.dialogSelectableConnectionPoints)
  const dialogSelectedConnectionPoint = useConfiguratorStore((state) => state.dialogSelectedConnectionPoint)
  const setDialogSelectedConnectionPoint = useConfiguratorStore((state) => state.setDialogSelectedConnectionPoint)

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
          // - Purple/Magenta: dialog selectable
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
            </group>
          )
        })
      })}
    </group>
  )
}
