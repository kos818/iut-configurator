import { Vector3 } from 'three'

export function snapToGrid(position: Vector3, gridSize: number): Vector3 {
  return new Vector3(
    Math.round(position.x / gridSize) * gridSize,
    Math.round(position.y / gridSize) * gridSize,
    Math.round(position.z / gridSize) * gridSize
  )
}
