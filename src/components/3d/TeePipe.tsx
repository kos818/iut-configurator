import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface TeePipeProps {
  id: string
  diameter: number
  armLength?: number // in mm
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const TeePipe: React.FC<TeePipeProps> = ({
  id,
  diameter,
  armLength = 200, // default 200mm
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const length = armLength / 1000 // Convert mm to meters

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <mesh ref={meshRef}>
        {/* Main horizontal pipe */}
        <cylinderGeometry args={[outerRadius, outerRadius, length, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Vertical branch */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius, outerRadius, length / 2, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Center junction sphere */}
      <mesh>
        <sphereGeometry args={[outerRadius * 1.3, 16, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  )
}
