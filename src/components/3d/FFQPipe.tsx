import React, { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface FFQPipeProps {
  id: string
  diameter: number // outer diameter in mm
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const FFQPipe: React.FC<FFQPipeProps> = ({
  id,
  diameter,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const innerRadius = outerRadius * 0.85
  const flangeRadius = outerRadius * 1.6
  const flangeThickness = 0.015

  // FFQ piece: main pipe ~505mm with branch at ~152.5mm
  const mainLength = 0.505
  const branchLength = 0.182
  const branchOffsetZ = -0.1525 // from center of main pipe

  const mainGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, mainLength, 32),
    [outerRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Main pipe along Y axis */}
      <CADMesh id={id} geometry={mainGeom} />

      {/* Flange disc at outlet end */}
      <mesh position={[0, mainLength / 2 + flangeThickness / 2, 0]}>
        <cylinderGeometry args={[flangeRadius, flangeRadius, flangeThickness, 32]} />
        <meshStandardMaterial color="#90A4AE" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Branch pipe going downward (-Y becomes -X in component space) */}
      <group position={[0, branchOffsetZ + mainLength / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[outerRadius, outerRadius, branchLength, 32]} />
          <meshStandardMaterial color="#90A4AE" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* Branch flange disc */}
      <group position={[-branchLength / 2, branchOffsetZ + mainLength / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh position={[0, flangeThickness / 2, 0]}>
          <cylinderGeometry args={[flangeRadius, flangeRadius, flangeThickness, 32]} />
          <meshStandardMaterial color="#90A4AE" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* Inner hollow - main */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, mainLength + 0.002, 32]} />
        <meshStandardMaterial color="#263238" metalness={0.9} roughness={0.1} side={2} />
      </mesh>
    </group>
  )
}
