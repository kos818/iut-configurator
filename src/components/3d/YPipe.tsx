import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface YPipeProps {
  id: string
  diameter: number
  armLength?: number // Length of each arm in mm
  leftAngle?: number // Angle of left outlet in radians
  rightAngle?: number // Angle of right outlet in radians
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

/**
 * YPipe - Hosenrohr (Trouser Pipe)
 * One inlet at bottom splits into two outlets at top, like trousers
 * - Bottom: 1 inlet (waist)
 * - Top: 2 outlets (legs)
 */
export const YPipe: React.FC<YPipeProps> = ({
  id,
  diameter,
  armLength = 200,
  leftAngle = Math.PI / 4, // 45° default for left outlet
  rightAngle = Math.PI / 4, // 45° default for right outlet
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

  // Calculate positions for the three arms
  // Inlet: straight down from center (like waist of trousers)
  const inletY = -armLengthM / 2

  // Left outlet: top-left at leftAngle (like left leg of trousers)
  const leftOutletX = -armLengthM * Math.sin(leftAngle) / 2
  const leftOutletY = armLengthM * Math.cos(leftAngle) / 2

  // Right outlet: top-right at rightAngle (like right leg of trousers)
  const rightOutletX = armLengthM * Math.sin(rightAngle) / 2
  const rightOutletY = armLengthM * Math.cos(rightAngle) / 2

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Inlet arm (bottom, straight down - "waist of trousers") */}
      <mesh
        ref={meshRef}
        position={[0, inletY, 0]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Left outlet arm (top-left at angle - "left leg") */}
      <mesh
        position={[leftOutletX, leftOutletY, 0]}
        rotation={[0, 0, leftAngle]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Right outlet arm (top-right at angle - "right leg") */}
      <mesh position={[rightOutletX, rightOutletY, 0]}
        rotation={[0, 0, -rightAngle]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Center junction sphere */}
      <mesh>
        <sphereGeometry args={[outerRadius * 1.5, 16, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  )
}
