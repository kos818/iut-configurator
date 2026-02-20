import React, { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { getMaterialColor } from '../../utils/materialColors'
import { extractAndCacheMaterial, useMaterialCacheStore } from '../../utils/glbMaterialCache'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { getOrDetectConnectionPoints } from '../../utils/glbConnectionPoints'

interface CADModelProps {
  id: string
  modelPath: string
  position: [number, number, number]
  rotation: [number, number, number]
  material: string
  selected: boolean
  scale: number // Base scale factor (DN-based)
  lengthScale?: number // Additional scale for length axis
  lengthAxis?: 0 | 1 | 2 // Which axis is length (before rotation): 0=X, 1=Y, 2=Z
  rotationOffset?: [number, number, number] // Offset to align CAD model with Three.js
  positionOffset?: [number, number, number] // Offset to center the model (in mm)
}

export const CADModel: React.FC<CADModelProps> = ({
  id,
  modelPath,
  position,
  rotation,
  material,
  selected,
  scale,
  lengthScale = 1,
  lengthAxis = 2, // Default to Z-axis (common in CAD)
  rotationOffset = [0, 0, 0],
  positionOffset = [0, 0, 0],
}) => {
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)
  const collisionWarnings = useConfiguratorStore((state) => state.collisionWarnings)

  // Determine collision state for this component
  const collisionType = useMemo((): 'warning' | 'blocked' | null => {
    for (const w of collisionWarnings) {
      if ((w.id1 === id || w.id2 === id) && w.type === 'blocked') return 'blocked'
    }
    for (const w of collisionWarnings) {
      if ((w.id1 === id || w.id2 === id) && w.type === 'warning') return 'warning'
    }
    return null
  }, [collisionWarnings, id])

  // Load the model - let errors propagate to ErrorBoundary in CADModelWrapper
  // and let loading Promises propagate to Suspense for fallback rendering
  const { scene } = useGLTF(modelPath)

  // Extract connection points from GLB extras (or auto-detect from geometry)
  useEffect(() => {
    if (!scene) return
    const cpList = getOrDetectConnectionPoints(scene as THREE.Group)
    cpList.forEach((cp) => {
      console.log(
        `[CADModel ${id}] CP "${cp.name}": pos(${cp.position.x.toFixed(1)}, ${cp.position.y.toFixed(1)}, ${cp.position.z.toFixed(1)})` +
        (cp.direction ? ` dir(${cp.direction.x.toFixed(2)}, ${cp.direction.y.toFixed(2)}, ${cp.direction.z.toFixed(2)})` : ''),
      )
    })
  }, [scene, id])

  // Clone the scene and apply materials
  const clonedScene = useMemo(() => {
    if (!scene) {
      return null
    }

    // Cache the original GLB material before we override anything
    extractAndCacheMaterial(scene)

    const clone = scene.clone(true)
    const baseMat = useMaterialCacheStore.getState().baseMaterial

    // Apply material with color override
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Ensure geometry has normals for proper lighting
        if (child.geometry && !child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals()
        }

        const matClone = baseMat ? baseMat.clone() : new THREE.MeshStandardMaterial()
        matClone.color.set(getMaterialColor(material, selected, collisionType))
        matClone.metalness = 0.4
        matClone.roughness = 0.35
        matClone.side = THREE.DoubleSide
        // Clear geometry-specific texture maps that don't transfer between models
        matClone.normalMap = null
        matClone.roughnessMap = null
        matClone.metalnessMap = null
        matClone.aoMap = null
        matClone.needsUpdate = true
        child.material = matClone

        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return clone
  }, [scene, material, selected, collisionType])

  // Update material color when selection or material type changes
  useEffect(() => {
    if (!clonedScene) return

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.color.set(getMaterialColor(material, selected, collisionType))
      }
    })
  }, [clonedScene, material, selected, collisionType])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    selectComponent(id)
  }

  // If model couldn't be loaded, return null (PipeRenderer will use procedural fallback)
  if (!clonedScene) {
    return null
  }

  // DEBUG: verify transform
  console.log(`[CADModel ${id}] scale=${scale.toFixed(6)} rotOff=[${rotationOffset.map((v: number) => v.toFixed(2)).join(",")}]`)

  // Calculate non-uniform scale: apply lengthScale to the appropriate axis
  // The scale array is [X, Y, Z] in model coordinates (before rotation)
  const nonUniformScale: [number, number, number] = [scale, scale, scale]
  nonUniformScale[lengthAxis] = scale * lengthScale

  // Scale the position offset from mm to scene units (meters)
  const scaledOffset: [number, number, number] = [
    positionOffset[0] / 1000,
    positionOffset[1] / 1000,
    positionOffset[2] / 1000,
  ]

  return (
    // Outer group: component position and rotation
    <group position={position} rotation={rotation} onClick={handleClick}>
      {/* Rotation offset: convert CAD coords (Z-up) to Three.js (Y-up) */}
      <group rotation={rotationOffset}>
        {/* Position offset in meters, applied before model */}
        <group position={scaledOffset}>
          <primitive
            object={clonedScene}
            scale={nonUniformScale}
          />
        </group>
      </group>
    </group>
  )
}

// Preload models for better performance
// Call this with model paths you want to preload
export const preloadModel = (modelPath: string) => {
  try {
    useGLTF.preload(modelPath)
  } catch (error) {
    // Ignore preload errors - model might not exist yet
  }
}
