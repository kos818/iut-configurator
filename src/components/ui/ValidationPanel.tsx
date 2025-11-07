import React, { useEffect, useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { validateConfiguration, ValidationIssue } from '../../utils/validator'
import { AlertTriangle, XCircle, Info } from 'lucide-react'

export const ValidationPanel: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectComponent = useConfiguratorStore((state) => state.selectComponent)
  const [issues, setIssues] = useState<ValidationIssue[]>([])

  useEffect(() => {
    const validationIssues = validateConfiguration(components)
    setIssues(validationIssues)
  }, [components])

  // Group issues by component
  const groupedIssues = issues.reduce((acc, issue) => {
    const component = components.find(c => c.id === issue.componentId)
    if (component) {
      const key = issue.componentId
      if (!acc[key]) {
        acc[key] = {
          component,
          errors: [],
          warnings: [],
        }
      }
      if (issue.type === 'error') {
        acc[key].errors.push(issue)
      } else {
        acc[key].warnings.push(issue)
      }
    }
    return acc
  }, {} as Record<string, { component: any; errors: ValidationIssue[]; warnings: ValidationIssue[] }>)

  const errorCount = issues.filter(i => i.type === 'error').length
  const warningCount = issues.filter(i => i.type === 'warning').length

  if (issues.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <Info className="w-5 h-5 text-green-600" />
        <span className="text-green-800 text-sm font-medium">
          Keine Validierungsprobleme
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          Validierung
          {errorCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">
              {errorCount} Fehler
            </span>
          )}
          {warningCount > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
              {warningCount} Warnung{warningCount > 1 ? 'en' : ''}
            </span>
          )}
        </h3>
      </div>

      <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
        {Object.entries(groupedIssues).map(([componentId, { component, errors, warnings }]) => (
          <div
            key={componentId}
            className="border border-gray-200 rounded p-2 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => selectComponent(componentId)}
          >
            <div className="font-medium text-sm text-gray-900 mb-1">
              {component.type.charAt(0).toUpperCase() + component.type.slice(1)} (DN{component.dn})
            </div>

            {errors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-red-700 mb-1">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            ))}

            {warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-yellow-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
