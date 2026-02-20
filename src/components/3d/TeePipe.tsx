import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface TeePipeProps {
  id: string
  diameter: number
  inletLength: number
  outletLength: number
  branchLength: number
  branchAngle?: number // Angle in degrees from main axis (default 45°)
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const TeePipe: React.FC<TeePipeProps> = ({
  id,
  diameter,
  inletLength,
  outletLength,
  branchLength,
  branchAngle = 45,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const inletLengthM = inletLength / 1000
  const outletLengthM = outletLength / 1000
  const branchLengthM = branchLength / 1000

  // Branch direction from angle (measured from main axis)
  const branchAngleRad = (branchAngle * Math.PI) / 180
  const branchDirX = Math.cos(branchAngleRad) // component along main pipe
  const branchDirY = Math.sin(branchAngleRad) // component perpendicular

  // Branch cylinder center position (halfway along the branch)
  const branchCenterX = (branchLengthM / 2) * branchDirX
  const branchCenterY = (branchLengthM / 2) * branchDirY

  // Branch rotation: rotate the cylinder to align with branch direction
  // CylinderGeometry default axis is Y. We need to rotate it to match branch direction.
  // The branch goes from origin in direction (branchDirX, branchDirY, 0)
  // Rotation around Z axis: angle between Y-axis and branch direction
  const branchRotZ = Math.atan2(branchDirX, branchDirY)

  const inletGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, inletLengthM, 16),
    [outerRadius, inletLengthM]
  )
  const outletGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, outletLengthM, 16),
    [outerRadius, outletLengthM]
  )
  const branchGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, branchLengthM, 16),
    [outerRadius, branchLengthM]
  )
  const sphereGeom = useMemo(
    () => new SphereGeometry(outerRadius * 1.3, 16, 16),
    [outerRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Inlet arm: extends along -X from origin */}
      <CADMesh
        id={id}
        geometry={inletGeom}
        position={[-inletLengthM / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />
      {/* Outlet arm: extends along +X from origin */}
      <CADMesh
        id={id}
        geometry={outletGeom}
        position={[outletLengthM / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />
      {/* Branch arm: at branchAngle from main axis */}
      <CADMesh
        id={id}
        geometry={branchGeom}
        position={[branchCenterX, branchCenterY, 0]}
        rotation={[0, 0, branchRotZ]}
      />
      {/* Junction sphere */}
      <CADMesh id={id} geometry={sphereGeom} />
    </group>
  )
}
