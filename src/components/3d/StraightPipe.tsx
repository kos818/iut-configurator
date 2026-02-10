import React, { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface StraightPipeProps {
  id: string
  diameter: number
  length: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const StraightPipe: React.FC<StraightPipeProps> = ({
  id,
  diameter,
  length,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const innerRadius = outerRadius * 0.85
  const pipeLength = length / 1000

  const outerGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, pipeLength, 32),
    [outerRadius, pipeLength]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={outerGeom} />
      {/* Inner hollow part */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, pipeLength, 32]} />
        <meshStandardMaterial
          color="#263238"
          metalness={0.9}
          roughness={0.1}
          side={2}
        />
      </mesh>
    </group>
  )
}
