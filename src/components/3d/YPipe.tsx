import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'

interface YPipeProps {
  id: string
  diameter: number
  armLength?: number // Length of each arm in mm
  leftAngle?: number // Angle of left inlet in radians
  rightAngle?: number // Angle of right inlet in radians
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const YPipe: React.FC<YPipeProps> = ({
  id,
  diameter,
  armLength = 200,
  leftAngle = Math.PI / 4, // 45° default
  rightAngle = Math.PI / 4, // 45° default
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
  // Left inlet: bottom-left at leftAngle
  const leftX = -armLengthM * Math.sin(leftAngle) / 2
  const leftY = -armLengthM * Math.cos(leftAngle) / 2

  // Right inlet: bottom-right at rightAngle
  const rightX = armLengthM * Math.sin(rightAngle) / 2
  const rightY = -armLengthM * Math.cos(rightAngle) / 2

  // Outlet: straight up
  const outletY = armLengthM / 2

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Left inlet arm (bottom-left at angle) */}
      <mesh
        ref={meshRef}
        position={[leftX, leftY, 0]}
        rotation={[0, 0, leftAngle]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Right inlet arm (bottom-right at angle) */}
      <mesh
        position={[rightX, rightY, 0]}
        rotation={[0, 0, -rightAngle]}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, armLengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Outlet arm (straight up) */}
      <mesh position={[0, outletY, 0]}>
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
