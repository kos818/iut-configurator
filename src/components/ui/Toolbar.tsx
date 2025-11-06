import React from 'react'
import { Download, Trash2, FileJson, Undo, Redo } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { exportToDXF, exportToJSON } from '../../utils/dxfExporter'

export const Toolbar: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const clearAll = useConfiguratorStore((state) => state.clearAll)
  const undo = useConfiguratorStore((state) => state.undo)
  const redo = useConfiguratorStore((state) => state.redo)
  const canUndo = useConfiguratorStore((state) => state.canUndo())
  const canRedo = useConfiguratorStore((state) => state.canRedo())

  const handleExportDXF = () => {
    if (components.length === 0) {
      alert('Keine Komponenten zum Exportieren vorhanden')
      return
    }
    exportToDXF(components, 'Rohrleitung')
    alert('DXF-Datei erfolgreich exportiert!')
  }

  const handleExportJSON = () => {
    if (components.length === 0) {
      alert('Keine Komponenten zum Exportieren vorhanden')
      return
    }
    exportToJSON(components, 'Rohrleitung')
    alert('Projekt als JSON gespeichert!')
  }

  const handleClearAll = () => {
    if (components.length === 0) return
    if (confirm('Möchten Sie wirklich alle Komponenten löschen?')) {
      clearAll()
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex gap-2 flex-wrap">
      <button
        onClick={undo}
        disabled={!canUndo}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Rückgängig (Strg+Z)"
      >
        <Undo size={18} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Wiederherstellen (Strg+Y)"
      >
        <Redo size={18} />
      </button>

      <div className="w-px bg-gray-600"></div>

      <button
        onClick={handleExportDXF}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        title="Export nach AutoCAD DXF"
      >
        <Download size={18} />
        <span>DXF Export</span>
      </button>

      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        title="Projekt speichern"
      >
        <FileJson size={18} />
        <span>Projekt speichern</span>
      </button>

      <button
        onClick={handleClearAll}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
        title="Alle löschen"
        disabled={components.length === 0}
      >
        <Trash2 size={18} />
        <span>Alle löschen</span>
      </button>

      <div className="ml-auto text-gray-400 text-sm flex items-center">
        Rechtsklick + Ziehen = Kamera drehen | Mausrad = Zoom
      </div>
    </div>
  )
}
