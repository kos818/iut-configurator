import * as THREE from 'three'

// --- Types ---

export interface GLBConnectionPoint {
  name: string
  position: THREE.Vector3
  direction: THREE.Vector3 | null
  node?: THREE.Object3D
  radius?: number
}

/** Shape of a single entry in userData.connectionPoints (GLB extras) */
interface ExtrasCP {
  name?: string
  x: number
  y: number
  z: number
  nx?: number
  ny?: number
  nz?: number
}

// --- Core functions ---

/**
 * Reads connection points from GLB extras (userData.connectionPoints)
 * and transforms them into world space.
 *
 * The extras coordinates live in local mesh space. The GLTFLoader applies
 * the node rotation (e.g. Blender Z-up → glTF Y-up) automatically, so
 * we transform through `node.matrixWorld` to get correct world-space values.
 */
export function getConnectionPoints(gltfScene: THREE.Group): GLBConnectionPoint[] {
  const points: GLBConnectionPoint[] = []

  gltfScene.traverse((node) => {
    const extras = node.userData as { connectionPoints?: ExtrasCP[] }
    if (!extras?.connectionPoints || !Array.isArray(extras.connectionPoints)) return

    // Make sure world matrix is up-to-date (including parent chain)
    node.updateWorldMatrix(true, false)

    extras.connectionPoints.forEach((cp, index) => {
      // Position: local → world
      const localPos = new THREE.Vector3(cp.x, cp.y, cp.z)
      const worldPos = localPos.applyMatrix4(node.matrixWorld)

      // Direction (normal): rotation only, no translation
      let direction: THREE.Vector3 | null = null
      if (cp.nx !== undefined && cp.ny !== undefined && cp.nz !== undefined) {
        direction = new THREE.Vector3(cp.nx, cp.ny, cp.nz)
        direction.transformDirection(node.matrixWorld)
        direction.normalize()
      }

      points.push({
        name: cp.name || String.fromCharCode(65 + index), // A, B, C …
        position: worldPos,
        direction,
        node,
      })
    })
  })

  return points
}

/**
 * Fallback: auto-detects connection points from mesh geometry by looking
 * for circular clusters of vertices at bounding-box extremes (pipe openings).
 */
export function detectConnectionPointsFromGeometry(gltfScene: THREE.Group): GLBConnectionPoint[] {
  const points: GLBConnectionPoint[] = []

  gltfScene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return

    node.updateWorldMatrix(true, false)
    const geometry = node.geometry as THREE.BufferGeometry
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute | null
    if (!posAttr) return

    // Collect all positions in world space
    const worldPositions: THREE.Vector3[] = []
    const tempVec = new THREE.Vector3()

    for (let i = 0; i < posAttr.count; i++) {
      tempVec.fromBufferAttribute(posAttr, i)
      tempVec.applyMatrix4(node.matrixWorld)
      worldPositions.push(tempVec.clone())
    }

    // Bounding box
    const bbox = new THREE.Box3()
    worldPositions.forEach((p) => bbox.expandByPoint(p))

    // For each axis, check min/max extremes for circular vertex clusters
    const axes = ['x', 'y', 'z'] as const
    const threshold = 2.0 // mm tolerance
    const candidates: Array<{
      center: THREE.Vector3
      normal: THREE.Vector3
      count: number
      circularity: number
      radius: number
    }> = []

    axes.forEach((axis) => {
      const min = bbox.min[axis]
      const max = bbox.max[axis]

      // Vertices at the minimum of this axis
      const minVerts = worldPositions.filter((p) => p[axis] < min + threshold)
      if (minVerts.length > 10) {
        const center = new THREE.Vector3()
        minVerts.forEach((v) => center.add(v))
        center.divideScalar(minVerts.length)

        const distances = minVerts.map((v) => v.distanceTo(center))
        const avgDist = distances.reduce((a, b) => a + b) / distances.length
        const variance =
          distances.map((d) => (d - avgDist) ** 2).reduce((a, b) => a + b) / distances.length

        candidates.push({
          center,
          normal: new THREE.Vector3(
            axis === 'x' ? -1 : 0,
            axis === 'y' ? -1 : 0,
            axis === 'z' ? -1 : 0,
          ),
          count: minVerts.length,
          circularity: 1 / (1 + Math.sqrt(variance) / avgDist),
          radius: avgDist,
        })
      }

      // Vertices at the maximum of this axis
      const maxVerts = worldPositions.filter((p) => p[axis] > max - threshold)
      if (maxVerts.length > 10) {
        const center = new THREE.Vector3()
        maxVerts.forEach((v) => center.add(v))
        center.divideScalar(maxVerts.length)

        const distances = maxVerts.map((v) => v.distanceTo(center))
        const avgDist = distances.reduce((a, b) => a + b) / distances.length
        const variance =
          distances.map((d) => (d - avgDist) ** 2).reduce((a, b) => a + b) / distances.length

        candidates.push({
          center,
          normal: new THREE.Vector3(
            axis === 'x' ? 1 : 0,
            axis === 'y' ? 1 : 0,
            axis === 'z' ? 1 : 0,
          ),
          count: maxVerts.length,
          circularity: 1 / (1 + Math.sqrt(variance) / avgDist),
          radius: avgDist,
        })
      }
    })

    // Pick the two most circular candidates (= pipe openings)
    candidates.sort((a, b) => b.circularity - a.circularity)
    const topCandidates = candidates.slice(0, 2)

    topCandidates.forEach((c, i) => {
      points.push({
        name: String.fromCharCode(65 + i),
        position: c.center,
        direction: c.normal,
        radius: c.radius,
      })
    })
  })

  return points
}

/**
 * Main entry: tries GLB extras first, falls back to geometry auto-detection.
 */
export function getOrDetectConnectionPoints(gltfScene: THREE.Group): GLBConnectionPoint[] {
  const fromExtras = getConnectionPoints(gltfScene)
  if (fromExtras.length > 0) {
    console.log(`[ConnectionPoints] ${fromExtras.length} point(s) read from GLB extras`)
    return fromExtras
  }

  console.warn('[ConnectionPoints] No extras found — auto-detecting from geometry')
  const detected = detectConnectionPointsFromGeometry(gltfScene)
  console.log(`[ConnectionPoints] ${detected.length} point(s) auto-detected`)
  return detected
}

/**
 * Creates visible debug markers (spheres + arrows) for connection points.
 */
export function createConnectionPointMarkers(
  connectionPoints: GLBConnectionPoint[],
  options: {
    sphereRadius?: number
    sphereColor?: number
    arrowLength?: number
    arrowColor?: number
  } = {},
): THREE.Group {
  const {
    sphereRadius = 5,
    sphereColor = 0x00ff00,
    arrowLength = 30,
    arrowColor = 0xff6600,
  } = options

  const group = new THREE.Group()
  group.name = 'connectionPointMarkers'

  connectionPoints.forEach((cp) => {
    // Sphere at connection point
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(sphereRadius, 16, 16),
      new THREE.MeshBasicMaterial({ color: sphereColor, transparent: true, opacity: 0.8 }),
    )
    sphere.position.copy(cp.position)
    sphere.name = `cp_sphere_${cp.name}`
    group.add(sphere)

    // Arrow for direction
    if (cp.direction) {
      const arrow = new THREE.ArrowHelper(
        cp.direction,
        cp.position,
        arrowLength,
        arrowColor,
        arrowLength * 0.3,
        arrowLength * 0.15,
      )
      arrow.name = `cp_arrow_${cp.name}`
      group.add(arrow)
    }
  })

  return group
}
