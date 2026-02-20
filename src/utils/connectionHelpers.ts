import { Vector3, Euler, Quaternion } from 'three'
import { PipeComponent, ConnectionPoint, Connection, DNValue, SNAP_DISTANCE } from '../types'
import { componentTemplates } from '../data/componentTemplates'
import { getModelConnectionPoints } from '../data/modelRegistry'

// Generate connection points for a component based on its type and position
export const generateConnectionPoints = (component: PipeComponent): ConnectionPoint[] => {
  const template = componentTemplates.find(t => t.type === component.type)
  if (!template) return []

  const points: ConnectionPoint[] = []
  const dn = component.dn
  const labels = ['A', 'B', 'C', 'D'] // Alphabetic labels

  switch (component.type) {
    case 'straight': {
      const length = (component.length || 1000) / 1000 // convert mm to meters
      // Inlet at bottom, outlet at top (relative to component)
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -length / 2, 0),
        direction: new Vector3(0, -1, 0), // pointing down
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, length / 2, 0),
        direction: new Vector3(0, 1, 0), // pointing up
        dn,
        connectedTo: null,
      })
      break
    }

    case 'elbow': {
      // If a CAD model with connection points is registered, use those
      // so that logical connection points always match the visual geometry.
      const modelCPs = getModelConnectionPoints(component.type, dn)
      if (modelCPs && modelCPs.length >= 2) {
        const cpA = modelCPs.find(c => c.name === 'A') || modelCPs[0]
        const cpB = modelCPs.find(c => c.name === 'B') || modelCPs[1]

        points.push({
          id: `${component.id}-inlet`,
          componentId: component.id,
          type: 'inlet',
          label: labels[0],
          position: new Vector3(...cpA.position),
          direction: new Vector3(...cpA.direction),
          dn,
          connectedTo: null,
        })
        points.push({
          id: `${component.id}-outlet`,
          componentId: component.id,
          type: 'outlet',
          label: labels[1],
          position: new Vector3(...cpB.position),
          direction: new Vector3(...cpB.direction),
          dn,
          connectedTo: null,
        })
        break
      }

      // Fallback: compute from angle (when no CAD model is registered)
      const defaultArmLength = dn * 1.525
      const armLengths = component.elbowArmLengths || {
        inlet: defaultArmLength,
        outlet: defaultArmLength
      }

      const angleInDegrees = component.angle || 90
      const angleInRadians = (angleInDegrees * Math.PI) / 180

      const inletLengthM = armLengths.inlet / 1000
      const outletLengthM = armLengths.outlet / 1000

      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0],
        position: new Vector3(0, -inletLengthM, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })

      const outletDirX = Math.sin(angleInRadians)
      const outletDirY = -Math.cos(angleInRadians)

      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1],
        position: new Vector3(outletLengthM * outletDirX, outletLengthM * outletDirY, 0),
        direction: new Vector3(outletDirX, outletDirY, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'tee': {
      const armLengths = component.teeArmLengths || {
        inlet: 156,
        outlet: 156,
        branch: 177
      }

      // GLB models are DN100-based — scale arm lengths proportionally
      const dnScale = component.dn / 100
      const inletLengthM = (armLengths.inlet * dnScale) / 1000
      const outletLengthM = (armLengths.outlet * dnScale) / 1000
      const branchLengthM = (armLengths.branch * dnScale) / 1000

      const branchAngleRad = ((component.branchAngle || 45) * Math.PI) / 180

      // Branch opening center direction from tee origin (measured from STEP)
      const openingAngle = Math.atan2(149.71, 94.51)
      const openDirX = Math.cos(openingAngle)
      const openDirY = Math.sin(openingAngle)

      const teeBranchX = branchLengthM * openDirX
      const teeBranchY = branchLengthM * openDirY

      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0],
        position: new Vector3(-inletLengthM, 0, 0),
        direction: new Vector3(-1, 0, 0),
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1],
        position: new Vector3(outletLengthM, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2],
        position: new Vector3(teeBranchX, teeBranchY, 0),
        direction: new Vector3(Math.cos(branchAngleRad), Math.sin(branchAngleRad), 0).normalize(),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'glatter_flansch':
    case 'losflansch':
    case 'vorschweissboerdel': {
      // Use model connection points (2 points: A=pipe side, B=flange face)
      const modelCPs = getModelConnectionPoints(component.type, dn)
      if (modelCPs && modelCPs.length >= 2) {
        const cpA = modelCPs.find(c => c.name === 'A') || modelCPs[0]
        const cpB = modelCPs.find(c => c.name === 'B') || modelCPs[1]
        points.push({
          id: `${component.id}-inlet`,
          componentId: component.id,
          type: 'inlet',
          label: labels[0],
          position: new Vector3(...cpA.position),
          direction: new Vector3(...cpA.direction),
          dn,
          connectedTo: null,
        })
        points.push({
          id: `${component.id}-outlet`,
          componentId: component.id,
          type: 'outlet',
          label: labels[1],
          position: new Vector3(...cpB.position),
          direction: new Vector3(...cpB.direction),
          dn,
          connectedTo: null,
        })
      }
      break
    }

    case 'ffq_stueck': {
      // FFQ: 3 connection points (A=pipe end, B=main flange, C=branch flange)
      const modelCPs = getModelConnectionPoints(component.type, dn)
      if (modelCPs && modelCPs.length >= 3) {
        const cpA = modelCPs.find(c => c.name === 'A') || modelCPs[0]
        const cpB = modelCPs.find(c => c.name === 'B') || modelCPs[1]
        const cpC = modelCPs.find(c => c.name === 'C') || modelCPs[2]
        points.push({
          id: `${component.id}-inlet`,
          componentId: component.id,
          type: 'inlet',
          label: labels[0],
          position: new Vector3(...cpA.position),
          direction: new Vector3(...cpA.direction),
          dn,
          connectedTo: null,
        })
        points.push({
          id: `${component.id}-outlet`,
          componentId: component.id,
          type: 'outlet',
          label: labels[1],
          position: new Vector3(...cpB.position),
          direction: new Vector3(...cpB.direction),
          dn,
          connectedTo: null,
        })
        points.push({
          id: `${component.id}-branch`,
          componentId: component.id,
          type: 'branch',
          label: labels[2],
          position: new Vector3(...cpC.position),
          direction: new Vector3(...cpC.direction),
          dn,
          connectedTo: null,
        })
      }
      break
    }
  }

  return points
}

// Get world position of a connection point
export const getWorldPosition = (component: PipeComponent, connectionPoint: ConnectionPoint): Vector3 => {
  // Apply component's rotation and position to the connection point's relative position
  const worldPos = connectionPoint.position.clone()
  worldPos.applyEuler(new Euler(component.rotation.x, component.rotation.y, component.rotation.z))
  worldPos.add(component.position)
  return worldPos
}

// Get world direction of a connection point
export const getWorldDirection = (component: PipeComponent, connectionPoint: ConnectionPoint): Vector3 => {
  // Apply component's rotation to the connection point's direction
  const worldDir = connectionPoint.direction.clone()
  worldDir.applyEuler(new Euler(component.rotation.x, component.rotation.y, component.rotation.z))
  return worldDir.normalize()
}

// Find nearby connection points for snapping
export const findNearbyConnectionPoints = (
  components: PipeComponent[],
  targetPoint: Vector3,
  excludeComponentId: string
): { component: PipeComponent; connectionPoint: ConnectionPoint; distance: number }[] => {
  const nearby: { component: PipeComponent; connectionPoint: ConnectionPoint; distance: number }[] = []

  components.forEach(component => {
    if (component.id === excludeComponentId) return

    component.connectionPoints.forEach(cp => {
      if (cp.connectedTo) return // already connected

      const worldPos = getWorldPosition(component, cp)
      const distance = worldPos.distanceTo(targetPoint)

      if (distance < SNAP_DISTANCE) {
        nearby.push({ component, connectionPoint: cp, distance })
      }
    })
  })

  // Sort by distance
  return nearby.sort((a, b) => a.distance - b.distance)
}

// Validate DN compatibility
export const validateDNConnection = (dn1: DNValue, dn2: DNValue): { isValid: boolean; message?: string } => {
  if (dn1 === dn2) {
    return { isValid: true }
  }

  // Allow connection if difference is small (one size up/down)
  const diff = Math.abs(dn1 - dn2)
  if (diff <= 10) {
    return {
      isValid: true,
      message: `Warnung: DN${dn1} zu DN${dn2} - Übergang akzeptabel aber nicht ideal`
    }
  }

  return {
    isValid: false,
    message: `Fehler: DN${dn1} zu DN${dn2} - Zu großer Unterschied! Reduzierstück benötigt.`
  }
}

// Create connection between two connection points
export const createConnection = (
  cp1: ConnectionPoint,
  cp2: ConnectionPoint
): Connection => {
  const validation = validateDNConnection(cp1.dn, cp2.dn)

  return {
    id: `conn-${cp1.id}-${cp2.id}`,
    from: cp1.id,
    to: cp2.id,
    isValid: validation.isValid,
    validationMessage: validation.message,
  }
}

// Update component validation status
export const updateComponentValidation = (
  component: PipeComponent,
  connections: Connection[]
): { isValid: boolean; messages: string[] } => {
  const messages: string[] = []
  let isValid = true

  // Check all connections involving this component
  component.connectionPoints.forEach(cp => {
    const relatedConnections = connections.filter(
      conn => conn.from === cp.id || conn.to === cp.id
    )

    relatedConnections.forEach(conn => {
      if (!conn.isValid) {
        isValid = false
        if (conn.validationMessage) {
          messages.push(conn.validationMessage)
        }
      }
    })
  })

  // Check for unconnected points (could be valid, just informational)
  const unconnectedCount = component.connectionPoints.filter(cp => !cp.connectedTo).length
  if (unconnectedCount > 0 && component.connectionPoints.length > 0) {
    messages.push(`${unconnectedCount} Anschlusspunkt(e) nicht verbunden`)
  }

  return { isValid, messages }
}

// Calculate snap position and rotation for automatic alignment
export const calculateSnapTransform = (
  _movingComponent: PipeComponent,
  movingCP: ConnectionPoint,
  targetComponent: PipeComponent,
  targetCP: ConnectionPoint
): { position: Vector3; rotation: Vector3 } => {
  // Get world position and direction of target connection point
  const targetWorldPos = getWorldPosition(targetComponent, targetCP)
  const targetWorldDir = getWorldDirection(targetComponent, targetCP)

  // Compute alignment rotation:
  // The moving CP's outward direction must become anti-parallel to the target's
  // outward direction (they face each other for a proper connection).
  const movingDirNorm = movingCP.direction.clone().normalize()
  const desiredDir = targetWorldDir.clone().negate()
  const alignQuat = new Quaternion().setFromUnitVectors(movingDirNorm, desiredDir)

  // Compute position:
  // After rotation, the CP local position is transformed by the alignment quaternion.
  //   cpWorld = componentOrigin + alignQuat * cpLocal
  // We want cpWorld = targetWorldPos, therefore:
  //   componentOrigin = targetWorldPos - alignQuat * cpLocal
  const cpRotated = movingCP.position.clone().applyQuaternion(alignQuat)
  const newPosition = targetWorldPos.clone().sub(cpRotated)

  // Convert quaternion to Euler for the store
  const euler = new Euler().setFromQuaternion(alignQuat)
  const newRotation = new Vector3(euler.x, euler.y, euler.z)

  return { position: newPosition, rotation: newRotation }
}
