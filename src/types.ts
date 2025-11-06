import { Vector3 } from 'three'

export type PipeComponentType = 'straight' | 'elbow' | 'tee' | 'valve' | 'flange' | 'reducer'

export interface PipeComponent {
  id: string
  type: PipeComponentType
  position: Vector3
  rotation: Vector3
  diameter: number // in mm
  length?: number // in mm (for straight pipes)
  angle?: number // in degrees (for elbows)
  price: number // in EUR
  material: 'steel' | 'stainless' | 'copper' | 'pvc'
}

export interface ComponentTemplate {
  type: PipeComponentType
  name: string
  description: string
  defaultDiameter: number
  defaultLength?: number
  defaultAngle?: number
  basePrice: number // base price in EUR
  pricePerMM?: number // additional price per mm length
  availableDiameters: number[]
  material: 'steel' | 'stainless' | 'copper' | 'pvc'
}

export interface ProjectData {
  components: PipeComponent[]
  totalPrice: number
  name: string
  createdAt: string
  updatedAt: string
}
