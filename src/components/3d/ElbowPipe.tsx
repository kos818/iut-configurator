import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface ElbowPipeProps {
  id: string
  diameter: number
  angle: number
  inletLength?: number // in mm
  outletLength?: number // in mm
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const ElbowPipe: React.FC<ElbowPipeProps> = ({
  id,
  diameter,
  angle,
  inletLength,
  outletLength,
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000

  // Use provided lengths or default to 3x radius
  const defaultLength = ((diameter / 2) * 3) // in mm
  const inletLengthM = (inletLength || defaultLength) / 1000
  const outletLengthM = (outletLength || defaultLength) / 1000

  const angleInRadians = (angle * Math.PI) / 180

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  // Calculate outlet arm position and rotation
  // Outlet direction: inlet rotated by angle around Z-axis
  // For angle θ: (0, -1) rotated by θ around Z = (sin(θ), -cos(θ))
  const outletDirX = Math.sin(angleInRadians)
  const outletDirY = -Math.cos(angleInRadians)

  // Outlet arm center position
  const outletCenterX = (outletLengthM / 2) * outletDirX
  const outletCenterY = (outletLengthM / 2) * outletDirY

  // Outlet arm rotation to align cylinder (default: +Y direction) with outlet direction
  // Cylinder axis is along +Y (0, 1), we want it along (sin(θ), -cos(θ))
  // Rotation around Z-axis to align: atan2(x, y) where direction is (x, y)
  const outletRotation = Math.atan2(outletDirX, outletDirY)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Inlet arm (pointing down, -Y direction) */}
      <mesh
        ref={meshRef}
        position={[0, -inletLengthM / 2, 0]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, inletLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Outlet arm (rotated by angle) */}
      <mesh
        position={[outletCenterX, outletCenterY, 0]}
        rotation={[0, 0, outletRotation]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, outletLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Corner junction sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[outerRadius * 1.3, 16, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  )
}
