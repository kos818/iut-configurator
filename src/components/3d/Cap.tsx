import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface CapProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const Cap: React.FC<CapProps> = ({
  id,
  diameter,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const capHeight = outerRadius * 1.5

  const baseGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, capHeight / 2, 16),
    [outerRadius, capHeight]
  )
  const domeGeom = useMemo(
    () => new SphereGeometry(outerRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    [outerRadius]
  )
  const ringGeom = useMemo(
    () => new CylinderGeometry(outerRadius * 1.3, outerRadius * 1.3, outerRadius * 0.2, 16),
    [outerRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={baseGeom} position={[0, -capHeight / 4, 0]} />
      <CADMesh id={id} geometry={domeGeom} position={[0, capHeight / 4, 0]} />
      <CADMesh id={id} geometry={ringGeom} position={[0, -capHeight / 2, 0]} />
    </group>
  )
}
