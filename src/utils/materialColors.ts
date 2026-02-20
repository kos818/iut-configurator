// Material colors for 3D visualization
export const getMaterialColor = (material: string, selected: boolean, collisionType?: 'warning' | 'blocked' | null): string => {
  // Collision takes highest priority
  if (collisionType === 'blocked') return '#F44336' // Red
  if (collisionType === 'warning') return '#FFC107' // Yellow/Amber

  if (selected) {
    return '#4CAF50' // Green when selected (high contrast on dark bg)
  }

  switch (material) {
    case 'steel':
      return '#78909C' // Blue-grey (steel)
    case 'stainless_v2a':
      return '#B0BEC5' // Light blue-grey (V2A / 1.4301)
    case 'stainless_v4a':
      return '#CFD8DC' // Bright silver-grey (V4A / 1.4401)
    default:
      return '#78909C'
  }
}

export const getMaterialMetalness = (material: string): number => {
  switch (material) {
    case 'steel':
      return 0.8
    case 'stainless_v2a':
      return 0.9
    case 'stainless_v4a':
      return 0.95
    default:
      return 0.8
  }
}

export const getMaterialRoughness = (material: string): number => {
  switch (material) {
    case 'steel':
      return 0.2
    case 'stainless_v2a':
      return 0.1
    case 'stainless_v4a':
      return 0.08
    default:
      return 0.2
  }
}
