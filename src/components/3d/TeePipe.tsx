import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface TeePipeProps {
  id: string
  diameter: number
  inletLength?: number
  outletLength?: number
  branchLength?: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const TeePipe: React.FC<TeePipeProps> = ({
  id,
  diameter,
  inletLength = 200,
  outletLength = 200,
  branchLength = 200,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const inletLengthM = inletLength / 1000
  const outletLengthM = outletLength / 1000
  const branchLengthM = branchLength / 1000

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
      <CADMesh id={id} geometry={inletGeom} position={[-inletLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <CADMesh id={id} geometry={outletGeom} position={[outletLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <CADMesh id={id} geometry={branchGeom} position={[0, branchLengthM / 2, 0]} />
      <CADMesh id={id} geometry={sphereGeom} />
    </group>
  )
}
