import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'

interface ElbowPipeProps {
  id: string
  diameter: number
  angle: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const ElbowPipe: React.FC<ElbowPipeProps> = ({
  id,
  diameter,
  angle: _angle,
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)

  const outerRadius = (diameter / 2) / 1000
  const bendRadius = outerRadius * 3

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

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
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>

        <mesh
          position={[bendRadius / 2, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[outerRadius, outerRadius, bendRadius, 16]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>

        {/* Corner sphere */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[outerRadius * 1.2, 16, 16]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
      </group>
    </group>
  )
}
