import { Scene3D } from './components/3d/Scene3D'
import { ComponentSelector } from './components/ui/ComponentSelector'
import { ComponentList } from './components/ui/ComponentList'
import { PropertiesPanel } from './components/ui/PropertiesPanel'
import { PriceDisplay } from './components/ui/PriceDisplay'
import { Toolbar } from './components/ui/Toolbar'
import { ValidationPanel } from './components/ui/ValidationPanel'
import { ProjectSettingsDialog } from './components/ui/ProjectSettingsDialog'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useConfiguratorStore } from './store/useConfiguratorStore'
import { DNValue } from './types'

function App() {
  useKeyboardShortcuts()

  const projectSettings = useConfiguratorStore((state) => state.projectSettings)
  const setProjectSettings = useConfiguratorStore((state) => state.setProjectSettings)

  const handleProjectSettings = (material: string, dn: DNValue, wallThickness: number) => {
    setProjectSettings(material, dn, wallThickness)
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Rohr Konfigurator 3D</h1>
        <p className="text-gray-400 text-sm">
          Anlagenbau mit visueller Rohrplanung und Preiskalkulation
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left sidebar - Component selector */}
        <aside className="w-80 overflow-y-auto flex flex-col gap-4">
          <ComponentSelector />
          <ComponentList />
          <PropertiesPanel />
        </aside>

        {/* Center - 3D View */}
        <main className="flex-1 rounded-lg overflow-hidden shadow-lg">
          <Scene3D />
        </main>

        {/* Right sidebar - Price and actions */}
        <aside className="w-80 overflow-y-auto flex flex-col gap-4">
          <PriceDisplay />
          <Toolbar />
          <ValidationPanel />

          {/* Info panel */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-white font-bold mb-2">Anleitung</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Komponente links auswählen zum Hinzufügen</li>
              <li>• <span className="font-semibold">Drag & Drop</span> zum Verschieben</li>
              <li>• Nah an anderen Komponenten: <span className="text-orange-400">Snap-to-Connect</span></li>
              <li>• DN-Werte müssen kompatibel sein</li>
              <li>• Verbindungspunkte: Grün=verfügbar, Blau=verbunden, Orange=Snap</li>
              <li>• Material & Eigenschaften bearbeiten</li>
              <li>• Kamera mit rechter Maustaste drehen</li>
              <li>• Mausrad zum Zoomen</li>
              <li>• <span className="font-semibold">Strg+Z</span> = Rückgängig</li>
              <li>• <span className="font-semibold">Strg+Y</span> = Wiederherstellen</li>
              <li>• DXF Export für AutoCAD</li>
            </ul>
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
