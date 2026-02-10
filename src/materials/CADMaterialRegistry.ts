import { MeshStandardMaterial } from 'three'

export interface CADMaterials {
  base: MeshStandardMaterial
  hover: MeshStandardMaterial
  selected: MeshStandardMaterial
  dispose: () => void
}

let instance: CADMaterials | null = null

export function createCADMaterialRegistry(): CADMaterials {
  const base = new MeshStandardMaterial({
    color: '#7f8c8d',
    metalness: 0,
    roughness: 0.9,
    envMapIntensity: 0,
  })

  const hover = new MeshStandardMaterial({
    color: '#95a5a6',
    metalness: 0,
    roughness: 0.9,
    envMapIntensity: 0,
  })

  const selected = new MeshStandardMaterial({
    color: '#2980b9',
    metalness: 0,
    roughness: 0.9,
    envMapIntensity: 0,
  })

  return {
    base,
    hover,
    selected,
    dispose: () => {
      base.dispose()
      hover.dispose()
      selected.dispose()
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
