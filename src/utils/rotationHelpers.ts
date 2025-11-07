import { Vector3, Euler, Quaternion } from 'three'

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

  // Check if vectors are parallel or anti-parallel
  const dot = from.dot(to)

  if (dot > 0.999999) {
    // Vectors are parallel - no rotation needed
    return new Euler(0, 0, 0)
  }

  if (dot < -0.999999) {
    // Vectors are anti-parallel - 180 degree rotation
    // Choose an arbitrary perpendicular axis
    let axis = new Vector3(1, 0, 0)
    if (Math.abs(from.x) > 0.9) {
      axis = new Vector3(0, 1, 0)
    }
    axis.cross(from).normalize()
    const quaternion = new Quaternion()
    quaternion.setFromAxisAngle(axis, Math.PI)
    const euler = new Euler()
    euler.setFromQuaternion(quaternion)
    return euler
  }

  // Calculate rotation using quaternion (most accurate method)
  const quaternion = new Quaternion()
  quaternion.setFromUnitVectors(from, to)

  // Convert quaternion to Euler angles
  const euler = new Euler()
  euler.setFromQuaternion(quaternion)

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
