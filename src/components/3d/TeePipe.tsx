import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

interface TeePipeProps {
  id: string
  diameter: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
}

export const TeePipe: React.FC<TeePipeProps> = ({
  id,
  diameter,
  position,
  rotation,
  selected,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const outerRadius = (diameter / 2) / 1000
  const length = outerRadius * 4

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
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#78909C'}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Vertical branch */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[outerRadius, outerRadius, length / 2, 16]} />
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#78909C'}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Center junction sphere */}
      <mesh>
        <sphereGeometry args={[outerRadius * 1.3, 16, 16]} />
        <meshStandardMaterial
          color={selected ? '#4CAF50' : '#78909C'}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}
