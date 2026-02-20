import { ComponentTemplate, DNValue, PNValue } from '../types'

// Component groups for better organization
export type ComponentGroup =
  | 'pipes'          // Rohr
  | 'elbows'         // Bögen/Winkel
  | 'branches'       // Verzweigungen
  | 'connections'    // Verbindungen

export const componentGroupNames: Record<ComponentGroup, string> = {
  pipes: 'Rohr',
  elbows: 'Bögen & Winkel',
  branches: 'Verzweigungen',
  connections: 'Verbindungen',
}

export const componentGroupDescriptions: Record<ComponentGroup, string> = {
  pipes: 'Länge je nach Wunsch anpassbar',
  elbows: 'Rohrbögen mit unterschiedlichen Winkeln',
  branches: 'T-Stücke und Abzweigungen',
  connections: 'Flansche und Verbindungselemente',
}

export const componentTemplates: ComponentTemplate[] = [
  // PIPES GROUP
  {
    type: 'straight',
    name: 'Gerades Rohr',
    description: 'Gerades Rohr',
    group: 'pipes',
    defaultDN: 50,
    defaultWallThickness: 3,
    availableWallThicknesses: [2, 2.5, 3, 4, 5, 6],
    defaultLength: 1000,
    basePrice: 15.0,
    pricePerMM: 0.02,
    pricePerMMWallThickness: 0.5,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },

  // ELBOWS GROUP
  {
    type: 'elbow',
    name: 'Rohrbogen 90°',
    description: 'Rechtwinkliger Rohrbogen',
    group: 'elbows',
    defaultDN: 50,
    defaultWallThickness: 3,
    availableWallThicknesses: [2, 2.5, 3, 4, 5, 6],
    defaultAngle: 90,
    defaultElbowArmLengths: { inlet: 150, outlet: 150 },
    basePrice: 25.0,
    pricePerMMWallThickness: 0.8,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },

  // BRANCHES GROUP
  {
    type: 'tee',
    name: 'T-Stück 45°',
    description: 'T-Verbindung für drei Rohre',
    group: 'branches',
    defaultDN: 50,
    defaultWallThickness: 3,
    availableWallThicknesses: [2, 2.5, 3, 4, 5, 6],
    defaultTeeArmLengths: { inlet: 156, outlet: 156, branch: 177 },
    basePrice: 35.0,
    pricePerMMWallThickness: 1.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet', 'branch'],
  },

  // CONNECTIONS GROUP
  {
    type: 'glatter_flansch',
    name: 'Glatter Flansch',
    description: 'Vorschweißflansch DN100 V4A',
    group: 'connections',
    defaultDN: 100,
    basePrice: 45.0,
    availableDNs: [100] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'losflansch',
    name: 'Losflansch',
    description: 'Losflansch DN100 V4A',
    group: 'connections',
    defaultDN: 100,
    basePrice: 38.0,
    availableDNs: [100] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'vorschweissboerdel',
    name: 'Vorschweißbördel',
    description: 'Vorschweißbördel DN100 V4A',
    group: 'connections',
    defaultDN: 100,
    basePrice: 32.0,
    availableDNs: [100] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'ffq_stueck',
    name: 'FFQ-Stück',
    description: 'FFQ-Stück mit Losflansch DN100 V4A',
    group: 'connections',
    defaultDN: 100,
    basePrice: 120.0,
    availableDNs: [100] as DNValue[],
    defaultPN: 16 as PNValue,
    availablePNs: [6, 10, 16, 25, 40] as PNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet', 'branch'],
  },
]

// Material multipliers for pricing
export const materialMultipliers: Record<string, number> = {
  steel: 1.0,
  stainless_v2a: 2.5,
  stainless_v4a: 3.5,
}

// PN multipliers for pricing (higher pressure = more expensive)
export const pnMultipliers: Record<number, number> = {
  6: 0.8,
  10: 1.0,
  16: 1.2,
  25: 1.5,
  40: 2.0,
}
