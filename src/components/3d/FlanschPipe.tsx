import React, { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface FlanschPipeProps {
  id: string
  diameter: number // outer diameter in mm
  type: 'glatter_flansch' | 'losflansch' | 'vorschweissboerdel' | 'ffq_stueck'
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const FlanschPipe: React.FC<FlanschPipeProps> = ({
  id,
  diameter,
  type,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const innerRadius = outerRadius * 0.85
  const flangeRadius = outerRadius * 1.6
  const flangeThickness = 0.015 // 15mm

  // Dimensions vary by type
  const bodyLength = type === 'vorschweissboerdel' ? 0.029 : 0.010 // meters
  const hasFlangeDisc = type !== 'vorschweissboerdel'

  const bodyGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, bodyLength, 32),
    [outerRadius, bodyLength]
  )

  // For Vorschweißbördel: tapered neck from pipe to wider collar
  const collarGeom = useMemo(
    () => new CylinderGeometry(flangeRadius, outerRadius, bodyLength, 32),
    [flangeRadius, outerRadius, bodyLength]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {type === 'vorschweissboerdel' ? (
        <>
          {/* Tapered neck */}
          <CADMesh id={id} geometry={collarGeom} />
        </>
      ) : (
        <>
          {/* Pipe body */}
          <CADMesh id={id} geometry={bodyGeom} />
          {/* Flange disc at one end */}
          {hasFlangeDisc && (
            <mesh position={[0, -bodyLength / 2 - flangeThickness / 2, 0]}>
              <cylinderGeometry args={[flangeRadius, flangeRadius, flangeThickness, 32]} />
              <meshStandardMaterial color="#90A4AE" metalness={0.85} roughness={0.15} />
            </mesh>
          )}
        </>
      )}
      {/* Inner hollow */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, bodyLength + flangeThickness + 0.002, 32]} />
        <meshStandardMaterial color="#263238" metalness={0.9} roughness={0.1} side={2} />
      </mesh>
    </group>
  )
}
