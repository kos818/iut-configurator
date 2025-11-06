import React from 'react'
import { Vector3 } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates } from '../../data/componentTemplates'
import { ComponentTemplate } from '../../types'

export const ComponentSelector: React.FC = () => {
  const addComponent = useConfiguratorStore((state) => state.addComponent)
  const components = useConfiguratorStore((state) => state.components)

  const handleAddComponent = (template: ComponentTemplate) => {
    // Position new components slightly offset
    const offset = components.length * 0.5
    addComponent(template, new Vector3(offset, 0, 0))
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Komponenten</h2>
      <div className="space-y-2">
        {componentTemplates.map((template, index) => (
          <button
            key={index}
            onClick={() => handleAddComponent(template)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded transition-colors text-left"
          >
            <div className="font-semibold">{template.name}</div>
            <div className="text-sm text-gray-300">{template.description}</div>
            <div className="text-sm text-green-300 mt-1">
              ab {template.basePrice.toFixed(2)} €
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
