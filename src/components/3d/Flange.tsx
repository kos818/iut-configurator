import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

interface FlangeProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
}

export const Flange: React.FC<FlangeProps> = ({
  id,
  diameter,
  position,
  rotation,
  selected,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const outerRadius = (diameter / 2) / 1000
  const flangeRadius = outerRadius * 2
  const flangeThickness = outerRadius * 0.3

  return (
    <group position={position} rotation={rotation}>
      {/* Flange disk */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          selectComponent(id)
        }}
      >
        <cylinderGeometry args={[flangeRadius, flangeRadius, flangeThickness, 32]} />
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#607D8B'}
          metalness={0.8}
          roughness={0.3}
        />
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
