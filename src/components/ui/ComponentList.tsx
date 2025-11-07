import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { Trash2, Circle } from 'lucide-react'

export const ComponentList: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)
  const removeComponent = useConfiguratorStore((state) => state.removeComponent)

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
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {components.map((component, index) => {
          const isSelected = component.id === selectedComponent
          const connectedCount = component.connectionPoints.filter(cp => cp.connectedTo !== null).length
          const totalCount = component.connectionPoints.length
          const weldedCount = component.connectionPoints.filter(cp => cp.connectionMethod === 'welded').length
          const flangedCount = component.connectionPoints.filter(cp => cp.connectionMethod === 'flanged').length

          return (
            <div
              key={component.id}
              onClick={() => selectComponent(component.id)}
              className={`
                p-3 rounded cursor-pointer transition-all
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
                      {flangedCount > 0 && ` • ${flangedCount} geflansch`}
                    </div>
                  </div>
                </div>
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
          )
        })}
      </div>
    </div>
  )
}
