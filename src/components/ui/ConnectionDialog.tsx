import React, { useState } from 'react'
import { X, Link2, Circle } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ComponentTemplate, ConnectionMethod } from '../../types'

interface ConnectionDialogProps {
  template: ComponentTemplate
  onConfirm: (connectionPointId: string | null, defaultDN?: number, connectionMethod?: ConnectionMethod) => void
  onCancel: () => void
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  template,
  onConfirm,
  onCancel,
}) => {
  const components = useConfiguratorStore((state) => state.components)
  const [selectedConnectionPoint, setSelectedConnectionPoint] = useState<string | null>(null)
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('welded')

  // Get all available (unconnected) connection points
  const availableConnectionPoints = components.flatMap((component) =>
    component.connectionPoints
      .filter((cp) => cp.connectedTo === null)
      .map((cp) => ({
        ...cp,
        componentType: component.type,
        componentId: component.id,
      }))
  )

  const handleConfirm = () => {
    if (selectedConnectionPoint) {
      const cp = availableConnectionPoints.find((p) => p.id === selectedConnectionPoint)
      if (cp) {
        // Pass connection point ID, DN value, and connection method
        onConfirm(selectedConnectionPoint, cp.dn, connectionMethod)
        return
      }
    }
    // No connection selected - add freely
    onConfirm(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {template.name} hinzufügen
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Möchten Sie die neue Komponente an einen bestehenden Verbindungspunkt anschließen?
          </p>

          {/* Option: No connection */}
          <div className="mb-4">
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="connection"
                value="none"
                checked={selectedConnectionPoint === null}
                onChange={() => setSelectedConnectionPoint(null)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900">Nicht anschließen</div>
                <div className="text-xs text-gray-500">
                  Komponente frei im Raum platzieren
                </div>
              </div>
            </label>
          </div>

          {/* Connection Method Selection - only show if a connection point will be selected */}
          {selectedConnectionPoint && (
            <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Verbindungsmethode:
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="connectionMethod"
                    value="welded"
                    checked={connectionMethod === 'welded'}
                    onChange={() => setConnectionMethod('welded')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Schweißverbindung</div>
                    <div className="text-xs text-gray-600">Direktes Verschweißen</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="connectionMethod"
                    value="flanged"
                    checked={connectionMethod === 'flanged'}
                    onChange={() => setConnectionMethod('flanged')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Verflanschung</div>
                    <div className="text-xs text-gray-600">Mit Gegenflansch (automatisch hinzugefügt)</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Available connection points */}
          {availableConnectionPoints.length > 0 && (
            <>
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Verfügbare Verbindungspunkte:
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableConnectionPoints.map((cp) => (
                  <label
                    key={cp.id}
                    className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="connection"
                      value={cp.id}
                      checked={selectedConnectionPoint === cp.id}
                      onChange={() => setSelectedConnectionPoint(cp.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Circle className="w-3 h-3 text-green-500" fill="currentColor" />
                        <span className="font-bold text-blue-600">{cp.label}</span>
                        <span className="text-sm text-gray-600">
                          {cp.componentType.charAt(0).toUpperCase() + cp.componentType.slice(1)}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {cp.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        DN{cp.dn} • Komponente ID: {cp.componentId.slice(-8)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {availableConnectionPoints.length === 0 && (
            <div className="text-sm text-gray-500 italic py-4 text-center">
              Keine verfügbaren Verbindungspunkte vorhanden.
              <br />
              Fügen Sie Komponenten hinzu oder lösen Sie bestehende Verbindungen.
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
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
