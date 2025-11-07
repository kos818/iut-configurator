import React from 'react'
import { Vector3, Euler, Quaternion } from 'three'
import { PipeComponent, ConnectionPoint } from '../../types'
import { getWorldPosition } from '../../utils/connectionHelpers'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'

interface ConnectionFlangeVisualizerProps {
  component: PipeComponent
}

export const ConnectionFlangeVisualizer: React.FC<ConnectionFlangeVisualizerProps> = ({ component }) => {
  // Filter for connection points that are connected and use flanged method
  const flangedConnectionPoints = component.connectionPoints.filter(
    (cp: ConnectionPoint) => cp.connectedTo !== null && cp.connectionMethod === 'flanged'
  )

  if (flangedConnectionPoints.length === 0) {
    return null
  }

  return (
    <group>
      {flangedConnectionPoints.map((cp: ConnectionPoint) => {
        // Get world position
        const worldPos = getWorldPosition(component, cp)

        // Calculate rotation to align flange with connection point direction
        // Connection points point outward, so we need to align the flange disk perpendicular to that
        const up = new Vector3(0, 1, 0)
        const direction = cp.direction.clone()
        direction.applyEuler(new Euler(component.rotation.x, component.rotation.y, component.rotation.z))

        // Calculate rotation quaternion to align up vector with direction
        const quaternion = new Quaternion()
        quaternion.setFromUnitVectors(up, direction)
        const euler = new Euler()
        euler.setFromQuaternion(quaternion)

        // Flange dimensions based on DN
        const pipeRadius = cp.dn / 2000 // Convert DN to meters radius (rough approximation)
        const flangeRadius = pipeRadius * 2
        const flangeThickness = pipeRadius * 0.4

        // Position flange slightly outward from the connection point (at the element's end)
        // Move by half thickness in the direction of the connection point
        const flangeOffset = direction.clone().multiplyScalar(flangeThickness / 2)
        const flangePos = worldPos.clone().add(flangeOffset)

        const color = getMaterialColor(component.material, false)
        const metalness = getMaterialMetalness(component.material)
        const roughness = getMaterialRoughness(component.material)

        return (
          <group key={cp.id} position={[flangePos.x, flangePos.y, flangePos.z]} rotation={[euler.x, euler.y, euler.z]}>
            {/* Flange disk */}
            <mesh>
              <cylinderGeometry args={[flangeRadius, flangeRadius, flangeThickness, 24]} />
              <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
            </mesh>

            {/* Bolt holes (6 around the flange) */}
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2
              const x = Math.cos(angle) * flangeRadius * 0.75
              const z = Math.sin(angle) * flangeRadius * 0.75
              return (
                <mesh key={i} position={[x, 0, z]}>
                  <cylinderGeometry args={[pipeRadius * 0.2, pipeRadius * 0.2, flangeThickness, 8]} />
                  <meshStandardMaterial color="#212121" />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}
