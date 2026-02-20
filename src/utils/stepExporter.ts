/**
 * STEP Export via OpenCASCADE.js (lazy-loaded ~30MB WASM)
 *
 * Builds parametric BRep geometry from component parameters,
 * assembles into a compound, and writes a STEP file.
 *
 * Units: Three.js uses meters internally, STEP uses millimeters.
 *
 * Constructor suffix convention (opencascade.js / Embind):
 *   Each overloaded C++ constructor becomes a separate JS class with _N suffix.
 *   The N follows the declaration order in the C++ header (1-based).
 *   E.g. gp_Pnt() → gp_Pnt_1(), gp_Pnt(XYZ) → gp_Pnt_2(), gp_Pnt(x,y,z) → gp_Pnt_3()
 */
import { PipeComponent } from '../types'
import { downloadBlob } from './downloadHelper'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ocInstance: any = null

/** Lazy-load OpenCASCADE — cached after first call */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadOpenCascade = async (): Promise<any> => {
  if (ocInstance) return ocInstance
  // @ts-ignore — no type declarations for opencascade.js
  const { initOpenCascade } = await import('opencascade.js')
  ocInstance = await initOpenCascade()
  return ocInstance
}

type ProgressCallback = (msg: string) => void

/**
 * Main export function — builds BRep shapes from PipeComponent[] and writes STEP.
 */
export const exportToSTEP = async (
  components: PipeComponent[],
  projectName: string,
  onProgress?: ProgressCallback,
) => {
  onProgress?.('OpenCASCADE wird geladen...')
  const oc = await loadOpenCascade()

  onProgress?.('Geometrie wird aufgebaut...')

  // Build a compound of all component shapes
  const builder = new oc.BRep_Builder()
  const compound = new oc.TopoDS_Compound()
  builder.MakeCompound(compound)

  for (let i = 0; i < components.length; i++) {
    const comp = components[i]
    onProgress?.(`Komponente ${i + 1}/${components.length}: ${comp.type}`)

    try {
      const shape = buildComponentShape(oc, comp)
      if (shape && !shape.IsNull()) {
        const positioned = positionShape(oc, shape, comp)
        builder.Add(compound, positioned)
      }
    } catch (err) {
      console.warn(`STEP: Skipping component ${comp.id} (${comp.type}):`, err)
    }
  }

  onProgress?.('STEP-Datei wird geschrieben...')

  const filename = 'output.step'

  const writer = new oc.STEPControl_Writer_1()
  writer.Transfer(compound, oc.STEPControl_StepModelType.STEPControl_AsIs, true)

  // Write to Emscripten virtual FS
  writer.Write(filename)

  // List ALL directories to find the file
  const rootBefore = oc.FS.readdir('/')
  console.log('Root dir contents:', rootBefore)

  // Try to find the file in various locations
  const searchPaths = [
    filename,
    '/' + filename,
    './' + filename,
  ]

  let fileData: Uint8Array | null = null
  for (const path of searchPaths) {
    try {
      fileData = oc.FS.readFile(path, { encoding: 'binary' })
      console.log('Found file at:', path, 'size:', fileData!.length)
      try { oc.FS.unlink(path) } catch { /* ignore */ }
      break
    } catch {
      // not found at this path
    }
  }

  if (!fileData) {
    // Search all root files for anything new
    for (const f of rootBefore) {
      if (f === '.' || f === '..' || f === 'tmp' || f === 'home' || f === 'dev' || f === 'proc') continue
      try {
        const data = oc.FS.readFile('/' + f, { encoding: 'binary' })
        console.log(`File /${f}: size=${data.length}`)
        // If it's a reasonably sized file, it might be our STEP
        if (data.length > 100) {
          fileData = data
          console.log('Using file:', f)
          try { oc.FS.unlink('/' + f) } catch { /* ignore */ }
          break
        }
      } catch {
        // directory or unreadable
      }
    }
  }

  if (!fileData) {
    throw new Error('STEP-Datei konnte nicht im virtuellen Dateisystem gefunden werden')
  }

  const blob = new Blob([new Uint8Array(fileData)], { type: 'application/step' })
  downloadBlob(blob, `${projectName}_${Date.now()}.step`)

  onProgress?.('Export abgeschlossen!')
}

// ── Shape builders ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildComponentShape = (oc: any, comp: PipeComponent) => {
  const outerRadius = comp.dn / 2
  const wallThickness = comp.wallThickness ?? 3
  const innerRadius = Math.max(outerRadius - wallThickness, 1)

  switch (comp.type) {
    case 'straight':
      return buildStraightPipe(oc, outerRadius, innerRadius, comp.length ?? 1000)

    case 'elbow':
      return buildElbow(oc, outerRadius, innerRadius, comp.angle ?? 90, comp.elbowArmLengths)

    case 'tee':
      return buildTee(oc, outerRadius, innerRadius, comp.teeArmLengths, comp.branchAngle)

    case 'glatter_flansch':
    case 'losflansch':
    case 'vorschweissboerdel':
      // Simple short cylinder placeholder for flanges/fittings
      return buildStraightPipe(oc, outerRadius, innerRadius, 30)

    case 'ffq_stueck':
      // FFQ piece — approximate as tee for STEP export
      return buildTee(oc, outerRadius, innerRadius, comp.teeArmLengths, comp.branchAngle ?? 45)

    default:
      return buildStraightPipe(oc, outerRadius, innerRadius, comp.length ?? 200)
  }
}

/**
 * Straight pipe: hollow cylinder (outer − inner)
 * BRepPrimAPI_MakeCylinder_1(R, H) — overload 1: basic cylinder along Z
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildStraightPipe = (oc: any, outerR: number, innerR: number, length: number) => {
  const outer = new oc.BRepPrimAPI_MakeCylinder_1(outerR, length).Shape()
  const inner = new oc.BRepPrimAPI_MakeCylinder_1(innerR, length + 0.1).Shape()
  const cut = new oc.BRepAlgoAPI_Cut_3(outer, inner)
  cut.Build()
  return cut.Shape()
}

/**
 * Elbow: revolve a circular cross-section around the bend center.
 * Uses gp_Circ_2 → MakeEdge_8 → MakeWire → MakeFace → MakeRevol
 * to avoid Handle conversion issues with GC_MakeCircle.Value().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildElbow = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oc: any,
  outerR: number,
  innerR: number,
  angleDeg: number,
  armLengths?: { inlet: number; outlet: number },
) => {
  const bendRadius = (armLengths?.inlet ?? 150) + outerR
  const angleRad = (angleDeg * Math.PI) / 180

  // Profile circle at (bendRadius, 0, 0) in Y-Z plane, revolve around Z-axis
  const profileCenter = new oc.gp_Pnt_3(bendRadius, 0, 0)
  const profileDir = new oc.gp_Dir_4(0, 1, 0)
  const profileAxis = new oc.gp_Ax2_3(profileCenter, profileDir)

  // Use gp_Circ directly (no Handle conversion needed)
  const outerCirc = new oc.gp_Circ_2(profileAxis, outerR)
  const outerEdge = new oc.BRepBuilderAPI_MakeEdge_8(outerCirc)
  const outerWire = new oc.BRepBuilderAPI_MakeWire_2(outerEdge.Edge())
  const outerFace = new oc.BRepBuilderAPI_MakeFace_15(outerWire.Wire(), false)

  // Revolution axis = Z-axis through origin
  const revolAxis = new oc.gp_Ax1_2(
    new oc.gp_Pnt_3(0, 0, 0),
    new oc.gp_Dir_4(0, 0, 1),
  )
  const outerRevol = new oc.BRepPrimAPI_MakeRevol_1(outerFace.Shape(), revolAxis, angleRad, true)

  // Inner profile
  const innerCirc = new oc.gp_Circ_2(profileAxis, innerR)
  const innerEdge = new oc.BRepBuilderAPI_MakeEdge_8(innerCirc)
  const innerWire = new oc.BRepBuilderAPI_MakeWire_2(innerEdge.Edge())
  const innerFace = new oc.BRepBuilderAPI_MakeFace_15(innerWire.Wire(), false)
  const innerRevol = new oc.BRepPrimAPI_MakeRevol_1(innerFace.Shape(), revolAxis, angleRad, true)

  // Cut inner from outer
  const cut = new oc.BRepAlgoAPI_Cut_3(outerRevol.Shape(), innerRevol.Shape())
  cut.Build()
  return cut.Shape()
}

/**
 * Tee: fusion of main-run cylinder + branch cylinder, then hollow out.
 * BRepPrimAPI_MakeCylinder_3(Ax2, R, H) — overload 3: positioned cylinder
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildTee = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oc: any,
  outerR: number,
  innerR: number,
  armLengths?: { inlet: number; outlet: number; branch: number },
  branchAngleDeg?: number,
) => {
  const inletLen = armLengths?.inlet ?? 156
  const outletLen = armLengths?.outlet ?? 156
  const branchLen = armLengths?.branch ?? 177
  const totalMainLen = inletLen + outletLen
  const branchAngle = ((branchAngleDeg ?? 90) * Math.PI) / 180

  // Main run cylinder along Z
  const mainOuter = new oc.BRepPrimAPI_MakeCylinder_1(outerR, totalMainLen).Shape()

  // Branch cylinder — positioned at midpoint, angled
  const branchOrigin = new oc.gp_Pnt_3(0, 0, inletLen)
  const branchDir = new oc.gp_Dir_4(Math.sin(branchAngle), 0, Math.cos(branchAngle))
  const branchAx2 = new oc.gp_Ax2_3(branchOrigin, branchDir)
  const branchCyl = new oc.BRepPrimAPI_MakeCylinder_3(branchAx2, outerR, branchLen).Shape()

  // Fuse outer shapes
  const fuse1 = new oc.BRepAlgoAPI_Fuse_3(mainOuter, branchCyl)
  fuse1.Build()
  const outerFused = fuse1.Shape()

  // Inner hollow: same geometry with inner radius
  const mainInner = new oc.BRepPrimAPI_MakeCylinder_1(innerR, totalMainLen + 0.2).Shape()
  const innerMainTrsf = new oc.gp_Trsf_1()
  innerMainTrsf.SetTranslation_1(new oc.gp_Vec_4(0, 0, -0.1))
  const innerMainMoved = new oc.BRepBuilderAPI_Transform_2(mainInner, innerMainTrsf, true).Shape()

  const branchInnerCyl = new oc.BRepPrimAPI_MakeCylinder_3(branchAx2, innerR, branchLen + 0.2).Shape()

  const fuse2 = new oc.BRepAlgoAPI_Fuse_3(innerMainMoved, branchInnerCyl)
  fuse2.Build()
  const innerFused = fuse2.Shape()

  // Cut inner from outer
  const cut = new oc.BRepAlgoAPI_Cut_3(outerFused, innerFused)
  cut.Build()
  return cut.Shape()
}

// ── Positioning ─────────────────────────────────────────────────

/**
 * Position a shape in world space based on PipeComponent position/rotation.
 * Three.js position is in meters → multiply by 1000 for STEP mm.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const positionShape = (oc: any, shape: any, comp: PipeComponent) => {
  const trsf = new oc.gp_Trsf_1()

  // Translation: Three.js meters → STEP mm
  const tx = comp.position.x * 1000
  const ty = comp.position.y * 1000
  const tz = comp.position.z * 1000

  // Build rotation quaternion from Euler XYZ
  const rx = comp.rotation.x
  const ry = comp.rotation.y
  const rz = comp.rotation.z

  const cx = Math.cos(rx / 2), sx = Math.sin(rx / 2)
  const cy = Math.cos(ry / 2), sy = Math.sin(ry / 2)
  const cz = Math.cos(rz / 2), sz = Math.sin(rz / 2)

  const qw = cx * cy * cz + sx * sy * sz
  const qx = sx * cy * cz - cx * sy * sz
  const qy = cx * sy * cz + sx * cy * sz
  const qz = cx * cy * sz - sx * sy * cz

  // gp_Quaternion_2(x, y, z, w) — overload 2: component constructor
  const quat = new oc.gp_Quaternion_2(qx, qy, qz, qw)
  trsf.SetRotation_2(quat)

  // Compose with translation
  const transTrsf = new oc.gp_Trsf_1()
  transTrsf.SetTranslation_1(new oc.gp_Vec_4(tx, ty, tz))

  // Multiply: first rotate, then translate
  trsf.Multiply(transTrsf)

  const transformed = new oc.BRepBuilderAPI_Transform_2(shape, trsf, true)
  return transformed.Shape()
}
