import React, { useRef, useEffect } from 'react'
import { TransformControls } from '@react-three/drei'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { Group, Vector3 } from 'three'

const ROTATABLE_TYPES = new Set(['tee', 'elbow', 'ffq_stueck'])

export const RotationGizmo: React.FC = () => {
  const components = useConfiguratorStore((s) => s.components)
  const selectedId = useConfiguratorStore((s) => s.selectedComponent)
  const updateComponent = useConfiguratorStore((s) => s.updateComponent)
  const setIsDragging = useConfiguratorStore((s) => s.setIsDragging)

  const groupRef = useRef<Group>(null!)
  const transformRef = useRef<any>(null)
  const isDraggingRef = useRef(false)

  const selectedComponent = components.find((c) => c.id === selectedId)
  const show = !!selectedComponent && ROTATABLE_TYPES.has(selectedComponent.type)

  // Keep a ref to avoid stale closures in onObjectChange
  const selectedComponentRef = useRef(selectedComponent)
  selectedComponentRef.current = selectedComponent

  // Sync group position/rotation from store when not dragging
  useEffect(() => {
    if (!groupRef.current || !selectedComponent || isDraggingRef.current) return
    groupRef.current.position.copy(selectedComponent.position)
    groupRef.current.rotation.set(
      selectedComponent.rotation.x,
      selectedComponent.rotation.y,
      selectedComponent.rotation.z
    )
  }, [
    show,
    selectedComponent?.id,
    selectedComponent?.position.x,
    selectedComponent?.position.y,
    selectedComponent?.position.z,
    selectedComponent?.rotation.x,
    selectedComponent?.rotation.y,
    selectedComponent?.rotation.z,
  ])

  // Listen for dragging-changed to toggle OrbitControls
  useEffect(() => {
    const controls = transformRef.current
    if (!controls) return
    const onDraggingChanged = (event: { value: boolean }) => {
      isDraggingRef.current = event.value
      setIsDragging(event.value)
    }
    controls.addEventListener('dragging-changed', onDraggingChanged)
    return () => controls.removeEventListener('dragging-changed', onDraggingChanged)
  }, [show, setIsDragging])

  if (!show) return null

  return (
    <TransformControls
      ref={transformRef}
      mode="rotate"
      size={0.7}
      onObjectChange={() => {
        const comp = selectedComponentRef.current
        if (!groupRef.current || !comp) return
        const { x, y, z } = groupRef.current.rotation
        updateComponent(comp.id, {
          rotation: new Vector3(x, y, z),
        })
      }}
    >
      <group ref={groupRef} />
    </TransformControls>
  )
}
