import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface CapProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const Cap: React.FC<CapProps> = ({
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
  const capHeight = outerRadius * 1.5

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Cylindrical base */}
      <mesh ref={meshRef} position={[0, -capHeight / 4, 0]}>
        <cylinderGeometry args={[outerRadius, outerRadius, capHeight / 2, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Hemispherical dome on top */}
      <mesh position={[0, capHeight / 4, 0]}>
        <sphereGeometry args={[outerRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Flange ring at base */}
      <mesh position={[0, -capHeight / 2, 0]}>
        <cylinderGeometry args={[outerRadius * 1.3, outerRadius * 1.3, outerRadius * 0.2, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  )
}
