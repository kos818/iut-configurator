import { useMemo, useEffect } from 'react'
import { MeshStandardMaterial } from 'three'
import { useMaterialCacheStore } from '../utils/glbMaterialCache'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../utils/materialColors'

/**
 * Returns a MeshStandardMaterial cloned from the cached GLB material.
 * Preserves roughness, metalness, envMapIntensity, and any maps from the GLB.
 * Falls back to a basic material if no GLB has loaded yet.
 *
 * Reactive: when the GLB material cache populates, all consumers re-render
 * and switch to the cloned GLB material automatically.
 */
export function useProceduralMaterial(
  materialType: string,
  selected: boolean
): MeshStandardMaterial {
  const baseMaterial = useMaterialCacheStore((s) => s.baseMaterial)

  const material = useMemo(() => {
    const color = getMaterialColor(materialType, selected)

    if (baseMaterial) {
      const clone = baseMaterial.clone()
      clone.color.set(color)
      return clone
    }

    // Fallback before any GLB has loaded
    return new MeshStandardMaterial({
      color,
      metalness: getMaterialMetalness(materialType),
      roughness: getMaterialRoughness(materialType),
    })
  }, [materialType, selected, baseMaterial])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return material
}
