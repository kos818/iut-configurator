import React, { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface CheckValveProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const CheckValve: React.FC<CheckValveProps> = ({
  id,
  diameter,
  position,
  rotation,
  selected,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const bodyLength = outerRadius * 3

  const bodyGeom = useMemo(
    () => new CylinderGeometry(outerRadius * 1.5, outerRadius * 1.5, bodyLength, 16),
    [outerRadius, bodyLength]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={bodyGeom} />

      {/* Flow direction indicator - accent material */}
      <mesh position={[0, bodyLength / 2 + outerRadius * 0.8, 0]}>
        <coneGeometry args={[outerRadius * 0.8, outerRadius * 1.2, 8]} />
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#FFC107'}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Base ring - accent material */}
      <mesh position={[0, -bodyLength / 2 - outerRadius * 0.3, 0]}>
        <cylinderGeometry args={[outerRadius * 1.8, outerRadius * 1.8, outerRadius * 0.4, 16]} />
        <meshStandardMaterial
          color={selected ? '#66BB6A' : '#FFB300'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}
