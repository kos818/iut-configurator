import React, { useState, useEffect, useRef } from 'react'
import { Vector3, Euler, Quaternion } from 'three'
import { AlertTriangle } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates, materialMultipliers } from '../../data/componentTemplates'
import { ConnectionMethod, ConnectionPoint, DNValue, PNValue } from '../../types'
import { GlobalChangeDialog } from './GlobalChangeDialog'
import { checkCollisions } from '../../utils/collisionDetection'
import { getFlangeThickness, getEffectivePipeBodyLength, getEffectiveArmLength } from '../../utils/flangeUtils'

export const PropertiesPanel: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedId = useConfiguratorStore((state) => state.selectedComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const batchUpdateComponents = useConfiguratorStore((state) => state.batchUpdateComponents)
  const updateAllComponents = useConfiguratorStore((state) => state.updateAllComponents)
  const removeComponent = useConfiguratorStore((state) => state.removeComponent)
  const projectSettings = useConfiguratorStore((state) => state.projectSettings)
  const setProjectSettings = useConfiguratorStore((state) => state.setProjectSettings)
  const collisionWarnings = useConfiguratorStore((state) => state.collisionWarnings)
  const setCollisionWarnings = useConfiguratorStore((state) => state.setCollisionWarnings)
  const undo = useConfiguratorStore((state) => state.undo)

  // State for global change dialog
  const [globalChangeDialog, setGlobalChangeDialog] = useState<{
    show: boolean
    type: 'material' | 'dn'
    oldValue: string | number
    newValue: string | number
    onConfirm: (applyGlobally: boolean) => void
  } | null>(null)

  // State for expanded connection type picker per CP
  const [expandedConnectionCP, setExpandedConnectionCP] = useState<string | null>(null)

  // State for CP rotation sliders — tracks cumulative delta per CP, resets on selection change
  const [cpRotations, setCpRotations] = useState<Record<string, number>>({})

  // Debug state for collision check visibility
  const [collisionDebug, setCollisionDebug] = useState('')

  // Reset CP rotation sliders when selection changes
  useEffect(() => {
    setCpRotations({})
  }, [selectedId])

  // Collision confirmation dialog
  const [showCollisionDialog, setShowCollisionDialog] = useState(false)

  // Track previous blocked collisions so we only show the dialog for NEW ones
  const prevBlockedKeysRef = useRef<Set<string>>(new Set())

  // Global collision check — runs whenever components change
  useEffect(() => {
    console.log(`[PropertiesPanel] Collision check triggered, ${components.length} components`)

    // Skip entire collision check when suppress flag is set (atomic add just happened)
    const suppress = useConfiguratorStore.getState().suppressNextCollisionDialog
    if (suppress) {
      console.log('[PropertiesPanel] Suppressing collision check for newly connected component')
      useConfiguratorStore.setState({ suppressNextCollisionDialog: false })
      return
    }

    if (components.length < 2) {
      if (collisionWarnings.length > 0) setCollisionWarnings([])
      prevBlockedKeysRef.current = new Set()
      return
    }

    let result: ReturnType<typeof checkCollisions>
    try {
      result = checkCollisions(components)
    } catch (err) {
      console.error('[PropertiesPanel] Collision check CRASHED:', err)
      setCollisionDebug(`FEHLER: ${err}`)
      return
    }

    setCollisionDebug(`${components.length} Komp., ${result.warnings.length} Warnungen (blocked=${result.hasBlocked})`)
    console.log(`[PropertiesPanel] Collision result: ${result.warnings.length} warnings, hasBlocked=${result.hasBlocked}`)

    // Compare to avoid unnecessary re-renders
    const oldKey = collisionWarnings.map(w => `${w.id1}:${w.id2}:${w.type}`).sort().join(',')
    const newKey = result.warnings.map(w => `${w.id1}:${w.id2}:${w.type}`).sort().join(',')
    if (oldKey !== newKey) {
      console.log(`[PropertiesPanel] Updating collision warnings: "${oldKey}" → "${newKey}"`)
      setCollisionWarnings(result.warnings)
    }

    // Detect NEW blocked collisions → show confirmation dialog
    const currentBlockedKeys = new Set(
      result.warnings
        .filter(w => w.type === 'blocked')
        .map(w => [w.id1, w.id2].sort().join(':'))
    )
    const hasNewBlocked = [...currentBlockedKeys].some(
      key => !prevBlockedKeysRef.current.has(key)
    )
    if (hasNewBlocked) {
      console.log('[PropertiesPanel] New blocked collision detected → showing dialog')
      setShowCollisionDialog(true)
    }
    prevBlockedKeysRef.current = currentBlockedKeys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components])

  // Available connection/flange types
  const connectionTemplates = componentTemplates.filter(t => t.group === 'connections')

  const selectedComponent = components.find((c) => c.id === selectedId)

  // Collision banners helper (used in both views)
  const collisionBanners = (
    <>
      {/* Warning banner (yellow) */}
      {collisionWarnings.length > 0 && !collisionWarnings.some(w => w.type === 'blocked') && (
        <div className="flex items-center gap-2 px-3 py-2 rounded mb-3 text-sm font-medium bg-yellow-900 bg-opacity-80 text-yellow-200 border border-yellow-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Achtung: Komponenten in der Nähe</span>
        </div>
      )}
      {/* Blocked banner (red) */}
      {collisionWarnings.some(w => w.type === 'blocked') && !showCollisionDialog && (
        <div className="flex items-center gap-2 px-3 py-2 rounded mb-3 text-sm font-medium bg-red-900 bg-opacity-80 text-red-200 border border-red-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Kollision — Elemente überlappen sich!</span>
        </div>
      )}
      {/* Confirmation Dialog */}
      {showCollisionDialog && (
        <div className="mb-3 p-3 rounded border-2 border-red-600 bg-red-950 bg-opacity-95">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            <span className="text-red-200 text-sm font-semibold">Kollision erkannt!</span>
          </div>
          <p className="text-red-300 text-xs mb-3">
            Elemente überlappen sich. In der Realität wäre diese Konfiguration nicht umsetzbar. Möchten Sie trotzdem fortfahren?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCollisionDialog(false)}
              className="flex-1 px-3 py-1.5 text-xs rounded bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors"
            >
              Beibehalten
            </button>
            <button
              onClick={() => { setShowCollisionDialog(false); undo() }}
              className="flex-1 px-3 py-1.5 text-xs rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
            >
              Rückgängig
            </button>
          </div>
        </div>
      )}
    </>
  )

  if (!selectedComponent) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Eigenschaften</h2>
        {collisionBanners}
        {collisionDebug && (
          <div className="text-gray-500 text-[10px] mb-2 font-mono">[Debug] {collisionDebug}</div>
        )}
        <p className="text-gray-400">Keine Komponente ausgewählt</p>
      </div>
    )
  }

  const template = componentTemplates.find(
    (t) => t.type === selectedComponent.type
  )

  const handleDNChange = (newDN: number) => {
    const oldDN = selectedComponent.dn

    // If project settings are configured and component count > 1, show global change dialog
    if (projectSettings.isConfigured && components.length > 1) {
      setGlobalChangeDialog({
        show: true,
        type: 'dn',
        oldValue: oldDN,
        newValue: newDN,
        onConfirm: (applyGlobally: boolean) => {
          if (applyGlobally) {
            // Update all components
            updateAllComponents({ dn: newDN as DNValue })
            // Update project settings
            setProjectSettings(projectSettings.defaultMaterial, newDN, projectSettings.defaultPN, projectSettings.defaultWallThickness, projectSettings.defaultConnectionMethod)
          } else {
            // Update only this component
            updateComponent(selectedComponent.id, { dn: newDN as any })
          }
          setGlobalChangeDialog(null)
        }
      })
    } else {
      // No dialog needed, just update
      updateComponent(selectedComponent.id, { dn: newDN as any })
    }
  }

  const handleLengthChange = (newLength: number) => {
    if (selectedComponent.type === 'straight') {
      const oldLength = selectedComponent.length || 1000
      const lengthDiff = (newLength - oldLength) / 1000 // Convert to meters

      // Check if any connection points are connected
      const connectedCPs = selectedComponent.connectionPoints.filter((cp: ConnectionPoint) => cp.connectedTo !== null)

      if (connectedCPs.length === 0) {
        // No connections - just update length normally
        updateComponent(selectedComponent.id, { length: newLength })
      } else if (connectedCPs.length === 2) {
        // Both ends connected - grow from outlet (top), keep inlet (bottom) fixed
        // Find the connected components for both ends
        const inletCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'A')
        const outletCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'B')

        if (!inletCP || !outletCP) return

        // The entire length change happens at the outlet (top) end
        // Inlet (bottom) stays fixed
        const outletOffset = new Vector3(0, lengthDiff, 0)
        outletOffset.applyEuler(new Euler(
          selectedComponent.rotation.x,
          selectedComponent.rotation.y,
          selectedComponent.rotation.z
        ))

        // The pipe itself shifts up by half the length change to keep inlet fixed
        const pipeOffset = new Vector3(0, lengthDiff / 2, 0)
        pipeOffset.applyEuler(new Euler(
          selectedComponent.rotation.x,
          selectedComponent.rotation.y,
          selectedComponent.rotation.z
        ))

        // Helper function to move a component and all connected components recursively
        const moveComponentTree = (componentId: string, offset: Vector3, visitedIds: Set<string> = new Set()) => {
          if (visitedIds.has(componentId)) return
          visitedIds.add(componentId)

          // Get fresh component data from store
          const currentComponents = useConfiguratorStore.getState().components
          const comp = currentComponents.find((c) => c.id === componentId)
          if (!comp) return

          // Move this component
          const newPos = comp.position.clone().add(offset)
          updateComponent(componentId, { position: newPos })

          // Recursively move all connected components except the original pipe
          comp.connectionPoints.forEach((cp: ConnectionPoint) => {
            if (cp.connectedTo && cp.connectedTo !== inletCP?.id && cp.connectedTo !== outletCP?.id) {
              // Get fresh components for finding connected component
              const freshComponents = useConfiguratorStore.getState().components
              const connectedComp = freshComponents.find((c) =>
                c.connectionPoints.some((p) => p.id === cp.connectedTo)
              )
              if (connectedComp && connectedComp.id !== selectedComponent.id) {
                moveComponentTree(connectedComp.id, offset, visitedIds)
              }
            }
          })
        }

        // Update the pipe length and position
        const newPipePosition = selectedComponent.position.clone().add(pipeOffset)
        updateComponent(selectedComponent.id, {
          length: newLength,
          position: newPipePosition
        })

        // Inlet stays fixed (no movement needed)

        // Move the outlet-connected component tree by the full length change
        if (outletCP.connectedTo) {
          const outletConnectedComp = components.find((c) =>
            c.connectionPoints.some((cp) => cp.id === outletCP.connectedTo)
          )
          if (outletConnectedComp) {
            moveComponentTree(outletConnectedComp.id, outletOffset)
          }
        }
      } else {
        // One end connected - adjust position to keep that end fixed
        const connectedCP = connectedCPs[0]

        // For straight pipes:
        // Point A (inlet) is at (0, -length/2, 0) pointing down
        // Point B (outlet) is at (0, length/2, 0) pointing up

        // Determine which end is connected
        const isInletConnected = connectedCP.label === 'A'

        // Calculate position adjustment in component's local space
        // If inlet (A, bottom) is connected, extend from outlet (B, top) - shift position down by half the length change
        // If outlet (B, top) is connected, extend from inlet (A, bottom) - shift position up by half the length change
        const localOffset = isInletConnected ? -lengthDiff / 2 : lengthDiff / 2

        // Apply rotation to get world space offset
        const worldOffset = new Vector3(0, localOffset, 0)
        worldOffset.applyEuler(new Euler(
          selectedComponent.rotation.x,
          selectedComponent.rotation.y,
          selectedComponent.rotation.z
        ))

        const newPosition = selectedComponent.position.clone().add(worldOffset)

        // Update both length and position
        updateComponent(selectedComponent.id, {
          length: newLength,
          position: newPosition
        })
      }
    }
  }

  const handleMaterialChange = (newMaterial: 'steel' | 'stainless_v2a' | 'stainless_v4a') => {
    const oldMaterial = selectedComponent.material

    // If project settings are configured and component count > 1, show global change dialog
    if (projectSettings.isConfigured && components.length > 1) {
      setGlobalChangeDialog({
        show: true,
        type: 'material',
        oldValue: oldMaterial,
        newValue: newMaterial,
        onConfirm: (applyGlobally: boolean) => {
          if (applyGlobally) {
            // Update all components
            updateAllComponents({ material: newMaterial })
            // Update project settings
            setProjectSettings(newMaterial, projectSettings.defaultDN, projectSettings.defaultPN, projectSettings.defaultWallThickness, projectSettings.defaultConnectionMethod)
          } else {
            // Update only this component
            updateComponent(selectedComponent.id, { material: newMaterial })
          }
          setGlobalChangeDialog(null)
        }
      })
    } else {
      // No dialog needed, just update
      updateComponent(selectedComponent.id, { material: newMaterial })
    }
  }

  const handleArmLengthChange = (arm: 'inlet' | 'outlet' | 'branch', newLength: number) => {
    if (selectedComponent.type === 'tee') {
      const teeDefaults = selectedComponent.type === 'tee' ? { inlet: 156, outlet: 156, branch: 177 } : { inlet: 200, outlet: 200, branch: 200 }
      const currentArmLengths = selectedComponent.teeArmLengths || {
        inlet: selectedComponent.armLength || teeDefaults.inlet,
        outlet: selectedComponent.armLength || teeDefaults.outlet,
        branch: selectedComponent.armLength || teeDefaults.branch
      }

      const oldLength = currentArmLengths[arm]
      const lengthDiff = (newLength - oldLength) / 1000 // Convert to meters

      // Map arm names to connection point types and directions in local space
      // Branch direction uses branchAngle (default 45° for tee)
      const armConfig: Record<'inlet' | 'outlet' | 'branch', { label: string; direction: Vector3 }> = {
        inlet: { label: 'A', direction: new Vector3(-1, 0, 0) }, // left
        outlet: { label: 'B', direction: new Vector3(1, 0, 0) }, // right
        branch: { label: 'C', direction: new Vector3(0.5338, 0.8457, 0).normalize() }, // center->opening direction from STEP
      }

      const config = armConfig[arm]

      // Find the connection point for this arm
      const armCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === config.label)

      if (armCP && armCP.connectedTo) {
        // Calculate the offset in local space
        const localOffset = config.direction.clone().multiplyScalar(lengthDiff)

        // Apply rotation to get world space offset
        const worldOffset = localOffset.clone()
        worldOffset.applyEuler(new Euler(
          selectedComponent.rotation.x,
          selectedComponent.rotation.y,
          selectedComponent.rotation.z
        ))

        // Helper function to move a component and all connected components recursively
        const moveComponentTree = (componentId: string, offset: Vector3, visitedIds: Set<string> = new Set()) => {
          if (visitedIds.has(componentId)) return
          visitedIds.add(componentId)

          // Get fresh component data from store
          const currentComponents = useConfiguratorStore.getState().components
          const comp = currentComponents.find((c) => c.id === componentId)
          if (!comp) return

          // Move this component
          const newPos = comp.position.clone().add(offset)
          updateComponent(componentId, { position: newPos })

          // Recursively move all connected components except the original tee
          comp.connectionPoints.forEach((cp: ConnectionPoint) => {
            if (cp.connectedTo && cp.connectedTo !== armCP.id) {
              // Get fresh components for finding connected component
              const freshComponents = useConfiguratorStore.getState().components
              const connectedComp = freshComponents.find((c) =>
                c.connectionPoints.some((p) => p.id === cp.connectedTo)
              )
              if (connectedComp && connectedComp.id !== selectedComponent.id) {
                moveComponentTree(connectedComp.id, offset, visitedIds)
              }
            }
          })
        }

        // Find the connected component and move it
        const connectedComp = components.find((c) =>
          c.connectionPoints.some((cp) => cp.id === armCP.connectedTo)
        )
        if (connectedComp) {
          moveComponentTree(connectedComp.id, worldOffset)
        }
      }

      // Update the tee arm lengths
      updateComponent(selectedComponent.id, {
        teeArmLengths: {
          ...currentArmLengths,
          [arm]: newLength
        }
      })
    }
  }

  // Rotate the component around a specific connection point (pivot = CP world pos, axis = CP direction)
  // The component connected at this CP stays fixed; the selected component + everything at other CPs moves.
  const handleCPRotation = (cpId: string, newValueDeg: number) => {
    const oldValueDeg = cpRotations[cpId] || 0
    const deltaDeg = newValueDeg - oldValueDeg
    if (Math.abs(deltaDeg) < 0.01) return

    const deltaRad = (deltaDeg * Math.PI) / 180

    // Find the CP on the selected component
    const cp = selectedComponent.connectionPoints.find((p: ConnectionPoint) => p.id === cpId)
    if (!cp || !cp.connectedTo) return

    // Compute CP world position (pivot) and world direction (rotation axis)
    const compEuler = new Euler(
      selectedComponent.rotation.x,
      selectedComponent.rotation.y,
      selectedComponent.rotation.z
    )
    const pivot = cp.position.clone().applyEuler(compEuler).add(selectedComponent.position)
    const axis = cp.direction.clone().applyEuler(compEuler).normalize()

    // Quaternion for this incremental rotation
    const rotQuat = new Quaternion().setFromAxisAngle(axis, deltaRad)

    // Collect updates: rotate selected component + everything reachable EXCEPT the anchor subtree
    const updates: Array<{ id: string; changes: Partial<import('../../types').PipeComponent> }> = []
    const visited = new Set<string>()

    // The anchor component (connected at this CP) stays fixed — block traversal through it
    const anchorComp = components.find(c =>
      c.connectionPoints.some((p: ConnectionPoint) => p.id === cp.connectedTo)
    )
    if (anchorComp) visited.add(anchorComp.id)

    const rotateTree = (compId: string) => {
      if (visited.has(compId)) return
      visited.add(compId)

      const comp = components.find(c => c.id === compId)
      if (!comp) return

      // Rotate position around pivot
      const relPos = comp.position.clone().sub(pivot)
      relPos.applyQuaternion(rotQuat)
      const newPos = relPos.add(pivot)

      // Compose rotation: apply the rotation quaternion on top of the existing rotation
      const compQuat = new Quaternion().setFromEuler(
        new Euler(comp.rotation.x, comp.rotation.y, comp.rotation.z)
      )
      const newQuat = rotQuat.clone().multiply(compQuat)
      const newEuler = new Euler().setFromQuaternion(newQuat)
      const newRotation = new Vector3(newEuler.x, newEuler.y, newEuler.z)

      updates.push({ id: compId, changes: { position: newPos, rotation: newRotation } })

      // Traverse to all connected components (anchor is already in visited)
      comp.connectionPoints.forEach((p: ConnectionPoint) => {
        if (p.connectedTo) {
          const connComp = components.find(c =>
            c.connectionPoints.some(cp2 => cp2.id === p.connectedTo)
          )
          if (connComp) rotateTree(connComp.id)
        }
      })
    }

    // Start from the selected component itself
    rotateTree(selectedComponent.id)

    if (updates.length === 0) return

    // Apply all changes as a single batch (one undo step)
    // Global collision check (useEffect) will detect warnings/collisions automatically
    batchUpdateComponents(updates)
    setCpRotations(prev => ({ ...prev, [cpId]: newValueDeg }))
  }

  const handleConnectionMethodChange = (cpId: string, newMethod: ConnectionMethod) => {
    // Update the connection method for this connection point
    const updatedCPs = selectedComponent.connectionPoints.map((cp: ConnectionPoint) =>
      cp.id === cpId ? { ...cp, connectionMethod: newMethod } : cp
    )
    updateComponent(selectedComponent.id, { connectionPoints: updatedCPs })

    // Also update the connected component's connection point
    const connectedCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.id === cpId)
    if (connectedCP && connectedCP.connectedTo) {
      const connectedComponent = components.find((c) =>
        c.connectionPoints.some((cp) => cp.id === connectedCP.connectedTo)
      )
      if (connectedComponent) {
        const updatedConnectedCPs = connectedComponent.connectionPoints.map((cp: ConnectionPoint) =>
          cp.id === connectedCP.connectedTo ? { ...cp, connectionMethod: newMethod } : cp
        )
        updateComponent(connectedComponent.id, { connectionPoints: updatedConnectedCPs })
      }
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Eigenschaften</h2>

      {/* Collision Warning Banner (yellow) */}
      {collisionWarnings.length > 0 && !collisionWarnings.some(w => w.type === 'blocked') && (
        <div className="flex items-center gap-2 px-3 py-2 rounded mb-3 text-sm font-medium bg-yellow-900 bg-opacity-80 text-yellow-200 border border-yellow-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Achtung: Komponenten in der Nähe</span>
        </div>
      )}

      {/* Collision Blocked Banner (red) */}
      {collisionWarnings.some(w => w.type === 'blocked') && !showCollisionDialog && (
        <div className="flex items-center gap-2 px-3 py-2 rounded mb-3 text-sm font-medium bg-red-900 bg-opacity-80 text-red-200 border border-red-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Kollision — Elemente überlappen sich!</span>
        </div>
      )}

      {/* Debug: collision status */}
      {collisionDebug && (
        <div className="text-gray-500 text-[10px] mb-2 font-mono">[Debug] {collisionDebug}</div>
      )}

      {/* Collision Confirmation Dialog */}
      {showCollisionDialog && (
        <div className="mb-3 p-3 rounded border-2 border-red-600 bg-red-950 bg-opacity-95">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            <span className="text-red-200 text-sm font-semibold">Kollision erkannt!</span>
          </div>
          <p className="text-red-300 text-xs mb-3">
            Elemente überlappen sich. In der Realität wäre diese Konfiguration nicht umsetzbar. Möchten Sie trotzdem fortfahren?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // User accepts collision — close dialog, keep state
                setShowCollisionDialog(false)
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors"
            >
              Beibehalten
            </button>
            <button
              onClick={() => {
                // User rejects collision — undo last action
                setShowCollisionDialog(false)
                undo()
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
            >
              Rückgängig
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-gray-300 text-sm">Typ</label>
          <div className="text-white font-semibold">
            {template?.name}
          </div>
        </div>

        <div>
          <label className="text-gray-300 text-sm block mb-1">Material</label>
          <select
            value={selectedComponent.material}
            onChange={(e) => handleMaterialChange(e.target.value as any)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="steel">Stahl (×{materialMultipliers.steel})</option>
            <option value="stainless_v2a">V2A Edelstahl / 1.4301 (×{materialMultipliers.stainless_v2a})</option>
            <option value="stainless_v4a">V4A Edelstahl / 1.4401 (×{materialMultipliers.stainless_v4a})</option>
          </select>
        </div>

        <div>
          <label className="text-gray-300 text-sm block mb-1">
            Nenndurchmesser (DN)
          </label>
          <select
            value={selectedComponent.dn}
            onChange={(e) => handleDNChange(Number(e.target.value))}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          >
            {template?.availableDNs.map((dn) => (
              <option key={dn} value={dn}>
                DN{dn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-300 text-sm block mb-1">
            Nenndruck (PN)
          </label>
          <select
            value={selectedComponent.pn}
            onChange={(e) => updateComponent(selectedComponent.id, { pn: Number(e.target.value) as PNValue })}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          >
            {template?.availablePNs.map((pn) => (
              <option key={pn} value={pn}>
                PN{pn} ({pn} bar)
              </option>
            ))}
          </select>
        </div>

        {template?.availableWallThicknesses && (
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Materialstärke / Wandstärke (mm)
            </label>
            <select
              value={selectedComponent.wallThickness || template.defaultWallThickness || 3}
              onChange={(e) => updateComponent(selectedComponent.id, { wallThickness: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
            >
              {template.availableWallThicknesses.map((thickness) => (
                <option key={thickness} value={thickness}>
                  {thickness} mm
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedComponent.type === 'straight' && (
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Länge (mm)
            </label>
            <input
              type="number"
              value={selectedComponent.length || 1000}
              onChange={(e) => handleLengthChange(Number(e.target.value))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              min="100"
              max="10000"
              step="100"
            />
            {(() => {
              const flangedCPs = selectedComponent.connectionPoints.filter((cp: ConnectionPoint) => cp.connectionMethod === 'flanged')
              if (flangedCPs.length === 0 || !(selectedComponent.flangesIncludedInLength ?? true)) return null
              const thickness = getFlangeThickness(selectedComponent.dn, selectedComponent.pn)
              const deduction = flangedCPs.length * thickness
              const effective = (selectedComponent.length || 1000) - deduction
              return (
                <div className="text-xs text-amber-400 mt-1">
                  → Effektiv: {Math.round(effective)} mm ({flangedCPs.length}× Flansch à {thickness} mm)
                </div>
              )
            })()}
          </div>
        )}

        {selectedComponent.type === 'tee' && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Schenkellängen (mm)
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Eingang (A - links)</label>
                <input
                  type="number"
                  value={selectedComponent.teeArmLengths?.inlet || 156}
                  onChange={(e) => handleArmLengthChange('inlet', Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
                {(() => {
                  const cpA = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'A')
                  if (!cpA || cpA.connectionMethod !== 'flanged' || !(selectedComponent.flangesIncludedInLength ?? true)) return null
                  const thickness = getFlangeThickness(selectedComponent.dn, selectedComponent.pn)
                  const effective = (selectedComponent.teeArmLengths?.inlet || 156) - thickness
                  return <div className="text-xs text-amber-400 mt-1">→ Effektiv: {Math.round(effective)} mm (-{thickness} mm Flansch)</div>
                })()}
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Ausgang (B - rechts)</label>
                <input
                  type="number"
                  value={selectedComponent.teeArmLengths?.outlet || 156}
                  onChange={(e) => handleArmLengthChange('outlet', Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
                {(() => {
                  const cpB = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'B')
                  if (!cpB || cpB.connectionMethod !== 'flanged' || !(selectedComponent.flangesIncludedInLength ?? true)) return null
                  const thickness = getFlangeThickness(selectedComponent.dn, selectedComponent.pn)
                  const effective = (selectedComponent.teeArmLengths?.outlet || 156) - thickness
                  return <div className="text-xs text-amber-400 mt-1">→ Effektiv: {Math.round(effective)} mm (-{thickness} mm Flansch)</div>
                })()}
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Abzweigung (C - oben)</label>
                <input
                  type="number"
                  value={selectedComponent.teeArmLengths?.branch || 177}
                  onChange={(e) => handleArmLengthChange('branch', Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
                {(() => {
                  const cpC = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'C')
                  if (!cpC || cpC.connectionMethod !== 'flanged' || !(selectedComponent.flangesIncludedInLength ?? true)) return null
                  const thickness = getFlangeThickness(selectedComponent.dn, selectedComponent.pn)
                  const effective = (selectedComponent.teeArmLengths?.branch || 177) - thickness
                  return <div className="text-xs text-amber-400 mt-1">→ Effektiv: {Math.round(effective)} mm (-{thickness} mm Flansch)</div>
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Abzweigwinkel-Slider für T-Stück */}
        {selectedComponent.type === 'tee' && (
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Abzweigwinkel
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="15"
                max="75"
                step="1"
                value={selectedComponent.branchAngle || 45}
                onChange={(e) => updateComponent(selectedComponent.id, { branchAngle: Number(e.target.value) })}
                className="flex-1"
                style={{ accentColor: '#0077C8' }}
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={selectedComponent.branchAngle || 45}
                  onChange={(e) => {
                    const val = Math.min(75, Math.max(15, Number(e.target.value)))
                    updateComponent(selectedComponent.id, { branchAngle: val })
                  }}
                  className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-sm text-center"
                  min="15"
                  max="75"
                />
                <span className="text-gray-400 text-sm">°</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Winkel der Abzweigung zur Hauptleitung (45° = Standard)
            </p>
          </div>
        )}


        {/* Flange-inclusive length toggle + breakdown */}
        {(() => {
          const flangedCPs = selectedComponent.connectionPoints.filter(
            (cp: ConnectionPoint) => cp.connectionMethod === 'flanged'
          )
          if (flangedCPs.length === 0) return null

          const flangesIncluded = selectedComponent.flangesIncludedInLength ?? true
          const dn = selectedComponent.dn
          const pn = selectedComponent.pn
          const thickness = getFlangeThickness(dn, pn)

          // Compute effective lengths and build breakdown
          let breakdown: React.ReactNode = null
          let validationWarning: string | null = null

          if (selectedComponent.type === 'straight') {
            const rawLength = selectedComponent.length || 1000
            const effectiveLength = getEffectivePipeBodyLength(
              rawLength, selectedComponent.connectionPoints, dn, pn, flangesIncluded
            )
            if (flangesIncluded && flangedCPs.length > 0) {
              breakdown = (
                <div className="text-xs text-gray-400 mt-2 font-mono">
                  <div className="text-gray-300 mb-1">Längenaufstellung:</div>
                  <div className="flex justify-between"><span>Gesamtlänge (Eingabe):</span><span>{rawLength} mm</span></div>
                  <div className="flex justify-between"><span>Flansche ({flangedCPs.length}x {thickness} mm):</span><span>-{flangedCPs.length * thickness} mm</span></div>
                  <div className="border-t border-gray-600 my-1" />
                  <div className="flex justify-between font-semibold text-gray-200"><span>Effektive Rohrlänge:</span><span>{Math.round(effectiveLength)} mm</span></div>
                </div>
              )
            }
            if (effectiveLength < 50) {
              validationWarning = `Effektive Rohrlänge (${Math.round(effectiveLength)} mm) ist zu kurz (min. 50 mm)`
            }
          } else if (selectedComponent.type === 'elbow') {
            const rawInlet = selectedComponent.elbowArmLengths?.inlet || 150
            const rawOutlet = selectedComponent.elbowArmLengths?.outlet || 150
            const effInlet = getEffectiveArmLength(rawInlet, 'A', selectedComponent.connectionPoints, dn, pn, flangesIncluded)
            const effOutlet = getEffectiveArmLength(rawOutlet, 'B', selectedComponent.connectionPoints, dn, pn, flangesIncluded)
            const hasDeduction = effInlet !== rawInlet || effOutlet !== rawOutlet
            if (flangesIncluded && hasDeduction) {
              breakdown = (
                <div className="text-xs text-gray-400 mt-2 font-mono">
                  <div className="text-gray-300 mb-1">Schenkellängen (effektiv):</div>
                  {effInlet !== rawInlet && <div className="flex justify-between"><span>A (Eingang):</span><span>{rawInlet} - {thickness} = {Math.round(effInlet)} mm</span></div>}
                  {effOutlet !== rawOutlet && <div className="flex justify-between"><span>B (Ausgang):</span><span>{rawOutlet} - {thickness} = {Math.round(effOutlet)} mm</span></div>}
                </div>
              )
            }
            if (effInlet < 50) validationWarning = `Arm A: Effektive Länge (${Math.round(effInlet)} mm) zu kurz`
            else if (effOutlet < 50) validationWarning = `Arm B: Effektive Länge (${Math.round(effOutlet)} mm) zu kurz`
          } else if (selectedComponent.type === 'tee') {
            const rawInlet = selectedComponent.teeArmLengths?.inlet || selectedComponent.armLength || 200
            const rawOutlet = selectedComponent.teeArmLengths?.outlet || selectedComponent.armLength || 200
            const rawBranch = selectedComponent.teeArmLengths?.branch || selectedComponent.armLength || 200
            const effInlet = getEffectiveArmLength(rawInlet, 'A', selectedComponent.connectionPoints, dn, pn, flangesIncluded)
            const effOutlet = getEffectiveArmLength(rawOutlet, 'B', selectedComponent.connectionPoints, dn, pn, flangesIncluded)
            const effBranch = getEffectiveArmLength(rawBranch, 'C', selectedComponent.connectionPoints, dn, pn, flangesIncluded)
            const hasDeduction = effInlet !== rawInlet || effOutlet !== rawOutlet || effBranch !== rawBranch
            if (flangesIncluded && hasDeduction) {
              breakdown = (
                <div className="text-xs text-gray-400 mt-2 font-mono">
                  <div className="text-gray-300 mb-1">Schenkellängen (effektiv):</div>
                  {effInlet !== rawInlet && <div className="flex justify-between"><span>A (Eingang):</span><span>{rawInlet} - {thickness} = {Math.round(effInlet)} mm</span></div>}
                  {effOutlet !== rawOutlet && <div className="flex justify-between"><span>B (Ausgang):</span><span>{rawOutlet} - {thickness} = {Math.round(effOutlet)} mm</span></div>}
                  {effBranch !== rawBranch && <div className="flex justify-between"><span>C (Abzweigung):</span><span>{rawBranch} - {thickness} = {Math.round(effBranch)} mm</span></div>}
                </div>
              )
            }
            if (effInlet < 50) validationWarning = `Arm A: Effektive Länge (${Math.round(effInlet)} mm) zu kurz`
            else if (effOutlet < 50) validationWarning = `Arm B: Effektive Länge (${Math.round(effOutlet)} mm) zu kurz`
            else if (effBranch < 50) validationWarning = `Arm C: Effektive Länge (${Math.round(effBranch)} mm) zu kurz`
          }

          return (
            <div>
              <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={flangesIncluded}
                  onChange={(e) => updateComponent(selectedComponent.id, { flangesIncludedInLength: e.target.checked })}
                  className="rounded"
                  style={{ accentColor: '#0077C8' }}
                />
                Flansche in Gesamtlänge einbeziehen
              </label>
              {breakdown}
              {validationWarning && (
                <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
                  <AlertTriangle size={12} />
                  <span>{validationWarning}</span>
                </div>
              )}
            </div>
          )
        })()}

        {/* Rotation — one slider per connected opening */}
        {(() => {
          // Only show if component has openings (CPs)
          if (selectedComponent.connectionPoints.length === 0) return null

          const cpTypeNames: Record<string, string> = {
            inlet: 'Eingang',
            outlet: 'Ausgang',
            branch: 'Abzweigung',
            branch2: 'Abzweigung 2',
            branch3: 'Abzweigung 3',
          }

          // Show one slider per connected CP
          const connectedCPs = selectedComponent.connectionPoints.filter(
            (cp: ConnectionPoint) => cp.connectedTo !== null
          )

          if (connectedCPs.length === 0) return null

          return (
            <div>
              <label className="text-gray-300 text-sm block mb-2">Rotation</label>
              <div className="space-y-3">
                {connectedCPs.map((cp: ConnectionPoint) => {
                  const sliderValue = cpRotations[cp.id] || 0

                  return (
                    <div key={cp.id}>
                      <label className="text-gray-400 text-xs block mb-1">
                        Drehung an {cp.label} ({cpTypeNames[cp.type] || cp.type})
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">L</span>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={sliderValue}
                          onChange={(e) => handleCPRotation(cp.id, Number(e.target.value))}
                          className="flex-1"
                          style={{ accentColor: '#0077C8' }}
                        />
                        <span className="text-gray-500 text-xs">R</span>
                        <input
                          type="number"
                          value={sliderValue}
                          onChange={(e) => handleCPRotation(cp.id, Number(e.target.value))}
                          className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-sm text-center"
                          step="5"
                          min="-180"
                          max="180"
                        />
                        <span className="text-gray-400 text-sm">°</span>
                      </div>
                      <div className="flex justify-between text-gray-600 text-[10px] mt-0.5 px-4">
                        <span>-180°</span>
                        <span>0°</span>
                        <span>+180°</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Connection Points */}
        <div>
          <label className="text-gray-300 text-sm block mb-2">Verbindungspunkte</label>
          <div className="space-y-2">
            {selectedComponent.connectionPoints.map((cp: ConnectionPoint) => (
              <div
                key={cp.id}
                className={`p-2 rounded border ${
                  cp.connectedTo
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-white text-sm font-semibold">
                    {cp.label} - {cp.type}
                  </div>
                  <div className="text-xs text-gray-400">DN{cp.dn}</div>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Verbindungsmethode:</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleConnectionMethodChange(cp.id, 'welded')
                        setExpandedConnectionCP(null)
                      }}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        !cp.connectionMethod || cp.connectionMethod === 'welded'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      geschweißt
                    </button>
                    <button
                      onClick={() => {
                        handleConnectionMethodChange(cp.id, 'flanged')
                        setExpandedConnectionCP(expandedConnectionCP === cp.id ? null : cp.id)
                      }}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        cp.connectionMethod === 'flanged'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      geflancht
                    </button>
                  </div>
                  {cp.connectedTo && cp.connectionMethod === 'flanged' && expandedConnectionCP === cp.id && (
                    <div className="mt-2 space-y-1">
                      {connectionTemplates.map((ct) => (
                        <button
                          key={ct.type}
                          onClick={() => {
                            handleConnectionMethodChange(cp.id, 'flanged')
                            setExpandedConnectionCP(null)
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs rounded bg-gray-600 text-gray-200 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          {ct.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {!cp.connectedTo && (
                    <div className="text-xs text-gray-500 italic mt-1">Nicht verbunden</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-300 text-sm">Preis</label>
          <div className="text-green-400 font-bold text-lg">
            {selectedComponent.price.toFixed(2)} €
          </div>
        </div>

        <button
          onClick={() => removeComponent(selectedComponent.id)}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
        >
          Komponente löschen
        </button>
      </div>

      {/* Global Change Dialog */}
      {globalChangeDialog && (
        <GlobalChangeDialog
          changeType={globalChangeDialog.type}
          oldValue={globalChangeDialog.oldValue}
          newValue={globalChangeDialog.newValue}
          onConfirm={globalChangeDialog.onConfirm}
          onCancel={() => setGlobalChangeDialog(null)}
        />
      )}

    </div>
  )
}
