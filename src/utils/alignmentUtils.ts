import { Vector3, Quaternion, Euler, Object3D } from 'three'
import { PipeComponent, ConnectionPoint } from '../types'
import { getWorldPosition, getWorldDirection } from './connectionHelpers'

/**
 * Compute position and rotation to align a moving component's connection point
 * to a target component's connection point.
 *
 * Connection convention (this codebase):
 *   - Each ConnectionPoint.direction points OUTWARD from the component
 *   - Two mating connections must be anti-parallel (facing each other)
 *   - The moving component is rotated so its CP direction = -targetCPDirection
 *   - The moving component is positioned so its CP position = targetCPPosition
 *
 * Returns world-space position and quaternion for the moving component.
 */
export function computeConnectionAlignment(
  targetComponent: PipeComponent,
  targetCP: ConnectionPoint,
  movingCPLocalPos: Vector3,
  movingCPLocalDir: Vector3
): { position: Vector3; quaternion: Quaternion } {
  // 1. Target connection point in world space
  const targetWorldPos = getWorldPosition(targetComponent, targetCP)
  const targetWorldDir = getWorldDirection(targetComponent, targetCP)

  // 2. Alignment rotation
  //    Moving CP's outward normal must become anti-parallel to target's outward normal.
  //    i.e. movingCPDir_world = -targetWorldDir  (they face each other)
  const movingDirNorm = movingCPLocalDir.clone().normalize()
  const desiredDir = targetWorldDir.clone().negate()
  const alignQuat = new Quaternion().setFromUnitVectors(movingDirNorm, desiredDir)

  // 3. Position
  //    After rotation the CP local position is transformed:
  //      cpWorld = componentOrigin + alignQuat * cpLocal
  //    We want cpWorld = targetWorldPos, so:
  //      componentOrigin = targetWorldPos - alignQuat * cpLocal
  const cpRotated = movingCPLocalPos.clone().applyQuaternion(alignQuat)
  const newPosition = targetWorldPos.clone().sub(cpRotated)

  return { position: newPosition, quaternion: alignQuat }
}

/**
 * Convenience: align any component to any other using their ConnectionPoint objects.
 */
export function computeSnapAlignment(
  targetComponent: PipeComponent,
  targetCP: ConnectionPoint,
  _movingComponent: PipeComponent,
  movingCP: ConnectionPoint
): { position: Vector3; quaternion: Quaternion } {
  return computeConnectionAlignment(
    targetComponent,
    targetCP,
    movingCP.position,
    movingCP.direction
  )
}

/**
 * Convert alignment result to Euler-based { position, rotation } for store update.
 *
 * WARNING: Euler conversion can lose information at gimbal lock (Y = +/-90 deg).
 * If you hit visual glitches at those angles, use the quaternion directly via
 * R3F's <group quaternion={[x,y,z,w]}> prop instead.
 */
export function toStoreTransform(
  alignment: { position: Vector3; quaternion: Quaternion }
): { position: Vector3; rotation: Vector3 } {
  const euler = new Euler().setFromQuaternion(alignment.quaternion)
  return {
    position: alignment.position.clone(),
    rotation: new Vector3(euler.x, euler.y, euler.z),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Imperative (ref-based) version — works directly on THREE.Object3D refs.
// Use this for debugging or when you have refs to the <group> elements.
// In a declarative R3F app, prefer computeConnectionAlignment + store update.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Imperatively align an elbow Object3D to the top of a pipe Object3D.
 *
 * Geometry assumptions (matching this codebase):
 *   - Pipe: cylinder centered at group origin, top opening at local (0, +halfLength, 0)
 *   - Pipe outlet normal: local (0, 1, 0)
 *   - Elbow: bend center at group origin, inlet arm along -Y
 *   - Elbow inlet CP: local (0, -inletLength, 0), normal (0, -1, 0)
 *
 * @param pipeObj          Pipe's root Object3D (the R3F <group>)
 * @param elbowObj         Elbow's root Object3D (will be mutated)
 * @param pipeHalfLength   Distance from pipe center to top opening (meters)
 * @param elbowInletLength Distance from elbow bend center to inlet CP (meters)
 */
export function alignElbowToPipe(
  pipeObj: Object3D,
  elbowObj: Object3D,
  pipeHalfLength: number,
  elbowInletLength: number
): void {
  pipeObj.updateMatrixWorld(true)

  // ── 1. Pipe top center → WORLD ──
  const pipeTopWorld = new Vector3(0, pipeHalfLength, 0)
    .applyMatrix4(pipeObj.matrixWorld)

  // ── 2. Pipe opening normal → WORLD ──
  const pipeQuat = pipeObj.getWorldQuaternion(new Quaternion())
  const pipeNormalWorld = new Vector3(0, 1, 0).applyQuaternion(pipeQuat)

  // ── 3. Elbow inlet direction (LOCAL) ──
  //    Inlet arm extends along -Y → outward normal = (0, -1, 0)
  const elbowInletDir = new Vector3(0, -1, 0)

  // ── 4. Alignment quaternion ──
  //    Rotate inlet normal to face INTO the pipe opening = -pipeNormal
  const targetDir = pipeNormalWorld.clone().negate()
  const alignQuat = new Quaternion().setFromUnitVectors(elbowInletDir, targetDir)

  // ── 5. Position with connection-point offset ──
  //    Inlet CP is at local (0, -inletLength, 0).
  //    After rotation: cpWorld = origin + alignQuat * cpLocal
  //    We want cpWorld = pipeTopWorld
  //    => origin = pipeTopWorld - alignQuat * cpLocal
  const cpLocal = new Vector3(0, -elbowInletLength, 0)
  const cpRotated = cpLocal.clone().applyQuaternion(alignQuat)
  const elbowWorldPos = pipeTopWorld.clone().sub(cpRotated)

  // ── 6. Apply in parent-local space ──
  if (elbowObj.parent) {
    // Convert world quaternion → parent-local quaternion
    const parentQuatInv = elbowObj.parent
      .getWorldQuaternion(new Quaternion())
      .invert()
    elbowObj.quaternion.copy(parentQuatInv.multiply(alignQuat))

    // Convert world position → parent-local position
    const parentMatInv = elbowObj.parent.matrixWorld.clone().invert()
    elbowObj.position.copy(elbowWorldPos.applyMatrix4(parentMatInv))
  } else {
    elbowObj.quaternion.copy(alignQuat)
    elbowObj.position.copy(elbowWorldPos)
  }

  elbowObj.updateMatrixWorld(true)
}
