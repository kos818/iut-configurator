import React, { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { componentTemplates, componentGroupNames, ComponentGroup } from '../../data/componentTemplates'
import { ComponentTemplate } from '../../types'

interface QuickAddMenuProps {
  onSelect: (template: ComponentTemplate) => void
  onClose: () => void
}

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({
  onSelect,
  onClose,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<ComponentGroup | null>(null)

  // Get unique groups from templates
  const groups = Array.from(new Set(componentTemplates.map(t => t.group))) as ComponentGroup[]

  // Get filtered templates based on selected group
  const filteredTemplates = selectedGroup
    ? componentTemplates.filter(t => t.group === selectedGroup)
    : []

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
        {selectedGroup && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedGroup(null)
            }}
            className="text-white hover:bg-blue-700 rounded p-1 mr-1"
            title="Zurück"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <span className="flex-1">
          {selectedGroup ? componentGroupNames[selectedGroup] : 'Komponente auswählen'}
        </span>
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

      {/* Group selection */}
      {!selectedGroup && (
        <div className="overflow-y-auto max-h-80">
          {groups.map((group) => (
            <button
              key={group}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedGroup(group)
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{componentGroupNames[group]}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {componentTemplates.filter(t => t.group === group).length} Komponenten
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Component list */}
      {selectedGroup && (
        <div className="overflow-y-auto max-h-80">
          {filteredTemplates.map((template, index) => (
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
      )}
    </div>
  )
}
