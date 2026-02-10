import { create } from 'zustand'
import { MeshStandardMaterial, Mesh, Object3D } from 'three'

interface MaterialCacheStore {
  baseMaterial: MeshStandardMaterial | null
  setBaseMaterial: (mat: MeshStandardMaterial) => void
}

export const useMaterialCacheStore = create<MaterialCacheStore>((set, get) => ({
  baseMaterial: null,
  setBaseMaterial: (mat: MeshStandardMaterial) => {
    if (!get().baseMaterial) {
      set({ baseMaterial: mat })
    }
  },
}))

/**
 * Extract the first MeshStandardMaterial from a GLB scene and cache it.
 * Must be called BEFORE overriding materials on the cloned scene.
 * Only caches once — subsequent calls are no-ops.
 */
export function extractAndCacheMaterial(scene: Object3D): void {
  if (useMaterialCacheStore.getState().baseMaterial) return

  let found: MeshStandardMaterial | null = null
  scene.traverse((child) => {
    if (!found && child instanceof Mesh) {
      const mat = Array.isArray(child.material) ? child.material[0] : child.material
      if (mat instanceof MeshStandardMaterial) {
        found = mat.clone()
      }
    }
  })

  if (found) {
    useMaterialCacheStore.getState().setBaseMaterial(found)
  }
}
