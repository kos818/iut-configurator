import { Vector3 } from 'three'

export type PipeComponentType =
  | 'straight'
  | 'elbow'
  | 'tee'
  | 'glatter_flansch'       // Glatter Flansch (Vorschweißflansch)
  | 'losflansch'             // Losflansch
  | 'vorschweissboerdel'     // Vorschweißbördel
  | 'ffq_stueck'             // FFQ-Stück mit Losflansch
export type MaterialType = 'steel' | 'stainless_v2a' | 'stainless_v4a'

// DN (Diameter Nominal) values
export type DNValue = 20 | 25 | 32 | 40 | 50 | 65 | 80 | 100 | 125 | 150

// PN (Pressure Nominal) values in bar
export type PNValue = 6 | 10 | 16 | 25 | 40

// Connection method type
export type ConnectionMethod = 'welded' | 'flanged'

// Connection point on a component
export interface ConnectionPoint {
  id: string
  componentId: string
  type: 'inlet' | 'outlet' | 'branch' | 'branch2' | 'branch3' // branch for T-pieces, branch2/3 for cross pieces
  label: string // A, B, C, etc.
  position: Vector3 // relative to component
  direction: Vector3 // normal vector showing connection direction
  dn: DNValue
  connectedTo: string | null // ID of connected connection point
  connectionMethod?: ConnectionMethod // How this point is connected (welded or flanged)
}

// Connection between two components
export interface Connection {
  id: string
  from: string // connection point ID
  to: string // connection point ID
  isValid: boolean // DN compatibility check
  validationMessage?: string
}

// T-piece arm lengths
export interface TeeArmLengths {
  inlet: number   // Arm A (left) in mm
  outlet: number  // Arm B (right) in mm
  branch: number  // Arm C (top) in mm
}

// Elbow arm lengths
export interface ElbowArmLengths {
  inlet: number   // Arm A (inlet) in mm
  outlet: number  // Arm B (outlet) in mm
}

// Branch configuration for components with branches
export interface BranchConfig {
  angle: number // in degrees
  position: number // position along main axis (0-1)
  dn: DNValue // DN of branch
  length: number // length of branch in mm
}

export interface PipeComponent {
  id: string
  type: PipeComponentType
  position: Vector3
  rotation: Vector3
  dn: DNValue // Changed from diameter
  pn: PNValue // Pressure Nominal in bar
  wallThickness?: number // in mm (wall thickness / Wandstärke)
  length?: number // in mm (for straight pipes)
  angle?: number // in degrees (for elbows)
  armLength?: number // in mm (for tee pieces - deprecated, use teeArmLengths)
  teeArmLengths?: TeeArmLengths // in mm (for tee pieces - individual arm lengths)
  elbowArmLengths?: ElbowArmLengths // in mm (for elbows - individual arm lengths)

  // F-Stück properties
  flangePosition?: 'inlet' | 'outlet' | 'both' // Which side has flange

  // Branch configurations
  branch1?: BranchConfig // First branch configuration
  branch2?: BranchConfig // Second branch configuration

  // Elbow/Bend radius
  bendRadius?: number // in mm (for FFQ, FRK components)

  // Reducer properties
  inletDN?: DNValue // For reducers with different inlet/outlet DN
  outletDN?: DNValue // For reducers with different inlet/outlet DN
  branchDN?: DNValue // For T-pieces with different branch DN

  // Asymmetric T-piece properties
  branchOffset?: number // Offset from center in mm (for asymmetric FFFT)
  branchAngle?: number // Angle of branch in degrees (for asymmetric FFFT, default 90°)

  flangesIncludedInLength?: boolean // default: true — flanges are included in overall length

  price: number // in EUR
  material: MaterialType
  connectionPoints: ConnectionPoint[]
  isValid: boolean // overall validation status
  validationMessages: string[]
}

export interface ComponentTemplate {
  type: PipeComponentType
  name: string
  description: string
  group: string // Component group for organization
  defaultDN: DNValue
  defaultPN: PNValue
  availablePNs: PNValue[]
  defaultWallThickness?: number // default wall thickness in mm
  availableWallThicknesses?: number[] // available wall thicknesses in mm
  defaultLength?: number
  defaultAngle?: number
  defaultArmLength?: number // for tee pieces - deprecated, use defaultTeeArmLengths
  defaultTeeArmLengths?: TeeArmLengths // for tee pieces - individual arm lengths
  defaultElbowArmLengths?: ElbowArmLengths // for elbows - individual arm lengths

  // F-Stück defaults
  defaultFlangePosition?: 'inlet' | 'outlet' | 'both'

  // Branch defaults
  defaultBranch1?: Partial<BranchConfig>
  defaultBranch2?: Partial<BranchConfig>

  // Bend radius default
  defaultBendRadius?: number // in mm

  // Reducer defaults
  defaultInletDN?: DNValue
  defaultOutletDN?: DNValue
  defaultBranchDN?: DNValue

  // Asymmetric T-piece defaults
  defaultBranchOffset?: number // in mm
  defaultBranchAngle?: number // in degrees

  defaultFlangesIncludedInLength?: boolean // default: true

  basePrice: number // base price in EUR
  pricePerMM?: number // additional price per mm length
  pricePerMMWallThickness?: number // additional price per mm of wall thickness
  availableDNs: DNValue[]
  material: MaterialType
  // Define connection points (relative positions will be calculated based on DN)
  connectionPointTypes: Array<'inlet' | 'outlet' | 'branch' | 'branch2' | 'branch3'>
}

export interface ProjectData {
  components: PipeComponent[]
  connections: Connection[]
  totalPrice: number
  name: string
  createdAt: string
  updatedAt: string
}

// DN to actual diameter mapping (approximate, in mm)
export const DN_TO_MM: Record<DNValue, number> = {
  20: 20,
  25: 25,
  32: 32,
  40: 40,
  50: 50,
  65: 65,
  80: 80,
  100: 100,
  125: 125,
  150: 150,
}

// Snap distance for auto-connect (in meters in 3D space)
export const SNAP_DISTANCE = 0.15
