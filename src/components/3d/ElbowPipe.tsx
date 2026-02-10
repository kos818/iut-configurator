import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface ElbowPipeProps {
  id: string
  diameter: number
  angle: number
  inletLength?: number
  outletLength?: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const ElbowPipe: React.FC<ElbowPipeProps> = ({
  id,
  diameter,
  angle,
  inletLength,
  outletLength,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const defaultLength = ((diameter / 2) * 3)
  const inletLengthM = (inletLength || defaultLength) / 1000
  const outletLengthM = (outletLength || defaultLength) / 1000
  const angleInRadians = (angle * Math.PI) / 180

  const outletDirX = Math.sin(angleInRadians)
  const outletDirY = -Math.cos(angleInRadians)
  const outletCenterX = (outletLengthM / 2) * outletDirX
  const outletCenterY = (outletLengthM / 2) * outletDirY
  const outletRotation = Math.atan2(outletDirX, outletDirY)

  const inletGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, inletLengthM, 16),
    [outerRadius, inletLengthM]
  )
  const outletGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, outletLengthM, 16),
    [outerRadius, outletLengthM]
  )
  const sphereGeom = useMemo(
    () => new SphereGeometry(outerRadius * 1.3, 16, 16),
    [outerRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={inletGeom} position={[0, -inletLengthM / 2, 0]} />
      <CADMesh id={id} geometry={outletGeom} position={[outletCenterX, outletCenterY, 0]} rotation={[0, 0, outletRotation]} />
      <CADMesh id={id} geometry={sphereGeom} />
    </group>
  )
}
