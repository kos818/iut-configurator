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
      // Use configurable arm lengths, or defaults based on DN
      const defaultArmLength = (DN_TO_MM[dn] / 2) * 3 // 3x radius as default
      const armLengths = component.elbowArmLengths || {
        inlet: defaultArmLength,
        outlet: defaultArmLength
      }

      // Get elbow angle in radians (default 90°)
      const angleInDegrees = component.angle || 90
      const angleInRadians = (angleInDegrees * Math.PI) / 180

      // Convert arm lengths to meters
      const inletLengthM = armLengths.inlet / 1000
      const outletLengthM = armLengths.outlet / 1000

      // Inlet connection point - pointing down (negative Y)
      // Position: at the end of the inlet arm
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -inletLengthM, 0),
        direction: new Vector3(0, -1, 0), // pointing down
        dn,
        connectedTo: null,
      })

      // Outlet connection point - rotated by the elbow angle
      // Direction: inlet direction rotated by angle around Z-axis
      // For angle θ: (0, -1) rotated by θ = (sin(θ), -cos(θ))
      const outletDirX = Math.sin(angleInRadians)
      const outletDirY = -Math.cos(angleInRadians)

      // Position: at the end of the outlet arm, in the direction of the bend
      const outletPosX = outletLengthM * outletDirX
      const outletPosY = outletLengthM * outletDirY

      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(outletPosX, outletPosY, 0),
        direction: new Vector3(outletDirX, outletDirY, 0), // pointing in bend direction
        dn,
        connectedTo: null,
      })
      break
    }

    case 'tee': {
      // Use configurable arm lengths, or defaults
      const armLengths = component.teeArmLengths || {
        inlet: component.armLength || 200,
        outlet: component.armLength || 200,
        branch: component.armLength || 200
      }

      // Full arm lengths in meters (at the end of each arm, not middle)
      const inletLengthM = armLengths.inlet / 1000  // Convert mm to meters
      const outletLengthM = armLengths.outlet / 1000
      const branchLengthM = armLengths.branch / 1000

      // Inlet (left, Arm A) - at the end of the arm
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(-inletLengthM, 0, 0),
        direction: new Vector3(-1, 0, 0),
        dn,
        connectedTo: null,
      })
      // Outlet (right, Arm B) - at the end of the arm
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(outletLengthM, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn,
        connectedTo: null,
      })
      // Branch (top, Arm C) - at the end of the arm
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(0, branchLengthM, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'cross': {
      // Cross piece with 4 connection points (inlet, outlet, branch, branch2)
      // Use configurable arm length, or default
      const armLengthM = (component.armLength || 200) / 1000 // Convert mm to meters

      // Inlet (left, Arm A)
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(-armLengthM, 0, 0),
        direction: new Vector3(-1, 0, 0),
        dn,
        connectedTo: null,
      })
      // Outlet (right, Arm B)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(armLengthM, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn,
        connectedTo: null,
      })
      // Branch (top, Arm C)
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(0, armLengthM, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })
      // Branch2 (bottom, Arm D)
      points.push({
        id: `${component.id}-branch2`,
        componentId: component.id,
        type: 'branch2',
        label: labels[3], // D
        position: new Vector3(0, -armLengthM, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'valve':
    case 'check_valve':
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

    case 'cap': {
      // Cap has only one connection point (inlet)
      const capHeight = radius * 1.5
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -capHeight / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'wye': {
      // Hosenrohr gerade: One inlet (bottom) splits into two symmetric outlets (top)
      // Like trousers: one "waist" at bottom, two "legs" at top
      const armLengthM = (component.armLength || 200) / 1000
      const branchAngle = 45 * Math.PI / 180 // 45° angle for symmetric branches

      // Inlet (bottom, straight down - "waist of trousers")
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -armLengthM, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })

      // Outlet 1 (top-left at 45° - "left leg of trousers")
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(-armLengthM * Math.sin(branchAngle), armLengthM * Math.cos(branchAngle), 0),
        direction: new Vector3(-Math.sin(branchAngle), Math.cos(branchAngle), 0).normalize(),
        dn,
        connectedTo: null,
      })

      // Outlet 2 (top-right at 45° - "right leg of trousers")
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(armLengthM * Math.sin(branchAngle), armLengthM * Math.cos(branchAngle), 0),
        direction: new Vector3(Math.sin(branchAngle), Math.cos(branchAngle), 0).normalize(),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'wye_angled': {
      // Hosenrohr abgewinkelt: One inlet (bottom) splits into two outlets at different angles
      const armLengthM = (component.armLength || 200) / 1000
      const angle1 = 30 * Math.PI / 180 // First outlet at 30°
      const angle2 = ((component.angle || 45) * Math.PI / 180) // Second outlet at configurable angle

      // Inlet (bottom, straight down)
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -armLengthM, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })

      // Outlet 1 (top-left at 30°)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(-armLengthM * Math.sin(angle1), armLengthM * Math.cos(angle1), 0),
        direction: new Vector3(-Math.sin(angle1), Math.cos(angle1), 0).normalize(),
        dn,
        connectedTo: null,
      })

      // Outlet 2 (top-right at configurable angle)
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(armLengthM * Math.sin(angle2), armLengthM * Math.cos(angle2), 0),
        direction: new Vector3(Math.sin(angle2), Math.cos(angle2), 0).normalize(),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'union_straight':
    case 'union_angled': {
      // Union piece (Vereinigungsstück) - two inlets, one outlet
      const armLengthM = (component.armLength || 200) / 1000
      const angle = component.type === 'union_angled' ? ((component.angle || 45) * Math.PI / 180) : 0

      // Inlet 1 (top left)
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(-armLengthM * Math.sin(angle), armLengthM * Math.cos(angle), 0),
        direction: new Vector3(Math.sin(angle), -Math.cos(angle), 0).normalize(),
        dn,
        connectedTo: null,
      })
      // Inlet 2 (top right)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(armLengthM * Math.sin(angle), armLengthM * Math.cos(angle), 0),
        direction: new Vector3(-Math.sin(angle), -Math.cos(angle), 0).normalize(),
        dn,
        connectedTo: null,
      })
      // Outlet (bottom)
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(0, -armLengthM, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'ffft_symmetrical':
    case 'ffq_equal':
    case 'ffq_unequal': {
      // Similar to tee
      const armLengths = component.teeArmLengths || {
        inlet: component.armLength || 200,
        outlet: component.armLength || 200,
        branch: component.armLength || 200
      }

      const inletLengthM = armLengths.inlet / 1000
      const outletLengthM = armLengths.outlet / 1000
      const branchLengthM = armLengths.branch / 1000

      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(-inletLengthM, 0, 0),
        direction: new Vector3(-1, 0, 0),
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(outletLengthM, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(0, branchLengthM, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'ffft_asymmetrical': {
      // Asymmetric T-piece with offset branch, angle, and different DN values
      const armLengths = component.teeArmLengths || {
        inlet: component.armLength || 200,
        outlet: component.armLength || 250,
        branch: component.armLength || 200
      }

      const inletLengthM = armLengths.inlet / 1000
      const outletLengthM = armLengths.outlet / 1000
      const branchLengthM = armLengths.branch / 1000

      // Branch offset from center in meters (along main axis)
      const branchOffsetM = (component.branchOffset || 0) / 1000

      // Branch angle in radians (default 90° = perpendicular to main axis)
      const branchAngleRad = ((component.branchAngle || 90) * Math.PI) / 180

      // Different DN values for inlet, outlet, and branch
      const inletDN = component.inletDN || dn
      const outletDN = component.outletDN || dn
      const branchDN = component.branchDN || dn

      // Inlet (left)
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(-inletLengthM, 0, 0),
        direction: new Vector3(-1, 0, 0),
        dn: inletDN as DNValue,
        connectedTo: null,
      })

      // Outlet (right)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(outletLengthM, 0, 0),
        direction: new Vector3(1, 0, 0),
        dn: outletDN as DNValue,
        connectedTo: null,
      })

      // Branch (at angle, offset from center along main axis)
      // Position: Start from offset point on main axis, extend perpendicular based on angle
      // For 90°: goes straight up (0, branchLengthM, 0)
      // For other angles: rotates in XY plane
      const branchX = branchOffsetM + (branchLengthM * Math.sin(branchAngleRad))
      const branchY = branchLengthM * Math.cos(branchAngleRad)

      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(branchX, branchY, 0),
        direction: new Vector3(Math.sin(branchAngleRad), Math.cos(branchAngleRad), 0).normalize(),
        dn: branchDN as DNValue,
        connectedTo: null,
      })
      break
    }

    case 'frr_concentric':
    case 'frr_eccentric':
    case 'reducer': {
      const length = radius * 2
      const inletDN = component.inletDN || dn
      const outletDN = component.outletDN || (Math.max(20, dn - 10) as DNValue)

      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -length / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn: inletDN,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, length / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn: outletDN,
        connectedTo: null,
      })
      break
    }

    case 'f_piece':
    case 'ff_piece': {
      // F-Stück / FF-Stück - straight pipe with flanges
      const lengthM = (component.length || 500) / 1000

      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -lengthM / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, lengthM / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })
      break
    }

    case 'ff_piece_one_branch':
    case 'fffor_one_branch': {
      // FF-Stück with one branch (no flanges by default)
      const lengthM = (component.length || 500) / 1000
      const branch = component.branch1 || { angle: 90, position: 0.5, dn: dn, length: 150 }
      const branchLengthM = branch.length / 1000
      const branchAngleRad = (branch.angle * Math.PI) / 180
      const branchPosM = (branch.position * lengthM) - (lengthM / 2) // Position along main axis

      // Main inlet
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -lengthM / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })

      // Main outlet
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, lengthM / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })

      // Branch
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(
          branchLengthM * Math.sin(branchAngleRad),
          branchPosM,
          branchLengthM * Math.cos(branchAngleRad)
        ),
        direction: new Vector3(
          Math.sin(branchAngleRad),
          0,
          Math.cos(branchAngleRad)
        ).normalize(),
        dn: branch.dn,
        connectedTo: null,
      })
      break
    }

    case 'fffrk_one_branch': {
      // FFFRK-Stück with one branch - ALL THREE connections have flanges
      const lengthM = (component.length || 500) / 1000
      const branch = component.branch1 || { angle: 90, position: 0.5, dn: dn, length: 150 }
      const branchLengthM = branch.length / 1000
      const branchAngleRad = (branch.angle * Math.PI) / 180
      const branchPosM = (branch.position * lengthM) - (lengthM / 2) // Position along main axis

      // Main inlet (with flange)
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -lengthM / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
        connectionMethod: 'flanged', // FFFRK has flange at inlet
      })

      // Main outlet (with flange)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, lengthM / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
        connectionMethod: 'flanged', // FFFRK has flange at outlet
      })

      // Branch (with flange - conical reduction)
      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(
          branchLengthM * Math.sin(branchAngleRad),
          branchPosM,
          branchLengthM * Math.cos(branchAngleRad)
        ),
        direction: new Vector3(
          Math.sin(branchAngleRad),
          0,
          Math.cos(branchAngleRad)
        ).normalize(),
        dn: branch.dn,
        connectedTo: null,
        connectionMethod: 'flanged', // FFFRK has flange at branch
      })
      break
    }

    case 'ff_piece_two_branches': {
      // FF-Stück with two branches
      const lengthM = (component.length || 600) / 1000
      const branch1 = component.branch1 || { angle: 90, position: 0.35, dn: dn, length: 150 }
      const branch2 = component.branch2 || { angle: 90, position: 0.65, dn: dn, length: 150 }

      // Main inlet
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -lengthM / 2, 0),
        direction: new Vector3(0, -1, 0),
        dn,
        connectedTo: null,
      })

      // Main outlet
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(0, lengthM / 2, 0),
        direction: new Vector3(0, 1, 0),
        dn,
        connectedTo: null,
      })

      // Branch 1
      const branch1LengthM = branch1.length / 1000
      const branch1AngleRad = (branch1.angle * Math.PI) / 180
      const branch1PosM = (branch1.position * lengthM) - (lengthM / 2)

      points.push({
        id: `${component.id}-branch`,
        componentId: component.id,
        type: 'branch',
        label: labels[2], // C
        position: new Vector3(
          branch1LengthM * Math.sin(branch1AngleRad),
          branch1PosM,
          branch1LengthM * Math.cos(branch1AngleRad)
        ),
        direction: new Vector3(
          Math.sin(branch1AngleRad),
          0,
          Math.cos(branch1AngleRad)
        ).normalize(),
        dn: branch1.dn,
        connectedTo: null,
      })

      // Branch 2
      const branch2LengthM = branch2.length / 1000
      const branch2AngleRad = (branch2.angle * Math.PI) / 180
      const branch2PosM = (branch2.position * lengthM) - (lengthM / 2)

      points.push({
        id: `${component.id}-branch2`,
        componentId: component.id,
        type: 'branch2',
        label: labels[3], // D
        position: new Vector3(
          -branch2LengthM * Math.sin(branch2AngleRad), // Opposite side
          branch2PosM,
          branch2LengthM * Math.cos(branch2AngleRad)
        ),
        direction: new Vector3(
          -Math.sin(branch2AngleRad),
          0,
          Math.cos(branch2AngleRad)
        ).normalize(),
        dn: branch2.dn,
        connectedTo: null,
      })
      break
    }

    case 'frk_equal':
    case 'frk_unequal': {
      // FRK-Stück - reducing elbow
      const armLengths = component.elbowArmLengths || { inlet: 200, outlet: 200 }
      const inletLengthM = armLengths.inlet / 1000
      const outletLengthM = armLengths.outlet / 1000
      const inletDN = component.inletDN || dn
      const outletDN = component.outletDN || (Math.max(20, dn - 10) as DNValue)
      const angleRad = ((component.angle || 90) * Math.PI) / 180

      // Inlet
      points.push({
        id: `${component.id}-inlet`,
        componentId: component.id,
        type: 'inlet',
        label: labels[0], // A
        position: new Vector3(0, -inletLengthM, 0),
        direction: new Vector3(0, -1, 0),
        dn: inletDN,
        connectedTo: null,
      })

      // Outlet (rotated by angle)
      points.push({
        id: `${component.id}-outlet`,
        componentId: component.id,
        type: 'outlet',
        label: labels[1], // B
        position: new Vector3(
          outletLengthM * Math.sin(angleRad),
          outletLengthM * Math.cos(angleRad),
          0
        ),
        direction: new Vector3(
          Math.sin(angleRad),
          Math.cos(angleRad),
          0
        ).normalize(),
        dn: outletDN,
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
