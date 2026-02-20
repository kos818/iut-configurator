import { Vector3, Euler } from 'three'
import { PipeComponent } from '../types'

export interface Capsule {
  start: Vector3
  end: Vector3
  radius: number
  componentId: string
}

export interface CollisionResult {
  warnings: Array<{ id1: string; id2: string; type: 'warning' | 'blocked' }>
  hasBlocked: boolean
}

/** Transform a local point to world space using component position + rotation */
function toWorld(localPt: Vector3, position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }): Vector3 {
  // Defensive: always create fresh Vector3 in case objects lost prototype through state
  const pos = new Vector3(position.x, position.y, position.z)
  return localPt.clone().applyEuler(new Euler(rotation.x, rotation.y, rotation.z)).add(pos)
}

/** Build capsule representations for a component */
export function buildCapsules(component: PipeComponent): Capsule[] {
  const capsules: Capsule[] = []
  const pos = component.position
  const rot = component.rotation
  // Radius in meters (dn is mm, scene is in meters)
  const radius = (component.dn / 2) / 1000

  switch (component.type) {
    case 'straight': {
      const halfLen = ((component.length || 1000) / 2) / 1000
      capsules.push({
        start: toWorld(new Vector3(0, -halfLen, 0), pos, rot),
        end: toWorld(new Vector3(0, halfLen, 0), pos, rot),
        radius,
        componentId: component.id,
      })
      break
    }

    case 'elbow': {
      const angleRad = ((component.angle || 90) * Math.PI) / 180
      const inletLen = (component.elbowArmLengths?.inlet || (component.dn / 2) * 3) / 1000
      const outletLen = (component.elbowArmLengths?.outlet || (component.dn / 2) * 3) / 1000

      // Inlet arm: from center down along -Y
      capsules.push({
        start: toWorld(new Vector3(0, 0, 0), pos, rot),
        end: toWorld(new Vector3(0, -inletLen, 0), pos, rot),
        radius,
        componentId: component.id,
      })

      // Outlet arm: from center along angle direction
      const outX = outletLen * Math.sin(angleRad)
      const outY = -outletLen * Math.cos(angleRad)
      capsules.push({
        start: toWorld(new Vector3(0, 0, 0), pos, rot),
        end: toWorld(new Vector3(outX, outY, 0), pos, rot),
        radius,
        componentId: component.id,
      })
      break
    }

    case 'tee': {
      const teeArms = component.teeArmLengths || { inlet: 156, outlet: 156, branch: 177 }
      const branchAngle = ((component.branchAngle || 45) * Math.PI) / 180

      // Inlet arm: -X direction
      capsules.push({
        start: toWorld(new Vector3(0, 0, 0), pos, rot),
        end: toWorld(new Vector3(-teeArms.inlet / 1000, 0, 0), pos, rot),
        radius,
        componentId: component.id,
      })

      // Outlet arm: +X direction
      capsules.push({
        start: toWorld(new Vector3(0, 0, 0), pos, rot),
        end: toWorld(new Vector3(teeArms.outlet / 1000, 0, 0), pos, rot),
        radius,
        componentId: component.id,
      })

      // Branch arm: at branchAngle
      const branchDir = new Vector3(Math.cos(branchAngle), Math.sin(branchAngle), 0).normalize()
      capsules.push({
        start: toWorld(new Vector3(0, 0, 0), pos, rot),
        end: toWorld(branchDir.multiplyScalar(teeArms.branch / 1000), pos, rot),
        radius,
        componentId: component.id,
      })
      break
    }

    case 'ffq_stueck': {
      // Main pipe + branch
      const halfLen = ((component.length || 500) / 2) / 1000
      capsules.push({
        start: toWorld(new Vector3(0, -halfLen, 0), pos, rot),
        end: toWorld(new Vector3(0, halfLen, 0), pos, rot),
        radius,
        componentId: component.id,
      })

      // Branch
      if (component.branch1) {
        const branchAngle = (component.branch1.angle * Math.PI) / 180
        const branchLen = (component.branch1.length || 200) / 1000
        const branchPos = (component.branch1.position || 0.5) * (component.length || 500) / 1000 - halfLen
        const branchRadius = component.branch1.dn ? (component.branch1.dn / 2) / 1000 : radius
        capsules.push({
          start: toWorld(new Vector3(0, branchPos, 0), pos, rot),
          end: toWorld(new Vector3(branchLen * Math.sin(branchAngle), branchPos + branchLen * Math.cos(branchAngle), 0), pos, rot),
          radius: branchRadius,
          componentId: component.id,
        })
      }
      break
    }

    // Flange types: short capsule with wider radius
    case 'glatter_flansch':
    case 'losflansch':
    case 'vorschweissboerdel': {
      const flangeHalfLen = 0.02 // ~40mm total
      capsules.push({
        start: toWorld(new Vector3(0, -flangeHalfLen, 0), pos, rot),
        end: toWorld(new Vector3(0, flangeHalfLen, 0), pos, rot),
        radius: radius * 1.6,
        componentId: component.id,
      })
      break
    }

    default: {
      // Fallback: single capsule along Y axis
      const halfLen = ((component.length || 200) / 2) / 1000
      capsules.push({
        start: toWorld(new Vector3(0, -halfLen, 0), pos, rot),
        end: toWorld(new Vector3(0, halfLen, 0), pos, rot),
        radius,
        componentId: component.id,
      })
      break
    }
  }

  return capsules
}

/** Shortest distance between two line segments in 3D */
export function segmentSegmentDistance(
  p1: Vector3, q1: Vector3,
  p2: Vector3, q2: Vector3
): number {
  const d1 = q1.clone().sub(p1) // direction of segment 1
  const d2 = q2.clone().sub(p2) // direction of segment 2
  const r = p1.clone().sub(p2)

  const a = d1.dot(d1) // squared length of segment 1
  const e = d2.dot(d2) // squared length of segment 2
  const f = d2.dot(r)

  const EPSILON = 1e-10

  // Check for degenerate segments (points)
  if (a <= EPSILON && e <= EPSILON) {
    return r.length()
  }

  if (a <= EPSILON) {
    // First segment degenerates to a point
    let t = clamp(f / e, 0, 1)
    return p1.clone().sub(p2.clone().add(d2.clone().multiplyScalar(t))).length()
  }

  const c = d1.dot(r)

  if (e <= EPSILON) {
    // Second segment degenerates to a point
    let s = clamp(-c / a, 0, 1)
    return p2.clone().sub(p1.clone().add(d1.clone().multiplyScalar(s))).length()
  }

  // General case
  const b = d1.dot(d2)
  const denom = a * e - b * b

  let s: number
  let t: number

  if (denom > EPSILON) {
    s = clamp((b * f - c * e) / denom, 0, 1)
  } else {
    // Segments are parallel
    s = 0
  }

  // Compute closest point on segment 2
  t = (b * s + f) / e

  if (t < 0) {
    t = 0
    s = clamp(-c / a, 0, 1)
  } else if (t > 1) {
    t = 1
    s = clamp((b - c) / a, 0, 1)
  }

  const closest1 = p1.clone().add(d1.clone().multiplyScalar(s))
  const closest2 = p2.clone().add(d2.clone().multiplyScalar(t))

  return closest1.sub(closest2).length()
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Build a set of connected component ID pairs */
function buildConnectedPairs(components: PipeComponent[]): Set<string> {
  const pairs = new Set<string>()
  for (const comp of components) {
    for (const cp of comp.connectionPoints) {
      if (!cp.connectedTo) continue
      // Find which component owns the connected CP
      for (const other of components) {
        if (other.id === comp.id) continue
        if (other.connectionPoints.some(p => p.id === cp.connectedTo)) {
          const key = [comp.id, other.id].sort().join(':')
          pairs.add(key)
          break
        }
      }
    }
  }
  return pairs
}

/** Check collisions among all non-connected component pairs */
export function checkCollisions(components: PipeComponent[]): CollisionResult {
  const connectedPairs = buildConnectedPairs(components)
  const warnings: CollisionResult['warnings'] = []
  let hasBlocked = false

  console.log(`[Collision] Checking ${components.length} components, ${connectedPairs.size} connected pairs:`, [...connectedPairs])

  // Build capsules for all components
  const componentCapsules = new Map<string, Capsule[]>()
  for (const comp of components) {
    const caps = buildCapsules(comp)
    componentCapsules.set(comp.id, caps)
    for (const c of caps) {
      console.log(`[Collision] Capsule for ${comp.type}(${comp.id.slice(-6)}): start(${c.start.x.toFixed(3)},${c.start.y.toFixed(3)},${c.start.z.toFixed(3)}) end(${c.end.x.toFixed(3)},${c.end.y.toFixed(3)},${c.end.z.toFixed(3)}) r=${c.radius.toFixed(4)}`)
    }
  }

  // Check all non-connected pairs
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i]
      const b = components[j]
      const pairKey = [a.id, b.id].sort().join(':')

      // Skip connected pairs
      if (connectedPairs.has(pairKey)) {
        console.log(`[Collision] Skipping connected pair: ${a.type}(${a.id.slice(-6)}) ↔ ${b.type}(${b.id.slice(-6)})`)
        continue
      }

      const capsA = componentCapsules.get(a.id)!
      const capsB = componentCapsules.get(b.id)!

      let minDist = Infinity
      let maxRadius = 0

      for (const ca of capsA) {
        for (const cb of capsB) {
          const dist = segmentSegmentDistance(ca.start, ca.end, cb.start, cb.end)
          const sumR = ca.radius + cb.radius
          const maxR = Math.max(ca.radius, cb.radius)
          const gap = dist - sumR

          if (gap < minDist) {
            minDist = gap
            maxRadius = maxR
          }
        }
      }

      console.log(`[Collision] Pair ${a.type}(${a.id.slice(-6)}) ↔ ${b.type}(${b.id.slice(-6)}): minGap=${minDist.toFixed(4)} warnThreshold=${(maxRadius * 2).toFixed(4)}`)

      if (minDist < 0) {
        // Overlap: blocked
        warnings.push({ id1: a.id, id2: b.id, type: 'blocked' })
        hasBlocked = true
      } else if (minDist < maxRadius * 2) {
        // Close proximity: warning
        warnings.push({ id1: a.id, id2: b.id, type: 'warning' })
      }
    }
  }

  console.log(`[Collision] Result: ${warnings.length} warnings, hasBlocked=${hasBlocked}`)
  return { warnings, hasBlocked }
}

/** Project updates onto a copy of the component list (for pre-check before applying) */
export function projectUpdates(
  components: PipeComponent[],
  updates: Array<{ id: string; changes: Partial<PipeComponent> }>
): PipeComponent[] {
  return components.map(c => {
    const upd = updates.find(u => u.id === c.id)
    if (!upd) return c
    return {
      ...c,
      ...upd.changes,
      // Ensure position/rotation are proper Vector3 clones
      position: upd.changes.position || c.position,
      rotation: upd.changes.rotation || c.rotation,
    }
  })
}
