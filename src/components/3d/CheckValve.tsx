import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
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
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const bodyLength = outerRadius * 3

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Valve body */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[outerRadius * 1.5, outerRadius * 1.5, bodyLength, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Flow direction indicator (cone pointing upward) */}
      <mesh position={[0, bodyLength / 2 + outerRadius * 0.8, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[outerRadius * 0.8, outerRadius * 1.2, 8]} />
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#FFC107'}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Base ring */}
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
