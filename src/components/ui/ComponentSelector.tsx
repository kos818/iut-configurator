import React, { useState, useEffect } from 'react'
import { Vector3, Euler, Quaternion } from 'three'
import { ChevronLeft } from 'lucide-react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { componentTemplates, componentGroupNames, ComponentGroup } from '../../data/componentTemplates'
import { ComponentTemplate, DNValue, ConnectionPoint, PipeComponent, ConnectionMethod } from '../../types'
import { ConnectionDialog } from './ConnectionDialog'
import { getWorldPosition, getWorldDirection, generateConnectionPoints } from '../../utils/connectionHelpers'
// calculateConnectionRotation removed — using inline quaternion math for precision

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
      setDialogTemplate(componentTemplates[0])
      setPreselectedConnectionPointId(quickAddConnectionPointId)
      setQuickAddConnectionPoint(null)
    }
  }, [quickAddConnectionPointId, setQuickAddConnectionPoint])

  const handleComponentClick = (template: ComponentTemplate) => {
    if (components.length === 0) {
      addComponent(template, new Vector3(0, 0, 0))
      return
    }

    const selectedComp = components.find((c) => c.id === selectedComponent)
    if (selectedComp) {
      const availableCPs = selectedComp.connectionPoints.filter((cp) => cp.connectedTo === null)
      if (availableCPs.length > 0) {
        setPreselectedConnectionPointId(availableCPs[0].id)
      }
    }

    setDialogTemplate(template)
  }

  const handleDialogConfirm = (connectionPointId: string | null, defaultDN?: number, connectionMethod?: ConnectionMethod, newComponentCPIndex: number = 0) => {
    if (!dialogTemplate) return

    const finalConnectionPointId = connectionPointId || preselectedConnectionPointId

    if (finalConnectionPointId && defaultDN) {
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
        const templateWithDN = { ...dialogTemplate, defaultDN: defaultDN as DNValue }
        const targetWorldPos = getWorldPosition(targetComponent, targetCP)

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
          branchAngle: templateWithDN.defaultBranchAngle,
          price: 0,
          material: templateWithDN.material,
          connectionPoints: [],
          isValid: true,
          validationMessages: [],
        }
        const tempCPs = generateConnectionPoints(tempComponent as PipeComponent)
        const selectedCP = tempCPs.length > newComponentCPIndex ? tempCPs[newComponentCPIndex] : tempCPs[0]
        const selectedCPDirection = selectedCP ? selectedCP.direction.clone().normalize() : new Vector3(0, 1, 0)
        const selectedCPPosition = selectedCP ? selectedCP.position : new Vector3(0, 0, 0)

        const targetWorldDirection = getWorldDirection(targetComponent, targetCP)

        // Use quaternion math to avoid gimbal-lock precision issues
        const desiredDir = targetWorldDirection.clone().negate()
        const alignQuat = new Quaternion().setFromUnitVectors(selectedCPDirection, desiredDir)
        const euler = new Euler().setFromQuaternion(alignQuat)
        const rotation = new Vector3(euler.x, euler.y, euler.z)

        // Apply quaternion (not Euler) to the CP offset for maximum precision
        const rotatedCPOffset = selectedCPPosition.clone().applyQuaternion(alignQuat)
        const actualPosition = targetWorldPos.clone().sub(rotatedCPOffset)

        const newComponentId = addComponent(templateWithDN, actualPosition)

        const allComponents = useConfiguratorStore.getState().components
        const newComponent = allComponents.find(c => c.id === newComponentId)

        if (newComponent && newComponent.connectionPoints.length > newComponentCPIndex) {
          const newCP = newComponent.connectionPoints[newComponentCPIndex]

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

  const filteredTemplates = selectedGroup
    ? componentTemplates.filter(t => t.group === selectedGroup)
    : []

  return (
    <>
      <div className="flex flex-col">
        {/* Show groups if no group selected */}
        {!selectedGroup && (
          <div className="flex flex-wrap gap-1.5 p-3">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => {
                  const groupTemplates = componentTemplates.filter(t => t.group === group)
                  if (groupTemplates.length === 1) {
                    handleComponentClick(groupTemplates[0])
                  } else {
                    setSelectedGroup(group)
                  }
                }}
                className="text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #004B87 0%, #0077C8 100%)',
                }}
              >
                {componentGroupNames[group]}
              </button>
            ))}
          </div>
        )}

        {/* Show components when group is selected */}
        {selectedGroup && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className="hover:opacity-70 transition-opacity"
                title="Zurück zur Gruppenauswahl"
                style={{ color: '#0077C8' }}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="uppercase tracking-wider text-xs font-bold" style={{ color: '#004B87' }}>
                {componentGroupNames[selectedGroup]}
              </span>
            </div>
            <div className="space-y-1">
              {filteredTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleComponentClick(template)}
                  className="w-full px-3 py-2 rounded-lg transition-all text-left border hover:shadow-sm"
                  style={{
                    background: '#f0f4f8',
                    borderColor: '#d5d9e0',
                    color: '#343a44',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0077C8'
                    e.currentTarget.style.borderColor = '#0077C8'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f4f8'
                    e.currentTarget.style.borderColor = '#d5d9e0'
                    e.currentTarget.style.color = '#343a44'
                  }}
                >
                  <div className="font-semibold text-xs">{template.name}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: 'inherit', opacity: 0.8 }}>
                    ab {template.basePrice.toFixed(2)} €
                  </div>
                </button>
              ))}
            </div>
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
