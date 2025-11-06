import React, { useRef, useMemo } from 'react'
import { Mesh, Shape, ExtrudeGeometry, Vector2 } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

interface ElbowPipeProps {
  id: string
  diameter: number
  angle: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
}

export const ElbowPipe: React.FC<ElbowPipeProps> = ({
  id,
  diameter,
  angle,
  position,
  rotation,
  selected,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const outerRadius = (diameter / 2) / 1000
  const bendRadius = outerRadius * 3

  return (
    <group position={position} rotation={rotation}>
      {/* Simplified representation with two pipes at angle */}
      <group>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation()
            selectComponent(id)
          }}
          position={[0, -bendRadius / 2, 0]}
        >
          <cylinderGeometry args={[outerRadius, outerRadius, bendRadius, 16]} />
          <meshStandardMaterial
            color={selected ? '#4CAF50' : '#78909C'}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        <mesh
          position={[bendRadius / 2, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[outerRadius, outerRadius, bendRadius, 16]} />
          <meshStandardMaterial
            color={selected ? '#4CAF50' : '#78909C'}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Corner sphere */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[outerRadius * 1.2, 16, 16]} />
          <meshStandardMaterial
            color={selected ? '#4CAF50' : '#78909C'}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  )
}
