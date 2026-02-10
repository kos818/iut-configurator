import React, { useMemo } from 'react'
import { Vector3, Euler, Quaternion, CylinderGeometry } from 'three'
import { PipeComponent, ConnectionPoint } from '../../types'
import { getWorldPosition } from '../../utils/connectionHelpers'
import { CADMesh } from '../cad/CADMesh'

interface ConnectionFlangeVisualizerProps {
  component: PipeComponent
}

export const ConnectionFlangeVisualizer: React.FC<ConnectionFlangeVisualizerProps> = ({ component }) => {
  const flangedConnectionPoints = component.connectionPoints.filter(
    (cp: ConnectionPoint) => cp.connectionMethod === 'flanged'
  )

  if (flangedConnectionPoints.length === 0) {
    return null
  }

  return (
    <group>
      {flangedConnectionPoints.map((cp: ConnectionPoint) => (
        <FlangeAtConnectionPoint key={cp.id} component={component} cp={cp} />
      ))}
    </group>
  )
}

const FlangeAtConnectionPoint: React.FC<{
  component: PipeComponent
  cp: ConnectionPoint
}> = ({ component, cp }) => {
  const worldPos = getWorldPosition(component, cp)

  const up = new Vector3(0, 1, 0)
  const direction = cp.direction.clone()
  direction.applyEuler(new Euler(component.rotation.x, component.rotation.y, component.rotation.z))

  const quaternion = new Quaternion()
  quaternion.setFromUnitVectors(up, direction)
  const euler = new Euler()
  euler.setFromQuaternion(quaternion)

  const pipeRadius = cp.dn / 2000
  const flangeRadius = pipeRadius * 2
  const flangeThickness = pipeRadius * 0.4

  const flangeOffset = direction.clone().multiplyScalar(flangeThickness / 2)
  const flangePos = worldPos.clone().add(flangeOffset)

  const diskGeom = useMemo(
    () => new CylinderGeometry(flangeRadius, flangeRadius, flangeThickness, 24),
    [flangeRadius, flangeThickness]
  )

  return (
    <group position={[flangePos.x, flangePos.y, flangePos.z]} rotation={[euler.x, euler.y, euler.z]}>
      <CADMesh id={component.id} geometry={diskGeom} />

      {/* Bolt holes - dark accent */}
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
}
