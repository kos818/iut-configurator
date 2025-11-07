import React from 'react'
import { Vector3, Euler } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates, materialMultipliers } from '../../data/componentTemplates'
import { ConnectionMethod, ConnectionPoint } from '../../types'

export const PropertiesPanel: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedId = useConfiguratorStore((state) => state.selectedComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const removeComponent = useConfiguratorStore((state) => state.removeComponent)

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
    updateComponent(selectedComponent.id, { dn: newDN as any })
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
        // Both ends connected - move both connected components
        // Find the connected components for both ends
        const inletCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'A')
        const outletCP = selectedComponent.connectionPoints.find((cp: ConnectionPoint) => cp.label === 'B')

        if (!inletCP || !outletCP) return

        // Calculate offset for each side in local space
        // Inlet (A) at -length/2, Outlet (B) at +length/2
        // When extending, A moves down (-Y), B moves up (+Y)
        const halfLengthDiff = lengthDiff / 2

        // Calculate world space offsets for each end
        const inletOffset = new Vector3(0, -halfLengthDiff, 0)
        inletOffset.applyEuler(new Euler(
          selectedComponent.rotation.x,
          selectedComponent.rotation.y,
          selectedComponent.rotation.z
        ))

        const outletOffset = new Vector3(0, halfLengthDiff, 0)
        outletOffset.applyEuler(new Euler(
          selectedComponent.rotation.x,
          selectedComponent.rotation.y,
          selectedComponent.rotation.z
        ))

        // Helper function to move a component and all connected components recursively
        const moveComponentTree = (componentId: string, offset: Vector3, visitedIds: Set<string> = new Set()) => {
          if (visitedIds.has(componentId)) return
          visitedIds.add(componentId)

          const comp = components.find((c) => c.id === componentId)
          if (!comp) return

          // Move this component
          const newPos = comp.position.clone().add(offset)
          updateComponent(componentId, { position: newPos })

          // Recursively move all connected components except the original pipe
          comp.connectionPoints.forEach((cp: ConnectionPoint) => {
            if (cp.connectedTo && cp.connectedTo !== inletCP?.id && cp.connectedTo !== outletCP?.id) {
              // Find the component that owns this connection point
              const connectedComp = components.find((c) =>
                c.connectionPoints.some((p) => p.id === cp.connectedTo)
              )
              if (connectedComp && connectedComp.id !== selectedComponent.id) {
                moveComponentTree(connectedComp.id, offset, visitedIds)
              }
            }
          })
        }

        // Update the pipe length first
        updateComponent(selectedComponent.id, { length: newLength })

        // Move the inlet-connected component tree
        if (inletCP.connectedTo) {
          const inletConnectedComp = components.find((c) =>
            c.connectionPoints.some((cp) => cp.id === inletCP.connectedTo)
          )
          if (inletConnectedComp) {
            moveComponentTree(inletConnectedComp.id, inletOffset)
          }
        }

        // Move the outlet-connected component tree
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
    updateComponent(selectedComponent.id, { material: newMaterial })
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = selectedComponent.position.clone()
    newPosition[axis] = value
    updateComponent(selectedComponent.id, { position: newPosition })
  }

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRotation = selectedComponent.rotation.clone()
    newRotation[axis] = (value * Math.PI) / 180 // Convert to radians
    updateComponent(selectedComponent.id, { rotation: newRotation })
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
          <div className="text-white font-semibold">{template?.name}</div>
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
          </div>
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
          <label className="text-gray-300 text-sm block mb-2">
            Rotation (Grad)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="text-gray-400 text-xs">{axis.toUpperCase()}</label>
                <input
                  type="number"
                  value={Math.round(
                    (selectedComponent.rotation[axis] * 180) / Math.PI
                  )}
                  onChange={(e) =>
                    handleRotationChange(axis, Number(e.target.value))
                  }
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  step="15"
                />
              </div>
            ))}
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
    </div>
  )
}
