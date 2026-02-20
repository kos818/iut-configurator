import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Search, AlertCircle } from 'lucide-react'
import { componentTemplates, componentGroupNames, ComponentGroup } from '../../data/componentTemplates'
import { ComponentTemplate } from '../../types'

interface QuickAddMenuProps {
  onSelect: (template: ComponentTemplate) => void
  onClose: () => void
  validateTemplate?: (template: ComponentTemplate) => { isValid: boolean; reason?: string } | null
}

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({
  onSelect,
  onClose,
  validateTemplate,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<ComponentGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Get unique groups from templates
  const groups = Array.from(new Set(componentTemplates.map(t => t.group))) as ComponentGroup[]

  // Get filtered templates based on selected group and search query
  const filteredTemplates = selectedGroup
    ? componentTemplates.filter(t => {
        if (t.group !== selectedGroup) return false
        if (!searchQuery) return true

        const query = searchQuery.toLowerCase()
        return (
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
        )
      })
    : []

  // If in search mode without a group selected, show all matching templates
  const searchResults = !selectedGroup && searchQuery
    ? componentTemplates.filter(t => {
        const query = searchQuery.toLowerCase()
        return (
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
        )
      })
    : []

  // Helper function to render a template button with validation
  const renderTemplateButton = (template: ComponentTemplate, index: number, showGroup: boolean = false) => {
    const validation = validateTemplate ? validateTemplate(template) : null
    const isDisabled = validation !== null && !validation.isValid

    return (
      <button
        key={index}
        onClick={(e) => {
          e.stopPropagation()
          if (!isDisabled) {
            onSelect(template)
          }
        }}
        disabled={isDisabled}
        className={`
          w-full text-left px-2 py-1.5 transition-colors border-b border-gray-200 last:border-b-0
          ${isDisabled
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : 'hover:bg-blue-50 cursor-pointer'
          }
        `}
      >
        <div className={`font-semibold text-xs leading-tight ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
          {template.name}
        </div>
        <div className={`leading-tight ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: '10px' }}>
          {template.description}
        </div>
        {showGroup && (
          <div className={`text-xs leading-tight ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontSize: '10px' }}>
            {componentGroupNames[template.group as ComponentGroup]}
          </div>
        )}
        {isDisabled && validation?.reason && (
          <div className="flex items-center gap-1 mt-1 text-red-600" style={{ fontSize: '10px' }}>
            <AlertCircle size={10} className="flex-shrink-0" />
            <span className="leading-tight">{validation.reason}</span>
          </div>
        )}
        {!isDisabled && (
          <div className="text-green-600 font-semibold leading-tight" style={{ fontSize: '10px' }}>
            {template.basePrice.toFixed(2)} €
          </div>
        )}
      </button>
    )
  }

  return (
    <div
      className="bg-white rounded-md shadow-2xl border-2 border-blue-500 flex flex-col"
      style={{
        width: '240px',
        maxHeight: '400px',
        pointerEvents: 'auto',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontSize: '13px',
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white px-2 py-1.5 font-semibold flex items-center justify-between sticky top-0 z-10 text-xs">
        {selectedGroup && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedGroup(null)
              setSearchQuery('')
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

      {/* Search bar */}
      <div className="px-2 py-2 bg-gray-50 border-b border-gray-200">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Komponente suchen..."
            className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Entire menu with scrollbar */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '320px' }}>
        {/* Group selection */}
        {!selectedGroup && !searchQuery && (
          <div>
            {groups.map((group) => (
              <button
                key={group}
                onClick={(e) => {
                  e.stopPropagation()
                  const groupTemplates = componentTemplates.filter(t => t.group === group)
                  if (groupTemplates.length === 1) {
                    onSelect(groupTemplates[0])
                  } else {
                    setSelectedGroup(group)
                  }
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

        {/* Search results (when searching without group selected) */}
        {!selectedGroup && searchQuery && (
          <div>
            {searchResults.length > 0 ? (
              searchResults.map((template, index) => renderTemplateButton(template, index, true))
            ) : (
              <div className="px-2 py-4 text-center text-gray-500 text-xs">
                Keine Komponente gefunden
              </div>
            )}
          </div>
        )}

        {/* Component list (when group is selected) */}
        {selectedGroup && (
          <div>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template, index) => renderTemplateButton(template, index, false))
            ) : (
              <div className="px-2 py-4 text-center text-gray-500 text-xs">
                Keine passende Komponente gefunden
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
