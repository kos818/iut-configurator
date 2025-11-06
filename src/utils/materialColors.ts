// Material colors for 3D visualization
export const getMaterialColor = (material: string, selected: boolean): string => {
  if (selected) {
    return '#4CAF50' // Green when selected
  }

  switch (material) {
    case 'steel':
      return '#78909C' // Blue-grey (steel)
    case 'stainless':
      return '#B0BEC5' // Light blue-grey (stainless steel)
    case 'copper':
      return '#D4845F' // Copper color
    case 'pvc':
      return '#E0E0E0' // Light grey (PVC)
    default:
      return '#78909C'
  }
}

export const getMaterialMetalness = (material: string): number => {
  switch (material) {
    case 'steel':
      return 0.8
    case 'stainless':
      return 0.9
    case 'copper':
      return 0.7
    case 'pvc':
      return 0.1
    default:
      return 0.8
  }
}

export const getMaterialRoughness = (material: string): number => {
  switch (material) {
    case 'steel':
      return 0.2
    case 'stainless':
      return 0.1
    case 'copper':
      return 0.3
    case 'pvc':
      return 0.6
    default:
      return 0.2
  }
}
