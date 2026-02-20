import React, { useState } from 'react'
import { Download, Trash2, Undo, Redo } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ExportDialog } from './ExportDialog'

export const Toolbar: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const clearAll = useConfiguratorStore((state) => state.clearAll)
  const undo = useConfiguratorStore((state) => state.undo)
  const redo = useConfiguratorStore((state) => state.redo)
  const canUndo = useConfiguratorStore((state) => state.canUndo())
  const canRedo = useConfiguratorStore((state) => state.canRedo())

  const [showExportDialog, setShowExportDialog] = useState(false)

  const handleClearAll = () => {
    if (components.length === 0) return
    if (confirm('Möchten Sie wirklich alle Komponenten löschen?')) {
      clearAll()
    }
  }

  return (
    <>
      <div className="bg-white p-3 rounded-xl shadow-sm border border-steel-200 flex gap-2 flex-wrap">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canUndo ? '#f0f4f8' : '#f6f7f8',
            color: '#444e5d',
            border: '1px solid #d5d9e0',
          }}
          title="Rückgängig (Strg+Z)"
        >
          <Undo size={16} />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canRedo ? '#f0f4f8' : '#f6f7f8',
            color: '#444e5d',
            border: '1px solid #d5d9e0',
          }}
          title="Wiederherstellen (Strg+Y)"
        >
          <Redo size={16} />
        </button>

        <div className="w-px" style={{ background: '#d5d9e0' }}></div>

        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold text-sm hover:shadow-md"
          style={{ background: '#0077C8', color: '#fff' }}
          title="Export-Optionen öffnen"
        >
          <Download size={16} />
          <span>Export</span>
        </button>

        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
          style={{
            background: components.length > 0 ? '#fef2f2' : '#f6f7f8',
            color: components.length > 0 ? '#dc2626' : '#8693a5',
            border: `1px solid ${components.length > 0 ? '#fecaca' : '#d5d9e0'}`,
          }}
          title="Alle löschen"
          disabled={components.length === 0}
        >
          <Trash2 size={16} />
          <span>Alle löschen</span>
        </button>

        <div className="ml-auto text-xs flex items-center" style={{ color: '#8693a5' }}>
          Rechtsklick + Ziehen = Kamera drehen | Mausrad = Zoom
        </div>
      </div>

      {showExportDialog && (
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      )}
    </>
  )
}
