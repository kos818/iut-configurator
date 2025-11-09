import React, { useState } from 'react'
import { RotateCw } from 'lucide-react'

interface ConnectedComponentInfo {
  id: string
  name: string
  type: string
}

interface RotationDialogProps {
  axis: 'x' | 'y' | 'z'
  oldValue: number
  newValue: number
  connectedComponents: ConnectedComponentInfo[]
  onConfirm: (rotateConnected: boolean, selectedComponentIds: string[]) => void
  onCancel: () => void
}

export const RotationDialog: React.FC<RotationDialogProps> = ({
  axis,
  oldValue,
  newValue,
  connectedComponents,
  onConfirm,
  onCancel,
}) => {
  // Track which connected components should be rotated
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(
    new Set(connectedComponents.map(c => c.id))
  )

  const toggleComponent = (id: string) => {
    const newSet = new Set(selectedComponents)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedComponents(newSet)
  }

  const toggleAll = () => {
    if (selectedComponents.size === connectedComponents.length) {
      setSelectedComponents(new Set())
    } else {
      setSelectedComponents(new Set(connectedComponents.map(c => c.id)))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-blue-50">
          <RotateCw className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Rotation anwenden
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Sie ändern die Rotation um die <strong className="text-gray-900">{axis.toUpperCase()}-Achse</strong> von{' '}
            <strong className="text-gray-900">{Math.round(oldValue)}°</strong> auf{' '}
            <strong className="text-blue-600">{Math.round(newValue)}°</strong>.
          </p>

          {connectedComponents.length > 0 ? (
            <>
              <p className="text-gray-700">
                Sollen verbundene Elemente mitgedreht werden?
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Verbundene Komponenten ({connectedComponents.length})
                  </label>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedComponents.size === connectedComponents.length ? 'Keine auswählen' : 'Alle auswählen'}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {connectedComponents.map((comp) => (
                    <label
                      key={comp.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedComponents.has(comp.id)}
                        onChange={() => toggleComponent(comp.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{comp.name}</div>
                        <div className="text-xs text-gray-500">{comp.type}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Ausgewählte Komponenten werden um die gedrehte Komponente rotiert und behalten ihre relative Position bei.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                ℹ️ Keine verbundenen Komponenten gefunden.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirm(false, [])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
          >
            Nur dieses Element
          </button>
          {connectedComponents.length > 0 && (
            <button
              onClick={() => onConfirm(true, Array.from(selectedComponents))}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              disabled={selectedComponents.size === 0}
            >
              Ausgewählte mitdrehen ({selectedComponents.size})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
