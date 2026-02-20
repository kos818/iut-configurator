import { MeshStandardMaterial } from 'three'

export interface CADMaterials {
  base: MeshStandardMaterial
  hover: MeshStandardMaterial
  selected: MeshStandardMaterial
  collisionWarning: MeshStandardMaterial
  collisionBlocked: MeshStandardMaterial
  dispose: () => void
}

let instance: CADMaterials | null = null

export function createCADMaterialRegistry(): CADMaterials {
  const base = new MeshStandardMaterial({
    color: '#78909C',
    metalness: 0.4,
    roughness: 0.35,
  })

  const hover = new MeshStandardMaterial({
    color: '#90A4AE',
    metalness: 0.4,
    roughness: 0.35,
  })

  const selected = new MeshStandardMaterial({
    color: '#4CAF50',
    metalness: 0.4,
    roughness: 0.35,
  })

  const collisionWarning = new MeshStandardMaterial({
    color: '#FFC107',
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9,
  })

  const collisionBlocked = new MeshStandardMaterial({
    color: '#F44336',
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.85,
  })

  return {
    base,
    hover,
    selected,
    collisionWarning,
    collisionBlocked,
    dispose: () => {
      base.dispose()
      hover.dispose()
      selected.dispose()
      collisionWarning.dispose()
      collisionBlocked.dispose()
      instance = null
    },
  }
}

export function getCADMaterialRegistry(): CADMaterials {
  if (!instance) {
    instance = createCADMaterialRegistry()
  }
  return instance
}
