import React, { useState } from 'react'
import { Vector3, Euler } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates, materialMultipliers } from '../../data/componentTemplates'
import { ConnectionMethod, ConnectionPoint, DNValue } from '../../types'
import { GlobalChangeDialog } from './GlobalChangeDialog'
import { RotationDialog } from './RotationDialog'

export const PropertiesPanel: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedId = useConfiguratorStore((state) => state.selectedComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const updateAllComponents = useConfiguratorStore((state) => state.updateAllComponents)
  const removeComponent = useConfiguratorStore((state) => state.removeComponent)
  const projectSettings = useConfiguratorStore((state) => state.projectSettings)
  const setProjectSettings = useConfiguratorStore((state) => state.setProjectSettings)

  // State for global change dialog
  const [globalChangeDialog, setGlobalChangeDialog] = useState<{
    show: boolean
    type: 'material' | 'dn'
    oldValue: string | number
    newValue: string | number
    onConfirm: (applyGlobally: boolean) => void
  } | null>(null)

  // State for rotation dialog
  const [rotationDialog, setRotationDialog] = useState<{
    show: boolean
    axis: 'x' | 'y' | 'z'
    oldValue: number
    newValue: number
    connectedComponents: Array<{ id: string; name: string; type: string }>
    onConfirm: (rotateConnected: boolean, selectedComponentIds: string[]) => void
  } | null>(null)

  // State for remembered rotation selection
  const [rememberedRotationSelection, setRememberedRotationSelection] = useState<string[] | null>(null)

  const selectedComponent = components.find((c) => c.id === selectedId)

  if (!selectedComponent) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Eigenschaften</h2>
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
            setProjectSettings(projectSettings.defaultMaterial, newDN, projectSettings.defaultWallThickness)
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
    if (selectedComponent.type === 'straight' ||
        selectedComponent.type === 'f_piece' ||
        selectedComponent.type === 'ff_piece' ||
        selectedComponent.type === 'ff_piece_one_branch' ||
        selectedComponent.type === 'ff_piece_two_branches') {
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

  const handleMaterialChange = (newMaterial: 'steel' | 'stainless' | 'copper' | 'pvc') => {
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
            setProjectSettings(newMaterial, projectSettings.defaultDN, projectSettings.defaultWallThickness)
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
    if (selectedComponent.type === 'tee' ||
        selectedComponent.type === 'ffft_symmetrical' ||
        selectedComponent.type === 'ffft_asymmetrical' ||
        selectedComponent.type === 'ffq_equal' ||
        selectedComponent.type === 'ffq_unequal' ||
        selectedComponent.type === 'fffor_one_branch' ||
        selectedComponent.type === 'fffrk_one_branch' ||
        selectedComponent.type === 'wye' ||
        selectedComponent.type === 'wye_angled' ||
        selectedComponent.type === 'union_straight' ||
        selectedComponent.type === 'union_angled') {
      const currentArmLengths = selectedComponent.teeArmLengths || {
        inlet: selectedComponent.armLength || 200,
        outlet: selectedComponent.armLength || 200,
        branch: selectedComponent.armLength || 200
      }

      const oldLength = currentArmLengths[arm]
      const lengthDiff = (newLength - oldLength) / 1000 // Convert to meters

      // Map arm names to connection point types and directions in local space
      const armConfig: Record<'inlet' | 'outlet' | 'branch', { label: string; direction: Vector3 }> = {
        inlet: { label: 'A', direction: new Vector3(-1, 0, 0) }, // left
        outlet: { label: 'B', direction: new Vector3(1, 0, 0) }, // right
        branch: { label: 'C', direction: new Vector3(0, 1, 0) }, // top
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

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = selectedComponent.position.clone()
    newPosition[axis] = value
    updateComponent(selectedComponent.id, { position: newPosition })
  }

  // Helper function to find all directly connected components
  const findConnectedComponents = (component: typeof selectedComponent) => {
    if (!component) return []

    const connectedComponentsList: Array<{ id: string; name: string; type: string }> = []
    const connectedIds = new Set<string>()

    component.connectionPoints.forEach((cp: ConnectionPoint) => {
      if (cp.connectedTo) {
        const connectedComp = components.find((c) =>
          c.connectionPoints.some((p) => p.id === cp.connectedTo)
        )
        if (connectedComp && !connectedIds.has(connectedComp.id)) {
          connectedIds.add(connectedComp.id)
          const template = componentTemplates.find((t) => t.type === connectedComp.type)
          connectedComponentsList.push({
            id: connectedComp.id,
            name: template?.name || connectedComp.type,
            type: connectedComp.type,
          })
        }
      }
    })

    return connectedComponentsList
  }

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    // Normalize value to 0-360 range
    let normalizedValue = value % 360
    if (normalizedValue < 0) normalizedValue += 360

    // Get current rotation in degrees
    const oldValueDegrees = (selectedComponent.rotation[axis] * 180) / Math.PI

    // Find all directly connected components
    const connectedComps = findConnectedComponents(selectedComponent)

    // If there's a remembered selection, apply it directly without dialog
    if (rememberedRotationSelection !== null) {
      applyRotation(axis, normalizedValue, true, rememberedRotationSelection)
      return
    }

    // Show rotation dialog
    setRotationDialog({
      show: true,
      axis,
      oldValue: oldValueDegrees,
      newValue: normalizedValue,
      connectedComponents: connectedComps,
      onConfirm: (rotateConnected: boolean, selectedComponentIds: string[]) => {
        applyRotation(axis, normalizedValue, rotateConnected, selectedComponentIds)
        setRotationDialog(null)
      }
    })
  }

  const handleRememberRotationSelection = (selectedComponentIds: string[]) => {
    setRememberedRotationSelection(selectedComponentIds)
    setRotationDialog(null)
  }

  const handleClearRotationSelection = () => {
    setRememberedRotationSelection(null)
  }

  // Apply rotation with optional propagation to connected components
  const applyRotation = (
    axis: 'x' | 'y' | 'z',
    valueDegrees: number,
    rotateConnected: boolean,
    selectedComponentIds: string[]
  ) => {
    const newRotation = selectedComponent.rotation.clone()
    const oldRotation = selectedComponent.rotation.clone()
    newRotation[axis] = (valueDegrees * Math.PI) / 180 // Convert to radians

    // Calculate rotation difference
    const rotationDiff = newRotation[axis] - oldRotation[axis]

    // Update the component's rotation
    updateComponent(selectedComponent.id, { rotation: newRotation })

    if (!rotateConnected || selectedComponentIds.length === 0) {
      // Only rotate this component, no propagation
      return
    }

    // Helper function to rotate a component and all its connected components recursively
    const rotateComponentTree = (
      componentId: string,
      rotationAxis: 'x' | 'y' | 'z',
      rotationDelta: number,
      pivotPoint: Vector3,
      allowedIds: Set<string>,
      visitedIds: Set<string> = new Set()
    ) => {
      if (visitedIds.has(componentId)) return
      visitedIds.add(componentId)

      // Get fresh component data from store
      const currentComponents = useConfiguratorStore.getState().components
      const comp = currentComponents.find((c) => c.id === componentId)
      if (!comp) return

      // Calculate new position by rotating around pivot point
      const relativePos = comp.position.clone().sub(pivotPoint)

      // Create rotation matrix for the axis
      if (rotationAxis === 'x') {
        const y = relativePos.y
        const z = relativePos.z
        relativePos.y = y * Math.cos(rotationDelta) - z * Math.sin(rotationDelta)
        relativePos.z = y * Math.sin(rotationDelta) + z * Math.cos(rotationDelta)
      } else if (rotationAxis === 'y') {
        const x = relativePos.x
        const z = relativePos.z
        relativePos.x = x * Math.cos(rotationDelta) + z * Math.sin(rotationDelta)
        relativePos.z = -x * Math.sin(rotationDelta) + z * Math.cos(rotationDelta)
      } else if (rotationAxis === 'z') {
        const x = relativePos.x
        const y = relativePos.y
        relativePos.x = x * Math.cos(rotationDelta) - y * Math.sin(rotationDelta)
        relativePos.y = x * Math.sin(rotationDelta) + y * Math.cos(rotationDelta)
      }

      const newPos = relativePos.add(pivotPoint)

      // Update component rotation and position
      const newCompRotation = comp.rotation.clone()
      newCompRotation[rotationAxis] += rotationDelta

      updateComponent(componentId, {
        position: newPos,
        rotation: newCompRotation
      })

      // Recursively rotate all connected components except the original
      comp.connectionPoints.forEach((cp: ConnectionPoint) => {
        if (cp.connectedTo) {
          // Get fresh components for finding connected component
          const freshComponents = useConfiguratorStore.getState().components
          const connectedComp = freshComponents.find((c) =>
            c.connectionPoints.some((p) => p.id === cp.connectedTo)
          )
          if (connectedComp && connectedComp.id !== selectedComponent.id && allowedIds.has(connectedComp.id)) {
            rotateComponentTree(connectedComp.id, rotationAxis, rotationDelta, pivotPoint, allowedIds, visitedIds)
          }
        }
      })
    }

    // Rotate selected connected component trees
    const allowedIds = new Set(selectedComponentIds)
    selectedComponentIds.forEach((compId) => {
      if (rotationDiff !== 0) {
        rotateComponentTree(compId, axis, rotationDiff, selectedComponent.position, allowedIds)
      }
    })
  }

  const handleElbowArmLengthChange = (arm: 'inlet' | 'outlet', newLength: number) => {
    if (selectedComponent.type === 'elbow' ||
        selectedComponent.type === 'frk_equal' ||
        selectedComponent.type === 'frk_unequal') {
      const defaultArmLength = (selectedComponent.dn / 2) * 3 // 3x radius as default
      const currentArmLengths = selectedComponent.elbowArmLengths || {
        inlet: defaultArmLength,
        outlet: defaultArmLength
      }

      const oldLength = currentArmLengths[arm]
      const lengthDiff = (newLength - oldLength) / 1000 // Convert to meters

      // Get elbow angle
      const angleInDegrees = selectedComponent.angle || 90
      const angleInRadians = (angleInDegrees * Math.PI) / 180

      // Map arm names to connection point labels and directions
      const armConfig: Record<'inlet' | 'outlet', { label: string; getDirection: () => Vector3 }> = {
        inlet: {
          label: 'A',
          getDirection: () => new Vector3(0, -1, 0) // inlet always points down
        },
        outlet: {
          label: 'B',
          getDirection: () => new Vector3(Math.sin(angleInRadians), -Math.cos(angleInRadians), 0) // outlet rotated by angle
        }
      }

      const config = armConfig[arm]

      // Find the connection point for this arm
      const armCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === config.label)

      if (armCP && armCP.connectedTo) {
        // Calculate the offset in local space
        const localOffset = config.getDirection().multiplyScalar(lengthDiff)

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

          // Recursively move all connected components except the original elbow
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

      // Update the elbow arm lengths
      updateComponent(selectedComponent.id, {
        elbowArmLengths: {
          ...currentArmLengths,
          [arm]: newLength
        }
      })
    }
  }

  const handleElbowAngleChange = (newAngle: number) => {
    if (selectedComponent.type === 'elbow' ||
        selectedComponent.type === 'frk_equal' ||
        selectedComponent.type === 'frk_unequal') {
      // When angle changes, we need to reposition the outlet-connected component
      const outletCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'B')

      if (outletCP && outletCP.connectedTo) {
        // Calculate old and new outlet positions
        const defaultArmLength = (selectedComponent.dn / 2) * 3
        const outletLength = (selectedComponent.elbowArmLengths?.outlet || defaultArmLength) / 1000

        const oldAngleRad = ((selectedComponent.angle || 90) * Math.PI) / 180
        const newAngleRad = (newAngle * Math.PI) / 180

        // Old outlet position
        const oldOutletX = outletLength * Math.sin(oldAngleRad)
        const oldOutletY = -outletLength * Math.cos(oldAngleRad)

        // New outlet position
        const newOutletX = outletLength * Math.sin(newAngleRad)
        const newOutletY = -outletLength * Math.cos(newAngleRad)

        // Calculate the offset in local space
        const localOffset = new Vector3(newOutletX - oldOutletX, newOutletY - oldOutletY, 0)

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

          // Recursively move all connected components except the original elbow
          comp.connectionPoints.forEach((cp: ConnectionPoint) => {
            if (cp.connectedTo && cp.connectedTo !== outletCP.id) {
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
          c.connectionPoints.some((cp) => cp.id === outletCP.connectedTo)
        )
        if (connectedComp) {
          moveComponentTree(connectedComp.id, worldOffset)
        }
      }

      // Update the elbow angle
      updateComponent(selectedComponent.id, { angle: newAngle })
    }
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

      <div className="space-y-4">
        <div>
          <label className="text-gray-300 text-sm">Typ</label>
          <div className="text-white font-semibold">
            {selectedComponent.type === 'ffft_asymmetrical' ? (
              <>
                {template?.name} DN{selectedComponent.inletDN || selectedComponent.dn}/{selectedComponent.outletDN || selectedComponent.dn}/{selectedComponent.branchDN || Math.max(20, selectedComponent.dn - 10)}
              </>
            ) : (
              template?.name
            )}
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
            <option value="stainless">Edelstahl (×{materialMultipliers.stainless})</option>
            <option value="copper">Kupfer (×{materialMultipliers.copper})</option>
            <option value="pvc">PVC (×{materialMultipliers.pvc})</option>
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

        {/* Flange position selection for F-Stück components */}
        {(selectedComponent.type === 'f_piece' ||
          selectedComponent.type === 'ff_piece' ||
          selectedComponent.type === 'ff_piece_one_branch' ||
          selectedComponent.type === 'ff_piece_two_branches') && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Flanschposition
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateComponent(selectedComponent.id, { flangePosition: 'inlet' })}
                className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                  selectedComponent.flangePosition === 'inlet'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Eingang
              </button>
              <button
                onClick={() => updateComponent(selectedComponent.id, { flangePosition: 'outlet' })}
                className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                  selectedComponent.flangePosition === 'outlet'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Ausgang
              </button>
              <button
                onClick={() => updateComponent(selectedComponent.id, { flangePosition: 'both' })}
                className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                  selectedComponent.flangePosition === 'both'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Beide
              </button>
            </div>
          </div>
        )}

        {/* Bend radius for FFQ and FRK components */}
        {(selectedComponent.type === 'ffq_equal' ||
          selectedComponent.type === 'ffq_unequal' ||
          selectedComponent.type === 'frk_equal' ||
          selectedComponent.type === 'frk_unequal' ||
          selectedComponent.type === 'fffrk_one_branch') && (
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Bogenradius (mm)
            </label>
            <input
              type="number"
              value={selectedComponent.bendRadius || 150}
              onChange={(e) => updateComponent(selectedComponent.id, { bendRadius: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              min="50"
              max="500"
              step="10"
            />
          </div>
        )}

        {/* Inlet/Outlet DN for reducer components */}
        {(selectedComponent.type === 'frr_concentric' ||
          selectedComponent.type === 'frr_eccentric' ||
          selectedComponent.type === 'frk_equal' ||
          selectedComponent.type === 'frk_unequal') && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              DN-Werte (Reduktion)
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Eingang DN</label>
                <select
                  value={selectedComponent.inletDN || selectedComponent.dn}
                  onChange={(e) => updateComponent(selectedComponent.id, { inletDN: Number(e.target.value) as DNValue })}
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
                <label className="text-gray-400 text-xs block mb-1">Ausgang DN</label>
                <select
                  value={selectedComponent.outletDN || Math.max(20, selectedComponent.dn - 10)}
                  onChange={(e) => updateComponent(selectedComponent.id, { outletDN: Number(e.target.value) as DNValue })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                >
                  {template?.availableDNs.map((dn) => (
                    <option key={dn} value={dn}>
                      DN{dn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* FFFT asymmetric: Inlet/Outlet/Branch DN and Branch Offset */}
        {selectedComponent.type === 'ffft_asymmetrical' && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              DN-Werte (FFFT asymmetrisch)
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Eingang DN</label>
                <select
                  value={selectedComponent.inletDN || selectedComponent.dn}
                  onChange={(e) => updateComponent(selectedComponent.id, { inletDN: Number(e.target.value) as DNValue })}
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
                <label className="text-gray-400 text-xs block mb-1">Ausgang DN</label>
                <select
                  value={selectedComponent.outletDN || selectedComponent.dn}
                  onChange={(e) => updateComponent(selectedComponent.id, { outletDN: Number(e.target.value) as DNValue })}
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
                <label className="text-gray-400 text-xs block mb-1">Abgang DN</label>
                <select
                  value={selectedComponent.branchDN || Math.max(20, selectedComponent.dn - 10)}
                  onChange={(e) => updateComponent(selectedComponent.id, { branchDN: Number(e.target.value) as DNValue })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                >
                  {template?.availableDNs.map((dn) => (
                    <option key={dn} value={dn}>
                      DN{dn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Branch offset for FFFT asymmetric */}
        {selectedComponent.type === 'ffft_asymmetrical' && (
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Abgang-Versatz (mm)
            </label>
            <input
              type="number"
              value={selectedComponent.branchOffset || 0}
              onChange={(e) => updateComponent(selectedComponent.id, { branchOffset: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              min="-200"
              max="200"
              step="10"
            />
            <p className="text-gray-500 text-xs mt-1">
              Versatz von der Mittelachse (negativ = links, positiv = rechts)
            </p>
          </div>
        )}

        {/* Branch angle for FFFT asymmetric */}
        {selectedComponent.type === 'ffft_asymmetrical' && (
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Abgang-Winkel (Grad)
            </label>
            <input
              type="number"
              value={selectedComponent.branchAngle || 90}
              onChange={(e) => updateComponent(selectedComponent.id, { branchAngle: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              min="0"
              max="180"
              step="15"
            />
            <p className="text-gray-500 text-xs mt-1">
              Winkel des Abgangs (90° = senkrecht zur Hauptleitung)
            </p>
          </div>
        )}

        {/* Branch configuration for components with branches */}
        {(selectedComponent.type === 'ff_piece_one_branch' ||
          selectedComponent.type === 'ff_piece_two_branches' ||
          selectedComponent.type === 'fffor_one_branch' ||
          selectedComponent.type === 'fffrk_one_branch') && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Abgang 1 Konfiguration
            </label>
            <div className="space-y-2 p-3 bg-gray-700 rounded">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Winkel (Grad)</label>
                <input
                  type="number"
                  value={selectedComponent.branch1?.angle || 90}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch1: {
                      ...(selectedComponent.branch1 || { position: 0.5, dn: selectedComponent.dn, length: 150 }),
                      angle: Number(e.target.value)
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                  min="0"
                  max="360"
                  step="15"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Position (0-1 entlang Hauptachse)</label>
                <input
                  type="number"
                  value={selectedComponent.branch1?.position || 0.5}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch1: {
                      ...(selectedComponent.branch1 || { angle: 90, dn: selectedComponent.dn, length: 150 }),
                      position: Number(e.target.value)
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">DN</label>
                <select
                  value={selectedComponent.branch1?.dn || selectedComponent.dn}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch1: {
                      ...(selectedComponent.branch1 || { angle: 90, position: 0.5, length: 150 }),
                      dn: Number(e.target.value) as DNValue
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                >
                  {template?.availableDNs.map((dn) => (
                    <option key={dn} value={dn}>
                      DN{dn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Länge (mm)</label>
                <input
                  type="number"
                  value={selectedComponent.branch1?.length || 150}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch1: {
                      ...(selectedComponent.branch1 || { angle: 90, position: 0.5, dn: selectedComponent.dn }),
                      length: Number(e.target.value)
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Branch 2 configuration for components with two branches */}
        {selectedComponent.type === 'ff_piece_two_branches' && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Abgang 2 Konfiguration
            </label>
            <div className="space-y-2 p-3 bg-gray-700 rounded">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Winkel (Grad)</label>
                <input
                  type="number"
                  value={selectedComponent.branch2?.angle || 90}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch2: {
                      ...(selectedComponent.branch2 || { position: 0.5, dn: selectedComponent.dn, length: 150 }),
                      angle: Number(e.target.value)
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                  min="0"
                  max="360"
                  step="15"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Position (0-1 entlang Hauptachse)</label>
                <input
                  type="number"
                  value={selectedComponent.branch2?.position || 0.5}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch2: {
                      ...(selectedComponent.branch2 || { angle: 90, dn: selectedComponent.dn, length: 150 }),
                      position: Number(e.target.value)
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">DN</label>
                <select
                  value={selectedComponent.branch2?.dn || selectedComponent.dn}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch2: {
                      ...(selectedComponent.branch2 || { angle: 90, position: 0.5, length: 150 }),
                      dn: Number(e.target.value) as DNValue
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                >
                  {template?.availableDNs.map((dn) => (
                    <option key={dn} value={dn}>
                      DN{dn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Länge (mm)</label>
                <input
                  type="number"
                  value={selectedComponent.branch2?.length || 150}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    branch2: {
                      ...(selectedComponent.branch2 || { angle: 90, position: 0.5, dn: selectedComponent.dn }),
                      length: Number(e.target.value)
                    }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
              </div>
            </div>
          </div>
        )}

        {(selectedComponent.type === 'straight' ||
          selectedComponent.type === 'f_piece' ||
          selectedComponent.type === 'ff_piece' ||
          selectedComponent.type === 'ff_piece_one_branch' ||
          selectedComponent.type === 'ff_piece_two_branches') && (
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
          </div>
        )}

        {(selectedComponent.type === 'tee' ||
          selectedComponent.type === 'ffft_symmetrical' ||
          selectedComponent.type === 'ffft_asymmetrical' ||
          selectedComponent.type === 'ffq_equal' ||
          selectedComponent.type === 'ffq_unequal' ||
          selectedComponent.type === 'fffor_one_branch' ||
          selectedComponent.type === 'fffrk_one_branch' ||
          selectedComponent.type === 'wye' ||
          selectedComponent.type === 'wye_angled' ||
          selectedComponent.type === 'union_straight' ||
          selectedComponent.type === 'union_angled') && (
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Schenkellängen (mm)
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Eingang (A - links)</label>
                <input
                  type="number"
                  value={selectedComponent.teeArmLengths?.inlet || selectedComponent.armLength || 200}
                  onChange={(e) => handleArmLengthChange('inlet', Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Ausgang (B - rechts)</label>
                <input
                  type="number"
                  value={selectedComponent.teeArmLengths?.outlet || selectedComponent.armLength || 200}
                  onChange={(e) => handleArmLengthChange('outlet', Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Abzweigung (C - oben)</label>
                <input
                  type="number"
                  value={selectedComponent.teeArmLengths?.branch || selectedComponent.armLength || 200}
                  onChange={(e) => handleArmLengthChange('branch', Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  min="50"
                  max="1000"
                  step="50"
                />
              </div>
            </div>
          </div>
        )}

        {(selectedComponent.type === 'elbow' ||
          selectedComponent.type === 'frk_equal' ||
          selectedComponent.type === 'frk_unequal') && (
          <>
            <div>
              <label className="text-gray-300 text-sm block mb-2">
                Winkel (Grad)
              </label>
              <input
                type="number"
                value={selectedComponent.angle || 90}
                onChange={(e) => handleElbowAngleChange(Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                min="15"
                max="180"
                step="15"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-2">
                Schenkellängen (mm)
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Eingang (A - unten)</label>
                  <input
                    type="number"
                    value={selectedComponent.elbowArmLengths?.inlet || (selectedComponent.dn / 2) * 3}
                    onChange={(e) => handleElbowArmLengthChange('inlet', Number(e.target.value))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    min="50"
                    max="1000"
                    step="50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Ausgang (B - gedreht)</label>
                  <input
                    type="number"
                    value={selectedComponent.elbowArmLengths?.outlet || (selectedComponent.dn / 2) * 3}
                    onChange={(e) => handleElbowArmLengthChange('outlet', Number(e.target.value))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    min="50"
                    max="1000"
                    step="50"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-gray-300 text-sm block mb-2">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="text-gray-400 text-xs">{axis.toUpperCase()}</label>
                <input
                  type="number"
                  value={selectedComponent.position[axis].toFixed(2)}
                  onChange={(e) =>
                    handlePositionChange(axis, Number(e.target.value))
                  }
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  step="0.1"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-300 text-sm">
              Rotation (Grad)
            </label>
            {rememberedRotationSelection !== null && (
              <button
                onClick={handleClearRotationSelection}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Auswahl aufheben
              </button>
            )}
          </div>
          {rememberedRotationSelection !== null && (
            <div className="mb-2 px-2 py-1 bg-blue-900 bg-opacity-30 border border-blue-500 rounded text-xs text-blue-300">
              ℹ️ Auswahl gemerkt ({rememberedRotationSelection.length} Komponenten)
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => {
              // Normalize rotation to 0-360 range for display
              let degrees = (selectedComponent.rotation[axis] * 180) / Math.PI
              degrees = degrees % 360
              if (degrees < 0) degrees += 360

              return (
                <div key={axis}>
                  <label className="text-gray-400 text-xs">{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={Math.round(degrees)}
                    onChange={(e) =>
                      handleRotationChange(axis, Number(e.target.value))
                    }
                    className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
                    step="15"
                    min="0"
                    max="360"
                  />
                </div>
              )
            })}
          </div>
        </div>

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

                {cp.connectedTo ? (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Verbindungsmethode:</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnectionMethodChange(cp.id, 'welded')}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          cp.connectionMethod === 'welded'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        geschweißt
                      </button>
                      <button
                        onClick={() => handleConnectionMethodChange(cp.id, 'flanged')}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          cp.connectionMethod === 'flanged'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        geflanscht
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">Nicht verbunden</div>
                )}
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

      {/* Rotation Dialog */}
      {rotationDialog && (
        <RotationDialog
          axis={rotationDialog.axis}
          oldValue={rotationDialog.oldValue}
          newValue={rotationDialog.newValue}
          connectedComponents={rotationDialog.connectedComponents}
          initialSelectedComponents={rememberedRotationSelection || undefined}
          onConfirm={rotationDialog.onConfirm}
          onCancel={() => setRotationDialog(null)}
          onRemember={handleRememberRotationSelection}
        />
      )}
    </div>
  )
}
