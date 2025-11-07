import { ComponentTemplate, DNValue } from '../types'

export const componentTemplates: ComponentTemplate[] = [
  {
    type: 'straight',
    name: 'Gerades Rohr',
    description: 'Standardrohr in verschiedenen Längen',
    defaultDN: 50,
    defaultLength: 1000,
    basePrice: 15.0,
    pricePerMM: 0.02,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'elbow',
    name: 'Rohrbogen 90°',
    description: 'Rohrbogen mit 90 Grad Winkel',
    defaultDN: 50,
    defaultAngle: 90,
    defaultElbowArmLengths: { inlet: 150, outlet: 150 }, // Default arm lengths in mm
    basePrice: 25.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'elbow',
    name: 'Rohrbogen 45°',
    description: 'Rohrbogen mit 45 Grad Winkel',
    defaultDN: 50,
    defaultAngle: 45,
    defaultElbowArmLengths: { inlet: 150, outlet: 150 }, // Default arm lengths in mm
    basePrice: 22.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'tee',
    name: 'T-Stück',
    description: 'T-Verbindung für drei Rohre',
    defaultDN: 50,
    defaultTeeArmLengths: { inlet: 200, outlet: 200, branch: 200 }, // Default arm lengths in mm
    basePrice: 35.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet', 'branch'],
  },
  {
    type: 'valve',
    name: 'Absperrventil',
    description: 'Ventil zum Absperren des Durchflusses',
    defaultDN: 50,
    basePrice: 85.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'flange',
    name: 'Flansch',
    description: 'Flanschverbindung',
    defaultDN: 50,
    basePrice: 45.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'],
  },
  {
    type: 'reducer',
    name: 'Reduzierstück',
    description: 'Übergang zwischen verschiedenen Durchmessern',
    defaultDN: 50,
    basePrice: 30.0,
    availableDNs: [20, 25, 32, 40, 50, 65, 80, 100, 125, 150] as DNValue[],
    material: 'steel',
    connectionPointTypes: ['inlet', 'outlet'], // Note: inlet and outlet will have different DNs for reducers
  },
]

// Material multipliers for pricing
export const materialMultipliers: Record<string, number> = {
  steel: 1.0,
  stainless: 2.5,
  copper: 3.0,
  pvc: 0.4,
}
