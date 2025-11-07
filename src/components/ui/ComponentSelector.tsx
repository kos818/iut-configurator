import React, { useState } from 'react'
import { Vector3 } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates } from '../../data/componentTemplates'
import { ComponentTemplate, DNValue, ConnectionPoint, PipeComponent } from '../../types'
import { ConnectionDialog } from './ConnectionDialog'
import { getWorldPosition, generateConnectionPoints } from '../../utils/connectionHelpers'
import { calculateConnectionRotation } from '../../utils/rotationHelpers'

export const ComponentSelector: React.FC = () => {
  const addComponent = useConfiguratorStore((state) => state.addComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const components = useConfiguratorStore((state) => state.components)

  const [dialogTemplate, setDialogTemplate] = useState<ComponentTemplate | null>(null)

  const handleComponentClick = (template: ComponentTemplate) => {
    // Show dialog to choose connection
    setDialogTemplate(template)
  }

  const handleDialogConfirm = (connectionPointId: string | null, defaultDN?: number) => {
    if (!dialogTemplate) return

    if (connectionPointId && defaultDN) {
      // Find the connection point and component
      let targetCP: any = null
      let targetComponent: any = null

      for (const comp of components) {
        const cp = comp.connectionPoints.find((p) => p.id === connectionPointId)
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

        // Create a temporary component to calculate its default connection point direction
        const tempComponent: Partial<PipeComponent> = {
          id: 'temp',
          type: templateWithDN.type,
          position: new Vector3(0, 0, 0),
          rotation: new Vector3(0, 0, 0),
          dn: templateWithDN.defaultDN,
          length: templateWithDN.defaultLength,
          angle: templateWithDN.defaultAngle,
          price: 0,
          material: templateWithDN.material,
          connectionPoints: [],
          isValid: true,
          validationMessages: [],
        }
        const tempCPs = generateConnectionPoints(tempComponent as PipeComponent)
        const firstCPDirection = tempCPs.length > 0 ? tempCPs[0].direction : new Vector3(0, 1, 0)

        // Calculate rotation to align new component with target
        const rotation = calculateConnectionRotation(targetCP.direction, firstCPDirection)

        // Add component at target position with calculated rotation
        addComponent(templateWithDN, targetWorldPos)

        // Wait for next tick to get the new component and apply rotation + connection
        setTimeout(() => {
          const allComponents = useConfiguratorStore.getState().components
          const newComponent = allComponents[allComponents.length - 1]

          if (newComponent && newComponent.connectionPoints.length > 0) {
            const newCP = newComponent.connectionPoints[0] // Use first connection point

            // Apply rotation and mark both connection points as connected
            updateComponent(newComponent.id, {
              rotation,
              connectionPoints: newComponent.connectionPoints.map((cp: ConnectionPoint) =>
                cp.id === newCP.id ? { ...cp, connectedTo: targetCP.id } : cp
              )
            })

            updateComponent(targetComponent.id, {
              connectionPoints: targetComponent.connectionPoints.map((cp: ConnectionPoint) =>
                cp.id === targetCP.id ? { ...cp, connectedTo: newCP.id } : cp
              )
            })
          }
        }, 50)
      }
    } else {
      // Add component freely with offset
      const offset = components.length * 0.5
      addComponent(dialogTemplate, new Vector3(offset, 0, 0))
    }

    setDialogTemplate(null)
  }

  const handleDialogCancel = () => {
    setDialogTemplate(null)
  }

  return (
    <>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Komponenten</h2>
        <div className="space-y-2">
          {componentTemplates.map((template, index) => (
            <button
              key={index}
              onClick={() => handleComponentClick(template)}
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

      {/* Connection Dialog */}
      {dialogTemplate && (
        <ConnectionDialog
          template={dialogTemplate}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </>
  )
}
