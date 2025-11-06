import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'

interface ReducerProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const Reducer: React.FC<ReducerProps> = ({
  id,
  diameter,
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const largeRadius = (diameter / 2) / 1000
  const smallRadius = largeRadius * 0.6
  const length = largeRadius * 2

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation}>
      {/* Reducer cone */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          selectComponent(id)
        }}
      >
        <cylinderGeometry args={[smallRadius, largeRadius, length, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  )
}
