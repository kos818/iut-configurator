import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getWorldPosition } from '../../utils/connectionHelpers'

export const ConnectionPointsVisualizer: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)
  const snapTargets = useConfiguratorStore((state) => state.snapTargets)

  return (
    <group>
      {components.map((component) => {
        const isSelected = component.id === selectedComponent

        return component.connectionPoints.map((cp) => {
          // Get world position of connection point
          const worldPos = getWorldPosition(component, cp)
          const isConnected = cp.connectedTo !== null
          const isSnapTarget = snapTargets.includes(cp.id)

          // Color coding:
          // - Orange: snap target (nearby during drag)
          // - Green: available for connection
          // - Blue: connected
          // - Yellow: selected component's connection point
          let color = '#00ff00' // green
          let size = 0.03
          let emissiveIntensity = 0.5

          if (isSnapTarget) {
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
              <mesh position={[worldPos.x, worldPos.y, worldPos.z]}>
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
                  worldPos.x + cp.direction.x * 0.05,
                  worldPos.y + cp.direction.y * 0.05,
                  worldPos.z + cp.direction.z * 0.05,
                ]}
                rotation={[
                  Math.atan2(cp.direction.y, Math.sqrt(cp.direction.x ** 2 + cp.direction.z ** 2)),
                  Math.atan2(cp.direction.x, cp.direction.z),
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
            </group>
          )
        })
      })}
    </group>
  )
}
