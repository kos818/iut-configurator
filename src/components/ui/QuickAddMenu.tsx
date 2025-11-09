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
      className="bg-white rounded-md shadow-2xl border border-blue-500 flex flex-col"
      style={{
        width: '200px',
        maxHeight: '320px',
        pointerEvents: 'auto',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontSize: '12px',
        transform: 'scale(1)',
        transformOrigin: 'center',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Entire menu with scrollbar */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '320px' }}>
        {/* Header */}
        <div className="bg-blue-600 text-white px-2 py-1.5 font-semibold flex items-center justify-between sticky top-0 z-10 text-xs">
          {selectedGroup && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedGroup(null)
              }}
              className="text-white hover:bg-blue-700 rounded p-0.5 mr-1 flex-shrink-0"
              title="Zurück"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          <span className="flex-1 leading-tight truncate">
            {selectedGroup ? componentGroupNames[selectedGroup] : 'Komponente wählen'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="text-white hover:bg-blue-700 rounded px-1.5 py-0.5 ml-1 flex-shrink-0 text-xs"
          >
            ✕
          </button>
        </div>

        {/* Group selection */}
        {!selectedGroup && (
          <div>
            {groups.map((group) => (
              <button
                key={group}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedGroup(group)
                }}
                className="w-full text-left px-2 py-2 hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center justify-between"
              >
                <div className="flex-1 pr-1">
                  <div className="font-semibold text-gray-900 text-xs leading-tight">
                    {componentGroupNames[group]}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight" style={{ fontSize: '10px' }}>
                    {componentTemplates.filter(t => t.group === group).length} Stück
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Component list */}
        {selectedGroup && (
          <div>
            {filteredTemplates.map((template, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(template)
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0"
              >
                <div className="font-semibold text-gray-900 text-xs leading-tight">
                  {template.name}
                </div>
                <div className="text-gray-600 leading-tight" style={{ fontSize: '10px' }}>
                  {template.description}
                </div>
                <div className="text-green-600 font-semibold leading-tight" style={{ fontSize: '10px' }}>
                  {template.basePrice.toFixed(2)} €
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
