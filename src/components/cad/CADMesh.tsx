import React, { useRef, useEffect, useCallback } from 'react'
import { Mesh, BufferGeometry } from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { useCADStore } from '../../store/cadStore'
import { getCADMaterialRegistry } from '../../materials/CADMaterialRegistry'

interface CADMeshProps {
  id: string
  geometry: BufferGeometry
  position?: [number, number, number]
  rotation?: [number, number, number]
  children?: React.ReactNode
}

export const CADMesh: React.FC<CADMeshProps> = React.memo(({
  id,
  geometry,
  position,
  rotation,
  children,
}) => {
  const meshRef = useRef<Mesh>(null!)
  const selectedId = useCADStore((s) => s.selectedId)
  const hoveredId = useCADStore((s) => s.hoveredId)
  const registerMeshRef = useCADStore((s) => s.registerMeshRef)
  const unregisterMeshRef = useCADStore((s) => s.unregisterMeshRef)
  const setSelected = useCADStore((s) => s.setSelected)
  const setHovered = useCADStore((s) => s.setHovered)

  const isSelected = selectedId === id
  const isHovered = hoveredId === id

  const registry = getCADMaterialRegistry()
  const material = isSelected ? registry.selected : isHovered ? registry.hover : registry.base

  useEffect(() => {
    registerMeshRef(id, meshRef)
    return () => unregisterMeshRef(id)
  }, [id, registerMeshRef, unregisterMeshRef])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelected(id)
  }, [id, setSelected])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(id)
  }, [id, setHovered])

  const handlePointerOut = useCallback(() => {
    setHovered(null)
  }, [setHovered])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <Edges threshold={15} color="#1a1a1a" />
      {children}
    </mesh>
  )
})

CADMesh.displayName = 'CADMesh'
