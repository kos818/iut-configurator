import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates, materialMultipliers } from '../../data/componentTemplates'

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

  const handleDiameterChange = (newDiameter: number) => {
    updateComponent(selectedComponent.id, { diameter: newDiameter })
  }

  const handleLengthChange = (newLength: number) => {
    if (selectedComponent.type === 'straight') {
      updateComponent(selectedComponent.id, { length: newLength })
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
            Durchmesser (mm)
          </label>
          <select
            value={selectedComponent.diameter}
            onChange={(e) => handleDiameterChange(Number(e.target.value))}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          >
            {template?.availableDiameters.map((d) => (
              <option key={d} value={d}>
                {d} mm
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
