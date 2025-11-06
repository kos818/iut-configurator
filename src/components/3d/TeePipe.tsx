import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'

interface TeePipeProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const TeePipe: React.FC<TeePipeProps> = ({
  id,
  diameter,
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const outerRadius = (diameter / 2) / 1000
  const length = outerRadius * 4

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          selectComponent(id)
        }}
      >
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
