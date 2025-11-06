import React from 'react'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'

// Helper component to apply material properties
export const MaterialMesh: React.FC<{
  material: string
  selected: boolean
  geometry: JSX.Element
  onClick?: (e: any) => void
  position?: [number, number, number]
  rotation?: [number, number, number]
}> = ({ material, selected, geometry, onClick, position, rotation }) => {
  return (
    <mesh onClick={onClick} position={position} rotation={rotation}>
      {geometry}
      <meshStandardMaterial
        color={getMaterialColor(material, selected)}
        metalness={getMaterialMetalness(material)}
        roughness={getMaterialRoughness(material)}
      />
    </mesh>
  )
}
