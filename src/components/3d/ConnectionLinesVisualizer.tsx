import React from 'react'
import { Line } from '@react-three/drei'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getWorldPosition } from '../../utils/connectionHelpers'

export const ConnectionLinesVisualizer: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)

  // Build a map of connection point IDs to their world positions and components
  const connectionPointMap = new Map<string, { worldPos: [number, number, number]; componentId: string }>()

  components.forEach((component) => {
    component.connectionPoints.forEach((cp) => {
      const worldPos = getWorldPosition(component, cp)
      connectionPointMap.set(cp.id, {
        worldPos: [worldPos.x, worldPos.y, worldPos.z],
        componentId: component.id,
      })
    })
  })

  // Find all connections (avoid duplicates by only drawing from lower ID to higher ID)
  const connections: Array<{ start: [number, number, number]; end: [number, number, number] }> = []
  const processedPairs = new Set<string>()

  components.forEach((component) => {
    component.connectionPoints.forEach((cp) => {
      if (cp.connectedTo) {
        const targetCP = connectionPointMap.get(cp.connectedTo)
        if (targetCP) {
          // Create a unique key for this connection pair (sorted to avoid duplicates)
          const pairKey = [cp.id, cp.connectedTo].sort().join('-')
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey)
            const start = connectionPointMap.get(cp.id)
            if (start) {
              connections.push({
                start: start.worldPos,
                end: targetCP.worldPos,
              })
            }
          }
        }
      }
    })
  })

  return (
    <group>
      {connections.map((conn, index) => (
        <Line
          key={index}
          points={[conn.start, conn.end]}
          color="#00ff88"
          lineWidth={2}
          dashed={false}
        />
      ))}
    </group>
  )
}
