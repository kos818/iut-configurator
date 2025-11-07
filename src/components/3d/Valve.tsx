import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface ValveProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const Valve: React.FC<ValveProps> = ({
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
  const handleHeight = outerRadius * 2

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

      {/* Handle */}
      <mesh position={[0, handleHeight / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius * 0.3, outerRadius * 0.3, handleHeight, 8]} />
        <meshStandardMaterial
          color={selected ? '#66BB6A' : '#FF9800'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Handle wheel */}
      <mesh position={[handleHeight / 2, handleHeight / 2, 0]}>
        <torusGeometry args={[outerRadius * 0.8, outerRadius * 0.15, 8, 16]} />
        <meshStandardMaterial
          color={selected ? '#66BB6A' : '#FF9800'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}
