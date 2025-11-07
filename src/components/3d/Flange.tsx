import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
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
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const flangeRadius = outerRadius * 2
  const flangeThickness = outerRadius * 0.3

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Flange disk */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[flangeRadius, flangeRadius, flangeThickness, 32]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Bolt holes (8 around the flange) */}
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
