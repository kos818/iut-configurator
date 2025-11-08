import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import { DNValue } from '../../types'
import { componentTemplates, materialMultipliers } from '../../data/componentTemplates'

interface ProjectSettingsDialogProps {
  onConfirm: (defaultMaterial: string, defaultDN: DNValue) => void
}

export const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
  onConfirm,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('steel')
  const [selectedDN, setSelectedDN] = useState<DNValue>(50)

  // Get all available DNs from the first template (they should be consistent)
  const availableDNs = componentTemplates[0]?.availableDNs || [20, 25, 32, 40, 50, 65, 80, 100, 125, 150]

  const handleConfirm = () => {
    onConfirm(selectedMaterial, selectedDN)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <Settings className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">
            Projekt-Einstellungen
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-700 leading-relaxed">
            Legen Sie die Standard-Vorgaben für Ihr Rohrleitungsprojekt fest.
            Diese Einstellungen gelten für alle neuen Komponenten.
          </p>

          {/* Material Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Standard-Material
            </label>
            <div className="space-y-2">
              {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                <label
                  key={material}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMaterial === material
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="material"
                    value={material}
                    checked={selectedMaterial === material}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {material === 'steel' && 'Stahl'}
                      {material === 'stainless' && 'Edelstahl'}
                      {material === 'copper' && 'Kupfer'}
                      {material === 'pvc' && 'PVC'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Preisfaktor: ×{multiplier}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* DN Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Standard-Nenndurchmesser (DN)
            </label>
            <select
              value={selectedDN}
              onChange={(e) => setSelectedDN(Number(e.target.value) as DNValue)}
              className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
            >
              {availableDNs.map((dn) => (
                <option key={dn} value={dn}>
                  DN{dn} ({dn}mm)
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Hinweis:</strong> Sie können diese Einstellungen für einzelne Komponenten
              später individuell anpassen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
          >
            Einstellungen übernehmen
          </button>
        </div>
      </div>
    </div>
  )
}
