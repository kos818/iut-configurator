import React from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { useProceduralMaterial } from '../../hooks/useProceduralMaterial'

// Helper component to apply material properties
export const MaterialMesh: React.FC<{
  material: string
  selected: boolean
  geometry: JSX.Element
  onClick?: (e: ThreeEvent<MouseEvent>) => void
  position?: [number, number, number]
  rotation?: [number, number, number]
}> = ({ material, selected, geometry, onClick, position, rotation }) => {
  const pipeMat = useProceduralMaterial(material, selected)

  return (
    <mesh onClick={onClick} position={position} rotation={rotation} material={pipeMat}>
      {geometry}
    </mesh>
  )
}
