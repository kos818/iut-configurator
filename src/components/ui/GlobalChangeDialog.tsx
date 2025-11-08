import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface GlobalChangeDialogProps {
  changeType: 'material' | 'dn'
  oldValue: string | number
  newValue: string | number
  onConfirm: (applyGlobally: boolean) => void
  onCancel: () => void
}

export const GlobalChangeDialog: React.FC<GlobalChangeDialogProps> = ({
  changeType,
  oldValue,
  newValue,
  onConfirm,
  onCancel,
}) => {
  const formatValue = (type: 'material' | 'dn', value: string | number) => {
    if (type === 'material') {
      const materialNames: Record<string, string> = {
        steel: 'Stahl',
        stainless: 'Edelstahl',
        copper: 'Kupfer',
        pvc: 'PVC',
      }
      return materialNames[value as string] || value
    }
    return `DN${value}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-yellow-50">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Änderung anwenden
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Sie ändern {changeType === 'material' ? 'das Material' : 'den Nenndurchmesser'} von{' '}
            <strong className="text-gray-900">{formatValue(changeType, oldValue)}</strong> auf{' '}
            <strong className="text-blue-600">{formatValue(changeType, newValue)}</strong>.
          </p>

          <p className="text-gray-700">
            Möchten Sie diese Änderung auf alle Komponenten im Projekt anwenden?
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 Bei globaler Anwendung wird der {changeType === 'material' ? 'Material' : 'DN'}-Wert
              für alle bestehenden und zukünftigen Komponenten geändert.
            </p>
          </div>
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
            onClick={() => onConfirm(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
          >
            Nur diese Komponente
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Alle Komponenten
          </button>
        </div>
      </div>
    </div>
  )
}
