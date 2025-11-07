import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface TeePipeProps {
  id: string
  diameter: number
  inletLength?: number // in mm
  outletLength?: number // in mm
  branchLength?: number // in mm
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const TeePipe: React.FC<TeePipeProps> = ({
  id,
  diameter,
  inletLength = 200, // default 200mm
  outletLength = 200,
  branchLength = 200,
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  // Calculate individual arm lengths in meters
  const inletLengthM = inletLength / 1000
  const outletLengthM = outletLength / 1000
  const branchLengthM = branchLength / 1000

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Inlet arm (left, -X direction) */}
      <mesh ref={meshRef} position={[-inletLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius, outerRadius, inletLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Outlet arm (right, +X direction) */}
      <mesh position={[outletLengthM / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius, outerRadius, outletLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Branch arm (top, +Y direction) */}
      <mesh position={[0, branchLengthM / 2, 0]}>
        <cylinderGeometry args={[outerRadius, outerRadius, branchLengthM, 16]} />
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
