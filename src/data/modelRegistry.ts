import { PipeComponentType } from '../types'

// Model configuration for CAD-based rendering
export interface ModelConfig {
  modelPath: string
  referenceDN: number // The DN size the model was designed at (for scaling)
  // Scale factor to convert model to correct size (if model is in wrong units)
  // Example: if model is 634mm but should be 100mm at DN100, set modelScale = 100/634 = 0.158
  modelScale?: number
  // Original model length in mm (for stretching the model based on length parameter)
  // If set, the model will be scaled non-uniformly along the length axis
  modelLength?: number
  // Which axis is the length axis in the model BEFORE rotation (0=X, 1=Y, 2=Z)
  lengthAxis?: 0 | 1 | 2
  // Rotation offset to align CAD model with Three.js coordinate system
  // CAD typically uses Z-up, Three.js uses Y-up
  // Format: [x, y, z] in radians
  rotationOffset?: [number, number, number]
  // Position offset to center the model (if model origin is not centered)
  // Format: [x, y, z] in model units (before scaling)
  positionOffset?: [number, number, number]
  // Optional: connection point overrides (if different from procedural)
  connectionPoints?: {
    [key: string]: {
      position: [number, number, number] // Relative position at reference DN
      direction: [number, number, number] // Normal vector
    }
  }
}

// Default model scale for models that are already correctly sized at DN100
// Set to 1 if your CAD models are in mm and correctly sized
export const DEFAULT_MODEL_SCALE = 1

// Rotation to convert Z-up (CAD) to Y-up (Three.js): -90° around X-axis
export const CAD_TO_THREEJS_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

// Registry mapping component types to their CAD model configurations
// Models are stored in public/models/ and served at /models/
export const MODEL_REGISTRY: Partial<Record<PipeComponentType, ModelConfig>> = {
  elbow: {
    modelPath: '/models/elbows/elbow_90.glb',
    referenceDN: 100,
    modelScale: DEFAULT_MODEL_SCALE,
    // Rotation math (Euler XYZ, Three.js convention):
    // GLB has 90° X rotation baked into nodes, so arms are in Y+ and Z+ (scene space).
    // R_x(π): flips Y+ → Y-, Z+ → Z-
    // R_y(-π/2): maps Z- → X+
    // Combined Euler XYZ [π, -π/2, 0]:
    //   inlet arm (Y+) → Y- (down), outlet arm (Z+) → X+ (right) — matches procedural.
    rotationOffset: [Math.PI, -Math.PI / 2, 0],
    positionOffset: [0, 0, 0],
  },
}

// Helper to check if a CAD model exists for a component type
export const hasCADModel = (type: PipeComponentType): boolean => {
  return type in MODEL_REGISTRY
}

// Helper to get model config
export const getModelConfig = (type: PipeComponentType): ModelConfig | undefined => {
  return MODEL_REGISTRY[type]
}

// Calculate scale factor based on target DN, reference DN, and optional model scale adjustment
export const calculateScaleFactor = (targetDN: number, referenceDN: number, modelScale: number = 1): number => {
  // modelScale adjusts for models in wrong units
  // DN ratio scales for the selected pipe size
  // Division by 1000 converts mm to meters (scene units)
  return (targetDN / referenceDN) * modelScale / 1000
}
