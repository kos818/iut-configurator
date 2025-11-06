import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
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
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000 // convert mm to meters for 3D
  const innerRadius = outerRadius * 0.85
  const pipeLength = length / 1000 // convert mm to meters

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[outerRadius, outerRadius, pipeLength, 32]} />
        <meshStandardMaterial
          color={getMaterialColor(material, selected)}
          metalness={getMaterialMetalness(material)}
          roughness={getMaterialRoughness(material)}
        />
      </mesh>
      {/* Inner hollow part */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, pipeLength, 32]} />
        <meshStandardMaterial
          color="#263238"
          metalness={0.9}
          roughness={0.1}
          side={2} // DoubleSide
        />
      </mesh>
    </group>
  )
}
