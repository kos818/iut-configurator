import { Scene3D } from './components/3d/Scene3D'
import { ComponentSelector } from './components/ui/ComponentSelector'
import { ComponentList } from './components/ui/ComponentList'
import { PropertiesPanel } from './components/ui/PropertiesPanel'
import { PriceDisplay } from './components/ui/PriceDisplay'
import { Toolbar } from './components/ui/Toolbar'
import { ValidationPanel } from './components/ui/ValidationPanel'
import { ProjectSettingsDialog } from './components/ui/ProjectSettingsDialog'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCADStoreSync } from './hooks/useCADStoreSync'
import { useConfiguratorStore } from './store/useConfiguratorStore'
import { DNValue, PNValue, ConnectionMethod } from './types'

function App() {
  useKeyboardShortcuts()
  useCADStoreSync()

  const projectSettings = useConfiguratorStore((state) => state.projectSettings)
  const setProjectSettings = useConfiguratorStore((state) => state.setProjectSettings)
  const handleProjectSettings = (material: string, dn: DNValue, pn: PNValue, wallThickness: number, connectionMethod: ConnectionMethod) => {
    setProjectSettings(material, dn, pn, wallThickness, connectionMethod)
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#f0f4f8' }}>
      {/* IUT Corporate Header */}
      <header className="iut-header text-white px-6 py-0 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img
            src="https://www.iut-gmbh.de/wp-content/uploads/2022/04/IUT-Logo-gros-e1651159578588.png"
            alt="IUT GmbH"
            className="h-14 my-2"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="h-10 w-px bg-white/20"></div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: '#fff' }}>
              Rohr Konfigurator 3D
            </h1>
            <p className="text-xs font-light tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Anlagenbau &middot; Rohrplanung &middot; Preiskalkulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <span>IUT &ndash; Innovative Umwelttechnik GmbH</span>
          <span className="w-1 h-1 rounded-full bg-white/40"></span>
          <span>info@iut-gmbh.de</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Left sidebar - Component selector */}
        <aside className="w-80 flex flex-col gap-2 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-steel-200 flex-shrink-0">
            <ComponentSelector />
          </div>
          <PropertiesPanel />
          <ComponentList />
        </aside>

        {/* Center - 3D View */}
        <main className="flex-1 rounded-xl overflow-hidden shadow-sm border-2 border-steel-200">
          <Scene3D />
        </main>

        {/* Right sidebar - Price and actions */}
        <aside className="w-80 overflow-y-auto flex flex-col gap-3">
          <PriceDisplay />
          <Toolbar />
          <ValidationPanel />

          {/* Info panel */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-steel-200">
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider" style={{ color: '#004B87' }}>
              Bedienung
            </h3>
            <div className="space-y-2 text-sm" style={{ color: '#535f72' }}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0077C8' }}></span>
                <span>Komponente links auswählen zum Hinzufügen</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0077C8' }}></span>
                <span><strong>Drag &amp; Drop</strong> zum Verschieben</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0077C8' }}></span>
                <span>Snap-to-Connect bei Annäherung</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0077C8' }}></span>
                <span>Rechtsklick + Ziehen = Kamera drehen</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0077C8' }}></span>
                <span>Mausrad zum Zoomen</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0077C8' }}></span>
                <span><strong>Strg+Z</strong> / <strong>Strg+Y</strong> = Undo/Redo</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Project Settings Dialog - shown on first load */}
      {!projectSettings.isConfigured && (
        <ProjectSettingsDialog onConfirm={handleProjectSettings} />
      )}
    </div>
  )
}

export default App
