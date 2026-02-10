import React, { useState, useEffect } from 'react'
import { Vector3, Euler } from 'three'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates, componentGroupNames, componentGroupDescriptions, ComponentGroup } from '../../data/componentTemplates'
import { ComponentTemplate, DNValue, ConnectionPoint, PipeComponent, ConnectionMethod } from '../../types'
import { ConnectionDialog } from './ConnectionDialog'
import { getWorldPosition, getWorldDirection, generateConnectionPoints } from '../../utils/connectionHelpers'
import { calculateConnectionRotation } from '../../utils/rotationHelpers'

export const ComponentSelector: React.FC = () => {
  const addComponent = useConfiguratorStore((state) => state.addComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)
  const quickAddConnectionPointId = useConfiguratorStore((state) => state.quickAddConnectionPointId)
  const setQuickAddConnectionPoint = useConfiguratorStore((state) => state.setQuickAddConnectionPoint)

  const [dialogTemplate, setDialogTemplate] = useState<ComponentTemplate | null>(null)
  const [preselectedConnectionPointId, setPreselectedConnectionPointId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<ComponentGroup | null>(null)

  // Get unique groups from templates
  const groups = Array.from(new Set(componentTemplates.map(t => t.group))) as ComponentGroup[]

  // Auto-open dialog when quick add is triggered
  useEffect(() => {
    if (quickAddConnectionPointId) {
      // Use the first template as default for quick add (can be improved)
      setDialogTemplate(componentTemplates[0])
      setPreselectedConnectionPointId(quickAddConnectionPointId)
      setQuickAddConnectionPoint(null) // Clear the trigger
    }
  }, [quickAddConnectionPointId, setQuickAddConnectionPoint])

  const handleComponentClick = (template: ComponentTemplate) => {
    // If no components exist yet, add first one directly without dialog
    if (components.length === 0) {
      addComponent(template, new Vector3(0, 0, 0))
      return
    }

    // Check if there's a selected component with available connection points
    const selectedComp = components.find((c) => c.id === selectedComponent)
    if (selectedComp) {
      const availableCPs = selectedComp.connectionPoints.filter((cp) => cp.connectedTo === null)

      // If selected component has available connection points, preselect the first one
      if (availableCPs.length > 0) {
        setPreselectedConnectionPointId(availableCPs[0].id)
      }
    }

    // Show dialog to choose connection
    setDialogTemplate(template)
  }

  const handleDialogConfirm = (connectionPointId: string | null, defaultDN?: number, connectionMethod?: ConnectionMethod, newComponentCPIndex: number = 0) => {
    if (!dialogTemplate) return

    // Use preselected connection point if provided
    const finalConnectionPointId = connectionPointId || preselectedConnectionPointId

    if (finalConnectionPointId && defaultDN) {
      // Find the connection point and component
      let targetCP: any = null
      let targetComponent: any = null

      for (const comp of components) {
        const cp = comp.connectionPoints.find((p) => p.id === finalConnectionPointId)
        if (cp) {
          targetCP = cp
          targetComponent = comp
          break
        }
      }

      if (targetCP && targetComponent) {
        // Create new component with DN from target connection point
        const templateWithDN = { ...dialogTemplate, defaultDN: defaultDN as DNValue }

        // Calculate position: place new component at target connection point
        const targetWorldPos = getWorldPosition(targetComponent, targetCP)

        // Create a temporary component to calculate its default connection point direction and position
        const tempComponent: Partial<PipeComponent> = {
          id: 'temp',
          type: templateWithDN.type,
          position: new Vector3(0, 0, 0),
          rotation: new Vector3(0, 0, 0),
          dn: templateWithDN.defaultDN,
          length: templateWithDN.defaultLength,
          angle: templateWithDN.defaultAngle,
          armLength: templateWithDN.defaultArmLength,
          teeArmLengths: templateWithDN.defaultTeeArmLengths,
          elbowArmLengths: templateWithDN.defaultElbowArmLengths,
          price: 0,
          material: templateWithDN.material,
          connectionPoints: [],
          isValid: true,
          validationMessages: [],
        }
        const tempCPs = generateConnectionPoints(tempComponent as PipeComponent)
        // Use the selected connection point index instead of always using first (0)
        const selectedCP = tempCPs.length > newComponentCPIndex ? tempCPs[newComponentCPIndex] : tempCPs[0]
        const selectedCPDirection = selectedCP ? selectedCP.direction : new Vector3(0, 1, 0)
        const selectedCPPosition = selectedCP ? selectedCP.position : new Vector3(0, 0, 0)

        // Get world direction of target connection point
        const targetWorldDirection = getWorldDirection(targetComponent, targetCP)

        // Calculate rotation to align new component with target
        const rotation = calculateConnectionRotation(targetWorldDirection, selectedCPDirection)

        // Apply rotation to the connection point position to get the offset in world space
        // We need to rotate the CP position by the calculated rotation
        const rotatedCPOffset = selectedCPPosition.clone()
        rotatedCPOffset.applyEuler(new Euler(rotation.x, rotation.y, rotation.z))

        // Calculate the actual component position: target position minus the rotated CP offset
        const actualPosition = targetWorldPos.clone().sub(rotatedCPOffset)

        // Add component at corrected position with calculated rotation
        const newComponentId = addComponent(templateWithDN, actualPosition)

        // Apply rotation and connections immediately (not in setTimeout to avoid timing issues)
        const allComponents = useConfiguratorStore.getState().components
        const newComponent = allComponents.find(c => c.id === newComponentId)

        if (newComponent && newComponent.connectionPoints.length > newComponentCPIndex) {
          const newCP = newComponent.connectionPoints[newComponentCPIndex] // Use selected connection point

          // Apply rotation and mark both connection points as connected
          updateComponent(newComponent.id, {
            rotation,
            connectionPoints: newComponent.connectionPoints.map((cp: ConnectionPoint) =>
              cp.id === newCP.id ? { ...cp, connectedTo: targetCP.id, connectionMethod } : cp
            )
          })

          updateComponent(targetComponent.id, {
            connectionPoints: targetComponent.connectionPoints.map((cp: ConnectionPoint) =>
              cp.id === targetCP.id ? { ...cp, connectedTo: newCP.id, connectionMethod } : cp
            )
          })
        }
      }
    } else {
      // Add component freely with offset
      const offset = components.length * 0.5
      addComponent(dialogTemplate, new Vector3(offset, 0, 0))
    }

    setDialogTemplate(null)
    setPreselectedConnectionPointId(null)
  }

  const handleDialogCancel = () => {
    setDialogTemplate(null)
    setPreselectedConnectionPointId(null)
  }

  // Get filtered templates based on selected group
  const filteredTemplates = selectedGroup
    ? componentTemplates.filter(t => t.group === selectedGroup)
    : []

  return (
    <>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col" style={{ maxHeight: '90vh' }}>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
          {selectedGroup && (
            <button
              onClick={() => setSelectedGroup(null)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Zurück zur Gruppenauswahl"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <span>
            {selectedGroup ? componentGroupNames[selectedGroup] : 'Komponenten'}
          </span>
        </h2>

        {/* Show groups if no group selected */}
        {!selectedGroup && (
          <div className="space-y-2 overflow-y-auto">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-4 rounded-lg transition-all text-left flex items-center justify-between group shadow-md"
              >
                <div className="flex-1">
                  <div className="font-bold text-lg">{componentGroupNames[group]}</div>
                  <div className="text-sm text-blue-200 mt-1">
                    {componentGroupDescriptions[group]}
                  </div>
                  <div className="text-xs text-blue-300 mt-1">
                    {componentTemplates.filter(t => t.group === group).length} Komponenten
                  </div>
                </div>
                <ChevronRight
                  size={24}
                  className="text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all"
                />
              </button>
            ))}
          </div>
        )}

        {/* Show components when group is selected */}
        {selectedGroup && (
          <div className="space-y-2 overflow-y-auto">
            <div className="text-sm text-gray-400 mb-3">
              {componentGroupDescriptions[selectedGroup]}
            </div>
            {filteredTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleComponentClick(template)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded transition-colors text-left shadow-sm"
              >
                <div className="font-semibold">{template.name}</div>
                <div className="text-sm text-gray-300">{template.description}</div>
                <div className="text-sm text-green-300 mt-1">
                  ab {template.basePrice.toFixed(2)} €
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Connection Dialog */}
      {dialogTemplate && (
        <ConnectionDialog
          template={dialogTemplate}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
          preselectedConnectionPointId={preselectedConnectionPointId}
        />
      )}
    </>
  )
}
