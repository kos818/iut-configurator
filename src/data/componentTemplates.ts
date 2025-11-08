import { ComponentTemplate, DNValue } from '../types'

// Component groups for better organization
export type ComponentGroup =
  | 'pipes'          // Rohre
  | 'elbows'         // Bögen/Winkel
  | 'branches'       // Verzweigungen
  | 'connections'    // Verbindungen
  | 'fittings'       // Armaturen
  | 'reducers'       // Formstücke

export const componentGroupNames: Record<ComponentGroup, string> = {
  pipes: 'Rohre',
  elbows: 'Bögen & Winkel',
  branches: 'Verzweigungen',
  connections: 'Verbindungen',
  fittings: 'Armaturen',
  reducers: 'Formstücke',
}

export const componentGroupDescriptions: Record<ComponentGroup, string> = {
  pipes: 'Gerade Rohre in verschiedenen Längen',
  elbows: 'Rohrbögen mit unterschiedlichen Winkeln',
  branches: 'T-Stücke, Kreuzstücke und Abzweigungen',
  connections: 'Flansche und Verbindungselemente',
  fittings: 'Ventile und Absperrungen',
  reducers: 'Reduzierstücke und Endkappen',
}

export const componentTemplates: ComponentTemplate[] = [
  // PIPES GROUP
  {
    type: 'straight',
    name: 'Gerades Rohr - Standard',
    description: 'Standardrohr 1000mm',
    group: 'pipes',
    defaultDN: 50,
    defaultLength: 1000,
    basePrice: 15.0,
    pricePerMM: 0.02,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'straight',
    name: 'Gerades Rohr - Kurz',
    description: 'Kurzes Rohr 500mm',
    group: 'pipes',
    defaultDN: 50,
    defaultLength: 500,
    basePrice: 12.0,
    pricePerMM: 0.02,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'straight',
    name: 'Gerades Rohr - Lang',
    description: 'Langes Rohr 2000mm',
    group: 'pipes',
    defaultDN: 50,
    defaultLength: 2000,
    basePrice: 25.0,
    pricePerMM: 0.02,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },

  // ELBOWS GROUP
  {
    type: 'elbow',
    name: 'Rohrbogen 30°',
    description: 'Flacher Rohrbogen',
    group: 'elbows',
    defaultDN: 50,
    defaultAngle: 30,
    defaultElbowArmLengths: { inlet: 150, outlet: 150 },
    basePrice: 20.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'elbow',
    name: 'Rohrbogen 45°',
    description: 'Mittlerer Rohrbogen',
    group: 'elbows',
    defaultDN: 50,
    defaultAngle: 45,
    defaultElbowArmLengths: { inlet: 150, outlet: 150 },
    basePrice: 22.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'elbow',
    name: 'Rohrbogen 90°',
    description: 'Rechtwinkliger Rohrbogen',
    group: 'elbows',
    defaultDN: 50,
    defaultAngle: 90,
    defaultElbowArmLengths: { inlet: 150, outlet: 150 },
    basePrice: 25.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },

  // BRANCHES GROUP
  {
    type: 'tee',
    name: 'T-Stück',
    description: 'T-Verbindung für drei Rohre',
    group: 'branches',
    defaultDN: 50,
    defaultTeeArmLengths: { inlet: 200, outlet: 200, branch: 200 },
    basePrice: 35.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet', 'branch'],
  },
  {
    type: 'cross',
    name: 'Kreuzstück',
    description: 'Kreuzverbindung für vier Rohre',
    group: 'branches',
    defaultDN: 50,
    basePrice: 55.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet', 'branch', 'branch2'],
  },

  // CONNECTIONS GROUP
  {
    type: 'flange',
    name: 'Flansch',
    description: 'Flanschverbindung',
    group: 'connections',
    defaultDN: 50,
    basePrice: 45.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },

  // FITTINGS GROUP
  {
    type: 'valve',
    name: 'Absperrventil',
    description: 'Ventil zum Absperren',
    group: 'fittings',
    defaultDN: 50,
    basePrice: 85.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'check_valve',
    name: 'Rückschlagventil',
    description: 'Verhindert Rückfluss',
    group: 'fittings',
    defaultDN: 50,
    basePrice: 95.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },

  // REDUCERS GROUP
  {
    type: 'reducer',
    name: 'Reduzierstück',
    description: 'Übergang zwischen DN-Größen',
    group: 'reducers',
    defaultDN: 50,
    basePrice: 30.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'cap',
    name: 'Endkappe',
    description: 'Verschluss für Rohrende',
    group: 'reducers',
    defaultDN: 50,
    basePrice: 18.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet'],
  },
]

// Material multipliers for pricing
export const materialMultipliers: Record<string, number> = {
  steel: 1.0,
  stainless: 2.5,
  copper: 3.0,
  pvc: 0.4,
}
