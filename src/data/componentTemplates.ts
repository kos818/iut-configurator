import { ComponentTemplate } from '../types'

export const componentTemplates: ComponentTemplate[] = [
  {
    type: 'straight',
    name: 'Gerades Rohr',
    description: 'Standardrohr in verschiedenen Längen',
    defaultDiameter: 50,
    defaultLength: 1000,
    basePrice: 15.0,
    pricePerMM: 0.02,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125, 160],
    material: 'steel',
  },
  {
    type: 'elbow',
    name: 'Rohrbogen 90°',
    description: 'Rohrbogen mit 90 Grad Winkel',
    defaultDiameter: 50,
    defaultAngle: 90,
    basePrice: 25.0,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125, 160],
    material: 'steel',
  },
  {
    type: 'elbow',
    name: 'Rohrbogen 45°',
    description: 'Rohrbogen mit 45 Grad Winkel',
    defaultDiameter: 50,
    defaultAngle: 45,
    basePrice: 22.0,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125, 160],
    material: 'steel',
  },
  {
    type: 'tee',
    name: 'T-Stück',
    description: 'T-Verbindung für drei Rohre',
    defaultDiameter: 50,
    basePrice: 35.0,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125, 160],
    material: 'steel',
  },
  {
    type: 'valve',
    name: 'Absperrventil',
    description: 'Ventil zum Absperren des Durchflusses',
    defaultDiameter: 50,
    basePrice: 85.0,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125],
    material: 'steel',
  },
  {
    type: 'flange',
    name: 'Flansch',
    description: 'Flanschverbindung',
    defaultDiameter: 50,
    basePrice: 45.0,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125, 160],
    material: 'steel',
  },
  {
    type: 'reducer',
    name: 'Reduzierstück',
    description: 'Übergang zwischen verschiedenen Durchmessern',
    defaultDiameter: 50,
    basePrice: 30.0,
    availableDiameters: [25, 32, 40, 50, 63, 75, 90, 110, 125, 160],
    material: 'steel',
  },
]

// Material multipliers for pricing
export const materialMultipliers: Record<string, number> = {
  steel: 1.0,
  stainless: 2.5,
  copper: 3.0,
  pvc: 0.4,
}
