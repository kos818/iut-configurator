import React, { useState, useEffect } from 'react'
import {
  X,
  FileSpreadsheet,
  FileText,
  Mail,
  Save,
  Download,
  FileJson,
  Box,
  Loader2,
} from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { exportToCSV, exportToPDF } from '../../utils/bomExporter'
import { loadSavedEmail, saveEmail, openMailtoLink } from '../../utils/emailHelper'
import { exportToDXF, exportToJSON } from '../../utils/dxfExporter'

interface ExportDialogProps {
  onClose: () => void
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose }) => {
  const components = useConfiguratorStore((state) => state.components)
  const totalPrice = useConfiguratorStore((state) => state.totalPrice)

  const [email, setEmail] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [stepLoading, setStepLoading] = useState(false)
  const [stepProgress, setStepProgress] = useState('')
  const [stepError, setStepError] = useState('')

  const projectName = 'Rohrleitung'
  const hasComponents = components.length > 0

  useEffect(() => {
    setEmail(loadSavedEmail())
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSaveEmail = () => {
    saveEmail(email)
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2000)
  }

  const handleEmailExport = () => {
    if (!email) return
    // Download PDF first
    exportToPDF(components, projectName, totalPrice)
    // Then open mailto
    setTimeout(() => {
      openMailtoLink({
        to: email,
        projectName,
        componentCount: components.length,
        totalPrice,
      })
    }, 500)
  }

  const handleSTEPExport = async () => {
    setStepLoading(true)
    setStepError('')
    setStepProgress('OpenCASCADE wird geladen...')
    try {
      const { exportToSTEP } = await import('../../utils/stepExporter')
      await exportToSTEP(components, projectName, (progress: string) => {
        setStepProgress(progress)
      })
      setStepProgress('Export abgeschlossen!')
    } catch (err) {
      console.error('STEP export failed:', err)
      setStepError(
        err instanceof Error ? err.message : 'STEP-Export fehlgeschlagen'
      )
    } finally {
      setStepLoading(false)
    }
  }

  const btnBase =
    'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none'

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#002B50] to-[#0077C8] rounded-t-lg">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Export</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Stückliste */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              Stückliste
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => exportToCSV(components, projectName)}
                disabled={!hasComponents}
                className={btnBase}
                style={{ background: '#059669', color: '#fff' }}
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>
              <button
                onClick={() => exportToPDF(components, projectName, totalPrice)}
                disabled={!hasComponents}
                className={btnBase}
                style={{ background: '#dc2626', color: '#fff' }}
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: E-Mail */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              E-Mail-Versand
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empfaenger@firma.de"
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSaveEmail}
                className={btnBase}
                style={{
                  background: emailSaved ? '#059669' : '#f0f4f8',
                  color: emailSaved ? '#fff' : '#444e5d',
                  border: emailSaved ? 'none' : '1px solid #d5d9e0',
                }}
                title="E-Mail-Adresse speichern"
              >
                <Save size={16} />
                {emailSaved ? 'Gespeichert!' : 'Speichern'}
              </button>
            </div>
            <button
              onClick={handleEmailExport}
              disabled={!hasComponents || !email}
              className={btnBase}
              style={{ background: '#0077C8', color: '#fff' }}
            >
              <Mail size={16} />
              Herunterladen & E-Mail öffnen
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Die PDF-Stückliste wird heruntergeladen. Bitte hängen Sie die
              Datei manuell an die E-Mail an.
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Section 3: STEP-Export */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              STEP-Export (3D CAD)
            </h3>
            <button
              onClick={handleSTEPExport}
              disabled={!hasComponents || stepLoading}
              className={btnBase}
              style={{ background: '#7c3aed', color: '#fff' }}
            >
              {stepLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Box size={16} />
              )}
              {stepLoading ? 'Exportiere...' : 'STEP exportieren'}
            </button>
            {stepProgress && !stepError && (
              <p className="text-xs text-purple-600 mt-2">{stepProgress}</p>
            )}
            {stepError && (
              <p className="text-xs text-red-600 mt-2">{stepError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Erstmalig wird ~30 MB WASM-Modul geladen (danach gecacht).
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Section 4: Weitere Exporte */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              Weitere Exporte
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  exportToDXF(components, projectName)
                }}
                disabled={!hasComponents}
                className={btnBase}
                style={{
                  background: '#f0f4f8',
                  color: '#444e5d',
                  border: '1px solid #d5d9e0',
                }}
              >
                <Download size={16} />
                DXF
              </button>
              <button
                onClick={() => {
                  exportToJSON(components, projectName)
                }}
                disabled={!hasComponents}
                className={btnBase}
                style={{
                  background: '#f0f4f8',
                  color: '#444e5d',
                  border: '1px solid #d5d9e0',
                }}
              >
                <FileJson size={16} />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <span className="text-xs text-gray-500">
            {components.length} Komponenten | {totalPrice.toFixed(2)} €
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
