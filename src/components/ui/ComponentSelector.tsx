import React, { useState } from 'react'
import { Vector3, Euler } from 'three'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates } from '../../data/componentTemplates'
import { ComponentTemplate, DNValue, ConnectionPoint, PipeComponent, ConnectionMethod } from '../../types'
import { ConnectionDialog } from './ConnectionDialog'
import { getWorldPosition, getWorldDirection, generateConnectionPoints } from '../../utils/connectionHelpers'
import { calculateConnectionRotation } from '../../utils/rotationHelpers'

export const ComponentSelector: React.FC = () => {
  const addComponent = useConfiguratorStore((state) => state.addComponent)
  const updateComponent = useConfiguratorStore((state) => state.updateComponent)
  const components = useConfiguratorStore((state) => state.components)

  const [dialogTemplate, setDialogTemplate] = useState<ComponentTemplate | null>(null)

  const handleComponentClick = (template: ComponentTemplate) => {
    // If no components exist yet, add first one directly without dialog
    if (components.length === 0) {
      addComponent(template, new Vector3(0, 0, 0))
      return
    }

    // Show dialog to choose connection
    setDialogTemplate(template)
  }

  const handleDialogConfirm = (connectionPointId: string | null, defaultDN?: number, connectionMethod?: ConnectionMethod, newComponentCPIndex: number = 0) => {
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
        let actualPosition = targetWorldPos.clone().sub(rotatedCPOffset)

        // If using flanged connection, add extra spacing for the flanges
        if (connectionMethod === 'flanged') {
          // Calculate flange thickness based on DN
          const pipeRadius = targetCP.dn / 2000 // Convert DN to meters radius
          const flangeThickness = pipeRadius * 0.4

          // Add spacing for both flanges (2x thickness)
          const flangeSpacing = flangeThickness * 2

          // Get the direction from target CP to new component (opposite of target CP direction)
          const targetDirection = getWorldDirection(targetComponent, targetCP)

          // Move the component away by the flange spacing
          const spacingOffset = targetDirection.clone().multiplyScalar(flangeSpacing)
          actualPosition.add(spacingOffset)
        }

        // Add component at corrected position with calculated rotation
        addComponent(templateWithDN, actualPosition)

        // Wait for next tick to get the new component and apply rotation + connection
        setTimeout(() => {
          const allComponents = useConfiguratorStore.getState().components
          const newComponent = allComponents[allComponents.length - 1]

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
