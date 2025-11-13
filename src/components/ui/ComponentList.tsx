import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { Trash2, Circle, Plus, Search } from 'lucide-react'
import { QuickAddMenu } from './QuickAddMenu'
import { ComponentTemplate, ConnectionPoint } from '../../types'

export const ComponentList: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)
  const removeComponent = useConfiguratorStore((state) => state.removeComponent)
  const setQuickAddConnectionPoint = useConfiguratorStore((state) => state.setQuickAddConnectionPoint)

  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [selectedConnectionPointForMenu, setSelectedConnectionPointForMenu] = useState<ConnectionPoint | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleQuickAdd = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedConnectionPointForMenu(null) // Reset the connection point when opening menu
    selectComponent(componentId)
  }

  const handleConnectionPointClick = (connectionPoint: ConnectionPoint, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedConnectionPointForMenu(connectionPoint)
    setQuickAddConnectionPoint(connectionPoint.id)
  }

  const validateTemplate = (template: ComponentTemplate) => {
    if (!selectedConnectionPointForMenu) {
      return { isValid: false, reason: 'Kein Verbindungspunkt ausgewählt' }
    }

    // Check DN compatibility
    if (template.defaultDN !== selectedConnectionPointForMenu.dn) {
      return {
        isValid: false,
        reason: `Inkompatibel: DN${template.defaultDN} passt nicht zu DN${selectedConnectionPointForMenu.dn}`
      }
    }

    // Check connection method compatibility
    // If connection point is flanged, the template should support flanges
    const templateConnectionMethod = template.type.includes('ff') || template.type.includes('flange')
      ? 'flanged'
      : 'welded'

    if (selectedConnectionPointForMenu.connectionMethod === 'flanged' && templateConnectionMethod === 'welded') {
      return {
        isValid: false,
        reason: 'Geflanschte Verbindung erfordert Flanschkomponente'
      }
    }

    return { isValid: true }
  }

  // Filter components based on search query
  const filteredComponents = components.filter((component) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      component.type.toLowerCase().includes(query) ||
      component.material.toLowerCase().includes(query) ||
      `dn${component.dn}`.includes(query) ||
      component.dn.toString().includes(query)
    )
  })

  if (components.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-2">Platzierte Komponenten</h2>
        <p className="text-gray-400 text-sm italic">Noch keine Komponenten hinzugefügt</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-2">Platzierte Komponenten</h2>

      {/* Search bar */}
      <div className="mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Komponente suchen..."
            className="w-full pl-10 pr-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredComponents.length === 0 && searchQuery ? (
          <div className="text-gray-400 text-sm italic text-center py-4">
            Keine Komponente gefunden
          </div>
        ) : (
          filteredComponents.map((component, index) => {
          const isSelected = component.id === selectedComponent
          const isHovered = hoveredComponent === component.id
          const connectedCount = component.connectionPoints.filter(cp => cp.connectedTo !== null).length
          const totalCount = component.connectionPoints.length
          const weldedCount = component.connectionPoints.filter(cp => cp.connectionMethod === 'welded').length
          const flangedCount = component.connectionPoints.filter(cp => cp.connectionMethod === 'flanged').length
          const hasAvailableConnections = component.connectionPoints.some(cp => cp.connectedTo === null)

          return (
            <div
              key={component.id}
              onClick={() => selectComponent(component.id)}
              onMouseEnter={() => setHoveredComponent(component.id)}
              onMouseLeave={() => setHoveredComponent(null)}
              className={`
                p-3 rounded cursor-pointer transition-all relative
                ${isSelected
                  ? 'bg-blue-600 ring-2 ring-blue-400 shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Circle
                    className={`w-3 h-3 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}
                    fill="currentColor"
                  />
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                      #{index + 1} {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                      DN{component.dn} • {component.material} • {component.price.toFixed(2)}€
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                      Verbindungen: {connectedCount}/{totalCount}
                      {weldedCount > 0 && ` • ${weldedCount} geschweißt`}
                      {flangedCount > 0 && ` • ${flangedCount} geflanscht`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Quick Add Button - shown on hover if there are available connections */}
                  {isHovered && hasAvailableConnections && (
                    <button
                      onClick={(e) => handleQuickAdd(component.id, e)}
                      className={`
                        p-1.5 rounded transition-colors
                        ${isSelected
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }
                      `}
                      title="Komponente hinzufügen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeComponent(component.id)
                    }}
                    className={`
                      p-1.5 rounded transition-colors
                      ${isSelected
                        ? 'hover:bg-blue-700 text-blue-100'
                        : 'hover:bg-gray-600 text-gray-400'
                      }
                    `}
                    title="Komponente löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Add Menu - Connection Point Selection or Component Selection */}
              {isSelected && !selectedConnectionPointForMenu && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-white text-xs font-semibold mb-2 px-2">
                    An welchen Punkt anschließen?
                  </div>
                  {component.connectionPoints
                    .filter(cp => cp.connectedTo === null)
                    .map((cp) => (
                      <button
                        key={cp.id}
                        onClick={(e) => handleConnectionPointClick(cp, e)}
                        className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                      >
                        📍 {cp.label} ({cp.type}) - DN{cp.dn}
                        {cp.connectionMethod === 'flanged' && ' • Flansch'}
                      </button>
                    ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      selectComponent(null)
                    }}
                    className="w-full text-center px-2 py-1 text-xs text-gray-500 hover:text-gray-300 mt-1"
                  >
                    Abbrechen
                  </button>
                </div>
              )}

              {/* QuickAddMenu - Component Selection with Validation */}
              {isSelected && selectedConnectionPointForMenu && (
                <div
                  className="absolute top-full left-0 mt-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QuickAddMenu
                    onSelect={(_template) => {
                      // Component will be added via ConnectionPointOverlay logic
                      setSelectedConnectionPointForMenu(null)
                      selectComponent(null)
                    }}
                    onClose={() => {
                      setSelectedConnectionPointForMenu(null)
                      setQuickAddConnectionPoint(null)
                      selectComponent(null)
                    }}
                    validateTemplate={validateTemplate}
                  />
                </div>
              )}
            </div>
          )
        })
        )}
      </div>
    </div>
  )
}
