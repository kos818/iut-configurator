import React, { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface ReducerProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const Reducer: React.FC<ReducerProps> = ({
  id,
  diameter,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const largeRadius = (diameter / 2) / 1000
  const smallRadius = largeRadius * 0.6
  const length = largeRadius * 2

  const coneGeom = useMemo(
    () => new CylinderGeometry(smallRadius, largeRadius, length, 16),
    [smallRadius, largeRadius, length]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={coneGeom} />
    </group>
  )
}
