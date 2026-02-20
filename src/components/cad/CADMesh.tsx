import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Mesh, BufferGeometry } from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { useCADStore } from '../../store/cadStore'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
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
  const collisionWarnings = useConfiguratorStore((s) => s.collisionWarnings)

  const isSelected = selectedId === id
  const isHovered = hoveredId === id

  // Determine collision state for this component
  const collisionType = useMemo(() => {
    for (const w of collisionWarnings) {
      if (w.id1 === id || w.id2 === id) {
        if (w.type === 'blocked') return 'blocked'
      }
    }
    for (const w of collisionWarnings) {
      if (w.id1 === id || w.id2 === id) {
        if (w.type === 'warning') return 'warning'
      }
    }
    return null
  }, [collisionWarnings, id])

  const registry = getCADMaterialRegistry()

  // Priority: collision blocked (red) > collision warning (yellow) > selected > hovered > base
  let material = registry.base
  if (collisionType === 'blocked') {
    material = registry.collisionBlocked
  } else if (collisionType === 'warning') {
    material = registry.collisionWarning
  } else if (isSelected) {
    material = registry.selected
  } else if (isHovered) {
    material = registry.hover
  }

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
