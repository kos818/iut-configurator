import React from 'react'
import { componentTemplates } from '../../data/componentTemplates'
import { ComponentTemplate } from '../../types'

interface QuickAddMenuProps {
  onSelect: (template: ComponentTemplate) => void
  onClose: () => void
}

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({
  onSelect,
  onClose,
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden"
      style={{
        minWidth: '250px',
        maxWidth: '300px',
        maxHeight: '400px',
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white px-3 py-2 font-semibold text-sm flex items-center justify-between">
        <span>Komponente auswählen</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="text-white hover:bg-blue-700 rounded px-2 py-1 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Component list */}
      <div className="overflow-y-auto max-h-80">
        {componentTemplates.map((template, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(template)
            }}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0"
          >
            <div className="font-semibold text-gray-900 text-sm">{template.name}</div>
            <div className="text-xs text-gray-600 mt-0.5">{template.description}</div>
            <div className="text-xs text-green-600 mt-1 font-medium">
              ab {template.basePrice.toFixed(2)} €
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
