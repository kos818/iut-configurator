import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface CrossPipeProps {
  id: string
  diameter: number
  armLength?: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const CrossPipe: React.FC<CrossPipeProps> = ({
  id,
  diameter,
  armLength = 200,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const armLengthM = armLength / 1000

  const armGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, armLengthM, 16),
    [outerRadius, armLengthM]
  )
  const sphereGeom = useMemo(
    () => new SphereGeometry(outerRadius * 1.3, 16, 16),
    [outerRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={armGeom} position={[-armLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <CADMesh id={id} geometry={armGeom} position={[armLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <CADMesh id={id} geometry={armGeom} position={[0, armLengthM / 2, 0]} />
      <CADMesh id={id} geometry={armGeom} position={[0, -armLengthM / 2, 0]} />
      <CADMesh id={id} geometry={sphereGeom} />
    </group>
  )
}
