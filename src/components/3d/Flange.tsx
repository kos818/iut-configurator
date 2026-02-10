import React, { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface FlangeProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const Flange: React.FC<FlangeProps> = ({
  id,
  diameter,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const flangeRadius = outerRadius * 2
  const flangeThickness = outerRadius * 0.3

  const diskGeom = useMemo(
    () => new CylinderGeometry(flangeRadius, flangeRadius, flangeThickness, 32),
    [flangeRadius, flangeThickness]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={diskGeom} />

      {/* Bolt holes - dark accent */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const x = Math.cos(angle) * flangeRadius * 0.8
        const z = Math.sin(angle) * flangeRadius * 0.8
        return (
          <mesh key={i} position={[x, 0, z]}>
            <cylinderGeometry args={[outerRadius * 0.15, outerRadius * 0.15, flangeThickness, 8]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
        )
      })}
    </group>
  )
}
