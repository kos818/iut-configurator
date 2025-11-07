import { Vector3, Euler } from 'three'

/**
 * Calculate rotation needed to align a direction vector with a target direction
 * Used for automatic component orientation when connecting
 */
export const calculateRotationToAlign = (
  fromDirection: Vector3,
  toDirection: Vector3
): Euler => {
  // Normalize both directions
  const from = fromDirection.clone().normalize()
  const to = toDirection.clone().normalize()

  // Calculate rotation axis (cross product)
  const axis = new Vector3().crossVectors(from, to)

  // If vectors are parallel or anti-parallel, handle special cases
  if (axis.length() < 0.0001) {
    // Vectors are parallel - no rotation needed
    if (from.dot(to) > 0) {
      return new Euler(0, 0, 0)
    }
    // Vectors are anti-parallel - 180 degree rotation
    return new Euler(Math.PI, 0, 0)
  }

  // Calculate rotation angle
  const angle = Math.acos(Math.max(-1, Math.min(1, from.dot(to))))

  // Normalize rotation axis
  axis.normalize()

  // Convert axis-angle to Euler angles
  // This is a simplified approach - for more complex cases, use Quaternions
  const euler = new Euler()

  // Map axis and angle to Euler angles
  // This is an approximation that works for most pipe connections
  if (Math.abs(axis.x) > 0.5) {
    euler.x = angle * Math.sign(axis.x)
  }
  if (Math.abs(axis.y) > 0.5) {
    euler.y = angle * Math.sign(axis.y)
  }
  if (Math.abs(axis.z) > 0.5) {
    euler.z = angle * Math.sign(axis.z)
  }

  return euler
}

/**
 * Calculate the rotation needed for a new component to connect properly
 * The new component's first connection point should face opposite to the target
 */
export const calculateConnectionRotation = (
  targetDirection: Vector3,
  newComponentFirstCPDirection: Vector3
): Vector3 => {
  // We want the new component's first CP to point in the opposite direction
  // of the target CP (so they face each other)
  const oppositeDirection = targetDirection.clone().multiplyScalar(-1)

  const euler = calculateRotationToAlign(newComponentFirstCPDirection, oppositeDirection)

  return new Vector3(euler.x, euler.y, euler.z)
}
