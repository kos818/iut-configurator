import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface CrossPipeProps {
  id: string
  diameter: number
  armLength?: number // in mm
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const CrossPipe: React.FC<CrossPipeProps> = ({
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
  const armLengthM = armLength / 1000

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Inlet arm (left, -X direction) */}
      <mesh ref={meshRef} position={[-armLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Outlet arm (right, +X direction) */}
      <mesh position={[armLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Branch arm (top, +Y direction) */}
      <mesh position={[0, armLengthM / 2, 0]}>
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Branch2 arm (bottom, -Y direction) */}
      <mesh position={[0, -armLengthM / 2, 0]}>
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
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
