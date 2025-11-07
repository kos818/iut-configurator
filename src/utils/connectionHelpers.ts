import { Vector3, Euler } from 'three'
import { PipeComponent, ConnectionPoint, Connection, DNValue, SNAP_DISTANCE, DN_TO_MM } from '../types'
import { componentTemplates } from '../data/componentTemplates'

// Generate connection points for a component based on its type and position
export const generateConnectionPoints = (component: PipeComponent): ConnectionPoint[] => {
  const template = componentTemplates.find(t => t.type === component.type)
  if (!template) return []

  const points: ConnectionPoint[] = []
  const dn = component.dn
  const radius = (DN_TO_MM[dn] / 2) / 1000 // convert to meters
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
      const bendRadius = radius * 3
      // Inlet at bottom
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -bendRadius / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })
      // Outlet at side (90 degree bend)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(bendRadius / 2, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'tee': {
      const length = radius * 4
      // Inlet
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(-length / 2, 0, 0),
        direction: new Vector3(-1, 0, 0),
        dn,
        connectedTo: null,
      })
      // Outlet
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(length / 2, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn,
        connectedTo: null,
      })
      // Branch
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(0, length / 4, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'valve':
    case 'flange': {
      const bodyLength = radius * 3
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -bodyLength / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, bodyLength / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'reducer': {
      const length = radius * 2
      // For reducer, inlet has larger DN, outlet has smaller DN
      // This is a simplification - in reality user should be able to set both
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -length / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn, // larger DN
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, length / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn: Math.max(20, dn - 10) as DNValue, // smaller DN (simplified)
        connectedTo: null,
      })
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
  movingComponent: PipeComponent,
  movingCP: ConnectionPoint,
  targetComponent: PipeComponent,
  targetCP: ConnectionPoint
): { position: Vector3; rotation: Vector3 } => {
  // Get world position of target connection point
  const targetWorldPos = getWorldPosition(targetComponent, targetCP)

  // Calculate offset from moving component's position to its connection point
  const cpOffset = movingCP.position.clone()

  // New position: target position minus the offset
  const newPosition = targetWorldPos.clone().sub(cpOffset)

  // For now, keep original rotation (rotation alignment is complex)
  // TODO: Calculate proper rotation to align directions
  const newRotation = movingComponent.rotation.clone()

  return { position: newPosition, rotation: newRotation }
}
