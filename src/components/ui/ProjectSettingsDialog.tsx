import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import { DNValue, PNValue, ConnectionMethod } from '../../types'
import { componentTemplates, materialMultipliers } from '../../data/componentTemplates'

interface ProjectSettingsDialogProps {
  onConfirm: (defaultMaterial: string, defaultDN: DNValue, defaultPN: PNValue, defaultWallThickness: number, defaultConnectionMethod: ConnectionMethod) => void
}

export const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
  onConfirm,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('steel')
  const [selectedDN, setSelectedDN] = useState<DNValue>(50)
  const [selectedPN, setSelectedPN] = useState<PNValue>(16)
  const [selectedWallThickness, setSelectedWallThickness] = useState<number>(3)
  const [selectedConnectionMethod, setSelectedConnectionMethod] = useState<ConnectionMethod>('welded')

  // Get all available DNs from the first template (they should be consistent)
  const availableDNs = componentTemplates[0]?.availableDNs || [20, 25, 32, 40, 50, 65, 80, 100, 125, 150]

  // Available PN values
  const availablePNs: PNValue[] = [6, 10, 16, 25, 40]

  // Available wall thicknesses (common standard values)
  const availableWallThicknesses = [2, 2.5, 3, 4, 5, 6]

  // Material names for display
  const materialNames: Record<string, string> = {
    steel: 'Stahl',
    stainless_v2a: 'V2A Edelstahl (1.4301 / A304L)',
    stainless_v4a: 'V4A Edelstahl (1.4401 / A316L)',
  }

  const handleConfirm = () => {
    onConfirm(selectedMaterial, selectedDN, selectedPN, selectedWallThickness, selectedConnectionMethod)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
          <Settings className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">
            Projekt-Einstellungen
          </h2>
        </div>

        {/* Content - with scrollbar */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <p className="text-gray-700 leading-relaxed">
            Legen Sie die Standard-Vorgaben für Ihr Rohrleitungsprojekt fest.
            Diese Einstellungen gelten für alle neuen Komponenten.
          </p>

          {/* Material Selection - Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Standard-Material
            </label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
            >
              {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                <option key={material} value={material}>
                  {materialNames[material]} (Preisfaktor: ×{multiplier})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Der Preisfaktor wird auf alle Komponenten-Preise angewendet
            </p>
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

          {/* PN Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Standard-Nenndruck (PN)
            </label>
            <select
              value={selectedPN}
              onChange={(e) => setSelectedPN(Number(e.target.value) as PNValue)}
              className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
            >
              {availablePNs.map((pn) => (
                <option key={pn} value={pn}>
                  PN{pn} ({pn} bar)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Der Nenndruck gibt die maximale Druckbelastung bei 20°C an
            </p>
          </div>

          {/* Wall Thickness Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Standard-Wandstärke / Rohrdicke (mm)
            </label>
            <select
              value={selectedWallThickness}
              onChange={(e) => setSelectedWallThickness(Number(e.target.value))}
              className="w-full bg-white border-2 border-gray-200 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
            >
              {availableWallThicknesses.map((thickness) => (
                <option key={thickness} value={thickness}>
                  {thickness} mm
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Die Wandstärke beeinflusst Gewicht, Stabilität und Preis der Rohre
            </p>
          </div>

          {/* Connection Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Standard-Verbindungsmethode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedConnectionMethod('welded')}
                className={`flex-1 px-4 py-3 text-sm rounded-lg font-medium transition-colors border-2 ${
                  selectedConnectionMethod === 'welded'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                geschweißt
              </button>
              <button
                onClick={() => setSelectedConnectionMethod('flanged')}
                className={`flex-1 px-4 py-3 text-sm rounded-lg font-medium transition-colors border-2 ${
                  selectedConnectionMethod === 'flanged'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                geflancht
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Legt fest, ob neue Komponenten standardmäßig geschweißt oder geflancht verbunden werden
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Hinweis:</strong> Sie können diese Einstellungen für einzelne Komponenten
              später individuell anpassen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
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
