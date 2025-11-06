import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

interface ReducerProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
}

export const Reducer: React.FC<ReducerProps> = ({
  id,
  diameter,
  position,
  rotation,
  selected,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const largeRadius = (diameter / 2) / 1000
  const smallRadius = largeRadius * 0.6
  const length = largeRadius * 2

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
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#78909C'}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}
