import { PipeComponentType } from '../types'

const BASE = import.meta.env.BASE_URL

export interface ModelConfig {
  modelPath: string
  referenceDN: number
  modelScale?: number
  modelLength?: number
  lengthAxis?: 0 | 1 | 2
  rotationOffset?: [number, number, number]
  positionOffset?: [number, number, number]
  connectionPoints?: {
    [key: string]: {
      position: [number, number, number]
      direction: [number, number, number]
    }
  }
}

export const DEFAULT_MODEL_SCALE = 1
export const CAD_TO_THREEJS_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

export const MODEL_REGISTRY: Partial<Record<PipeComponentType, ModelConfig>> = {
  elbow: {
    modelPath: `${BASE}models/elbows/elbow_90_v6.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    connectionPoints: {
      A: { position: [0, -150, 0], direction: [0, -1, 0] },
      B: { position: [150, 0, 0], direction: [1, 0, 0] },
    },
  },

  tee: {
    modelPath: `${BASE}models/tees/tee_45_dn100.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
  },

  straight: {
    modelPath: `${BASE}models/pipes/pipe_straight.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    modelLength: 500,
    lengthAxis: 1, // Y-axis: pipe extends from Y=-250 to Y=+250 in model space
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
  },

  glatter_flansch: {
    modelPath: `${BASE}models/fittings/glatter_flansch_dn100.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    connectionPoints: {
      A: { position: [0, 0, 0], direction: [0, 0, 1] },
      B: { position: [0, 0, -10], direction: [0, 0, -1] },
    },
  },

  losflansch: {
    modelPath: `${BASE}models/fittings/losflansch_dn100.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    connectionPoints: {
      A: { position: [0, 0, 0], direction: [0, 0, 1] },
      B: { position: [0, 0, -10], direction: [0, 0, -1] },
    },
  },

  vorschweissboerdel: {
    modelPath: `${BASE}models/fittings/vorschweissboerdel_dn100.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    connectionPoints: {
      A: { position: [0, 0, -29], direction: [0, 0, -1] },
      B: { position: [0, 0, 0], direction: [0, 0, 1] },
    },
  },

  ffq_stueck: {
    modelPath: `${BASE}models/fittings/ffq_stueck_los_1r_dn100.glb`,
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    connectionPoints: {
      A: { position: [0, 0, 0], direction: [0, 0, -1] },
      B: { position: [0, 0, 505], direction: [0, 0, 1] },
      C: { position: [0, -181.5, -152.5], direction: [0, -1, 0] },
    },
  },
}

export const hasCADModel = (type: PipeComponentType): boolean => {
  return type in MODEL_REGISTRY
}

export const getModelConfig = (type: PipeComponentType): ModelConfig | undefined => {
  return MODEL_REGISTRY[type]
}

export const calculateScaleFactor = (targetDN: number, referenceDN: number, modelScale: number = 1): number => {
  return (targetDN / referenceDN) * modelScale / 1000
}

// Return connection points from registry config, scaled to target DN (in meters)
export const getModelConnectionPoints = (
  type: PipeComponentType,
  dn: number
): { name: string; position: [number, number, number]; direction: [number, number, number] }[] | null => {
  const config = MODEL_REGISTRY[type]
  if (!config?.connectionPoints) return null

  const scale = dn / config.referenceDN / 1000 // mm to meters, scaled by DN ratio
  return Object.entries(config.connectionPoints).map(([name, cp]) => ({
    name,
    position: [cp.position[0] * scale, cp.position[1] * scale, cp.position[2] * scale] as [number, number, number],
    direction: [...cp.direction] as [number, number, number],
  }))
}
