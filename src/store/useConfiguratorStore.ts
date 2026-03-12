import { create } from 'zustand'
import { Vector3, Euler } from 'three'
import { PipeComponent, ComponentTemplate, MaterialType, PNValue, ConnectionMethod } from '../types'
import { materialMultipliers, pnMultipliers, componentTemplates } from '../data/componentTemplates'
import { generateConnectionPoints } from '../utils/connectionHelpers'

// Reposition connected components after a component's geometry changed.
// Uses BFS to cascade position updates through the connection graph.
const repositionConnectedComponents = (
  components: PipeComponent[],
  changedComponentId: string
): PipeComponent[] => {
  const componentMap = new Map(components.map(c => [c.id, { ...c, position: c.position.clone() }]))
  const visited = new Set<string>()
  const queue: string[] = [changedComponentId]
  visited.add(changedComponentId)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const current = componentMap.get(currentId)
    if (!current) continue

    for (const cp of current.connectionPoints) {
      if (!cp.connectedTo) continue

      // Find the connected component and its matching CP
      let connectedComp: PipeComponent | undefined
      let connectedCP = undefined
      for (const comp of componentMap.values()) {
        const matchCP = comp.connectionPoints.find(p => p.id === cp.connectedTo)
        if (matchCP) {
          connectedComp = comp
          connectedCP = matchCP
          break
        }
      }

      if (!connectedComp || !connectedCP || visited.has(connectedComp.id)) continue

      // Calculate where current component's CP is in world space
      const currentCPWorld = cp.position.clone()
      currentCPWorld.applyEuler(new Euler(current.rotation.x, current.rotation.y, current.rotation.z))
      currentCPWorld.add(current.position)

      // Calculate where connected component's CP is in world space
      const connectedCPWorld = connectedCP.position.clone()
      connectedCPWorld.applyEuler(new Euler(connectedComp.rotation.x, connectedComp.rotation.y, connectedComp.rotation.z))
      connectedCPWorld.add(connectedComp.position)

      // Move connected component so its CP aligns with current component's CP
      const delta = currentCPWorld.clone().sub(connectedCPWorld)
      if (delta.lengthSq() > 1e-10) {
        connectedComp.position = connectedComp.position.clone().add(delta)
        componentMap.set(connectedComp.id, connectedComp)
      }

      visited.add(connectedComp.id)
      queue.push(connectedComp.id)
    }
  }

  return components.map(c => componentMap.get(c.id) || c)
}

// Helper function to calculate component price
const calculateComponentPrice = (component: Partial<PipeComponent>, template?: ComponentTemplate): number => {
  const tmpl = template || componentTemplates.find(t => t.type === component.type)
  if (!tmpl) return 0

  const basePrice = tmpl.basePrice
  const lengthPrice = (tmpl.pricePerMM && component.length) ? tmpl.pricePerMM * component.length : 0
  const wallThicknessPrice = (tmpl.pricePerMMWallThickness && component.wallThickness)
    ? tmpl.pricePerMMWallThickness * component.wallThickness : 0
  const materialMultiplier = materialMultipliers[component.material || 'steel'] || 1.0
  const pnMultiplier = pnMultipliers[component.pn || 16] || 1.0

  return (basePrice + lengthPrice + wallThicknessPrice) * materialMultiplier * pnMultiplier
}

export interface CollisionWarning {
  id1: string
  id2: string
  type: 'warning' | 'blocked'
}

interface ConfiguratorState {
  components: PipeComponent[]
  selectedComponent: string | null
  totalPrice: number
  history: PipeComponent[][]
  historyIndex: number
  snapTargets: string[] // Connection point IDs that are potential snap targets
  isDragging: boolean // Track if user is dragging an object
  quickAddConnectionPointId: string | null // Connection point ID for quick add
  dialogSelectableConnectionPoints: string[] // Connection point IDs that can be selected in the dialog
  dialogSelectedConnectionPoint: string | null // Currently selected connection point in the dialog
  collisionWarnings: CollisionWarning[]
  suppressNextCollisionDialog: boolean
  projectSettings: {
    isConfigured: boolean
    defaultMaterial: string
    defaultDN: number
    defaultPN: number
    defaultWallThickness: number
    defaultConnectionMethod: ConnectionMethod
  }

  // Actions
  addComponent: (template: ComponentTemplate, position?: Vector3) => string
  addConnectedComponent: (
    template: ComponentTemplate,
    position: Vector3,
    rotation: Vector3,
    newCPIndex: number,
    targetComponentId: string,
    targetCPId: string,
    connectionMethod: ConnectionMethod,
  ) => string
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<PipeComponent>) => void
  batchUpdateComponents: (updates: Array<{id: string, changes: Partial<PipeComponent>}>) => void
  updateAllComponents: (updates: Partial<PipeComponent>) => void
  selectComponent: (id: string | null) => void
  setSnapTargets: (targets: string[]) => void
  setIsDragging: (isDragging: boolean) => void
  setQuickAddConnectionPoint: (connectionPointId: string | null) => void
  setDialogSelectableConnectionPoints: (connectionPointIds: string[]) => void
  setDialogSelectedConnectionPoint: (connectionPointId: string | null) => void
  setCollisionWarnings: (warnings: CollisionWarning[]) => void
  setProjectSettings: (material: string, dn: number, pn: number, wallThickness: number, connectionMethod: ConnectionMethod) => void
  calculateTotalPrice: () => void
  clearAll: () => void
  getProjectData: () => any
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  components: [],
  selectedComponent: null,
  totalPrice: 0,
  history: [[]],
  historyIndex: 0,
  snapTargets: [],
  isDragging: false,
  quickAddConnectionPointId: null,
  dialogSelectableConnectionPoints: [],
  dialogSelectedConnectionPoint: null,
  collisionWarnings: [],
  suppressNextCollisionDialog: false,
  projectSettings: {
    isConfigured: false,
    defaultMaterial: 'steel',
    defaultDN: 50,
    defaultPN: 16,
    defaultWallThickness: 3,
    defaultConnectionMethod: 'welded',
  },

  addComponent: (template: ComponentTemplate, position?: Vector3) => {
    const { projectSettings } = get()

    // Use project defaults if configured
    const material = projectSettings.isConfigured ? (projectSettings.defaultMaterial as MaterialType) : template.material
    const dn = projectSettings.isConfigured ? projectSettings.defaultDN as any : template.defaultDN
    const pn = projectSettings.isConfigured ? projectSettings.defaultPN as PNValue : template.defaultPN
    const wallThickness = projectSettings.isConfigured ? projectSettings.defaultWallThickness : template.defaultWallThickness

    const newComponent: PipeComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      position: position || new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
      dn,
      pn,
      wallThickness,
      length: template.defaultLength,
      angle: template.defaultAngle,
      armLength: template.defaultArmLength,
      teeArmLengths: template.defaultTeeArmLengths,
      elbowArmLengths: template.defaultElbowArmLengths,
      flangePosition: template.defaultFlangePosition,
      branch1: template.defaultBranch1 ? { ...template.defaultBranch1, dn: template.defaultBranch1.dn || dn } as any : undefined,
      branch2: template.defaultBranch2 ? { ...template.defaultBranch2, dn: template.defaultBranch2.dn || dn } as any : undefined,
      bendRadius: template.defaultBendRadius,
      inletDN: template.defaultInletDN,
      outletDN: template.defaultOutletDN,
      branchDN: template.defaultBranchDN,
      branchOffset: template.defaultBranchOffset,
      branchAngle: template.defaultBranchAngle,
      flangesIncludedInLength: template.defaultFlangesIncludedInLength ?? true,
      price: calculateComponentPrice({
        type: template.type,
        length: template.defaultLength,
        wallThickness: template.defaultWallThickness,
        material,
        pn
      }, template),
      material,
      connectionPoints: [], // will be generated below
      isValid: true,
      validationMessages: [],
    }

    // Generate connection points and apply project default connection method
    newComponent.connectionPoints = generateConnectionPoints(newComponent).map(cp => ({
      ...cp,
      connectionMethod: projectSettings.isConfigured ? projectSettings.defaultConnectionMethod : undefined,
    }))

    const newComponents = [...get().components, newComponent]

    set((state) => ({
      components: newComponents,
      history: [...state.history.slice(0, state.historyIndex + 1), newComponents],
      historyIndex: state.historyIndex + 1,
      suppressNextCollisionDialog: true,
    }))

    get().calculateTotalPrice()
    return newComponent.id
  },

  addConnectedComponent: (
    template: ComponentTemplate,
    position: Vector3,
    rotation: Vector3,
    newCPIndex: number,
    targetComponentId: string,
    targetCPId: string,
    connectionMethod: ConnectionMethod,
  ) => {
    const { projectSettings, components } = get()

    // Use project defaults if configured
    const material = projectSettings.isConfigured ? (projectSettings.defaultMaterial as MaterialType) : template.material
    const dn = projectSettings.isConfigured ? projectSettings.defaultDN as any : template.defaultDN
    const pn = projectSettings.isConfigured ? projectSettings.defaultPN as PNValue : template.defaultPN
    const wallThickness = projectSettings.isConfigured ? projectSettings.defaultWallThickness : template.defaultWallThickness

    const newComponent: PipeComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      position,
      rotation,
      dn,
      pn,
      wallThickness,
      length: template.defaultLength,
      angle: template.defaultAngle,
      armLength: template.defaultArmLength,
      teeArmLengths: template.defaultTeeArmLengths,
      elbowArmLengths: template.defaultElbowArmLengths,
      flangePosition: template.defaultFlangePosition,
      branch1: template.defaultBranch1 ? { ...template.defaultBranch1, dn: template.defaultBranch1.dn || dn } as any : undefined,
      branch2: template.defaultBranch2 ? { ...template.defaultBranch2, dn: template.defaultBranch2.dn || dn } as any : undefined,
      bendRadius: template.defaultBendRadius,
      inletDN: template.defaultInletDN,
      outletDN: template.defaultOutletDN,
      branchDN: template.defaultBranchDN,
      branchOffset: template.defaultBranchOffset,
      branchAngle: template.defaultBranchAngle,
      flangesIncludedInLength: template.defaultFlangesIncludedInLength ?? true,
      price: calculateComponentPrice({
        type: template.type,
        length: template.defaultLength,
        wallThickness: template.defaultWallThickness,
        material,
        pn
      }, template),
      material,
      connectionPoints: [],
      isValid: true,
      validationMessages: [],
    }

    // Generate connection points with project default connection method
    newComponent.connectionPoints = generateConnectionPoints(newComponent).map(cp => ({
      ...cp,
      connectionMethod: projectSettings.isConfigured ? projectSettings.defaultConnectionMethod : undefined,
    }))

    // Mark both sides as connected
    const newCP = newComponent.connectionPoints[newCPIndex] || newComponent.connectionPoints[0]
    newComponent.connectionPoints = newComponent.connectionPoints.map(cp =>
      cp.id === newCP.id ? { ...cp, connectedTo: targetCPId, connectionMethod } : cp
    )

    // Update target component's connection point
    const updatedComponents = components.map(c => {
      if (c.id === targetComponentId) {
        return {
          ...c,
          connectionPoints: c.connectionPoints.map(cp =>
            cp.id === targetCPId ? { ...cp, connectedTo: newCP.id, connectionMethod } : cp
          ),
        }
      }
      return c
    })

    const newComponents = [...updatedComponents, newComponent]

    set((state) => ({
      components: newComponents,
      history: [...state.history.slice(0, state.historyIndex + 1), newComponents],
      historyIndex: state.historyIndex + 1,
    }))

    get().calculateTotalPrice()
    return newComponent.id
  },

  removeComponent: (id: string) => {
    const componentToRemove = get().components.find((c) => c.id === id)

    // First, find all connection point IDs from the component being removed
    const removedConnectionPointIds = componentToRemove?.connectionPoints.map(cp => cp.id) || []

    // Filter out the component
    let newComponents = get().components.filter((c) => c.id !== id)

    // Update all remaining components to clear connections to the removed component
    newComponents = newComponents.map((c) => ({
      ...c,
      connectionPoints: c.connectionPoints.map((cp) => {
        // If this connection point was connected to any of the removed component's points
        if (removedConnectionPointIds.includes(cp.connectedTo || '')) {
          return {
            ...cp,
            connectedTo: null,
            connectionMethod: undefined
          }
        }
        return cp
      })
    }))

    set((state) => ({
      components: newComponents,
      selectedComponent: state.selectedComponent === id ? null : state.selectedComponent,
      history: [...state.history.slice(0, state.historyIndex + 1), newComponents],
      historyIndex: state.historyIndex + 1,
    }))
    get().calculateTotalPrice()
  },

  updateComponent: (id: string, updates: Partial<PipeComponent>) => {
    const geometryChanged = updates.dn || updates.length || updates.teeArmLengths || updates.elbowArmLengths ||
        updates.angle !== undefined || updates.flangePosition || updates.branch1 || updates.branch2 ||
        updates.bendRadius !== undefined || updates.inletDN || updates.outletDN || updates.branchDN ||
        updates.branchOffset !== undefined || updates.branchAngle !== undefined

    let newComponents = get().components.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...updates }
        // Recalculate price if material, dn, pn, length, or wallThickness changed
        if (updates.material || updates.dn || updates.pn || updates.length || updates.wallThickness) {
          updated.price = calculateComponentPrice(updated)
        }
        // Regenerate connection points if any geometric properties changed
        if (geometryChanged) {
          // Store existing connection info before regenerating
          const existingConnections = new Map(
            c.connectionPoints.map(cp => [cp.type, { connectedTo: cp.connectedTo, connectionMethod: cp.connectionMethod }])
          )

          // Generate new connection points with updated positions
          const newConnectionPoints = generateConnectionPoints(updated)

          // Restore connection info to new connection points
          updated.connectionPoints = newConnectionPoints.map(cp => ({
            ...cp,
            connectedTo: existingConnections.get(cp.type)?.connectedTo ?? cp.connectedTo,
            connectionMethod: existingConnections.get(cp.type)?.connectionMethod ?? cp.connectionMethod,
          }))
        }
        return updated
      }
      return c
    })

    // Reposition connected components if geometry changed
    if (geometryChanged) {
      newComponents = repositionConnectedComponents(newComponents, id)
    }

    set((state) => ({
      components: newComponents,
      history: [...state.history.slice(0, state.historyIndex + 1), newComponents],
      historyIndex: state.historyIndex + 1,
    }))
    get().calculateTotalPrice()
  },

  batchUpdateComponents: (updates: Array<{id: string, changes: Partial<PipeComponent>}>) => {
    let newComponents = [...get().components]
    for (const { id, changes } of updates) {
      newComponents = newComponents.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...changes }
          if (changes.material || changes.dn || changes.pn || changes.length || changes.wallThickness) {
            updated.price = calculateComponentPrice(updated)
          }
          return updated
        }
        return c
      })
    }

    set((state) => ({
      components: newComponents,
      history: [...state.history.slice(0, state.historyIndex + 1), newComponents],
      historyIndex: state.historyIndex + 1,
    }))
    get().calculateTotalPrice()
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponent: id })
  },

  setSnapTargets: (targets: string[]) => {
    set({ snapTargets: targets })
  },

  setIsDragging: (isDragging: boolean) => {
    set({ isDragging })
  },

  setQuickAddConnectionPoint: (connectionPointId: string | null) => {
    set({ quickAddConnectionPointId: connectionPointId })
  },

  setDialogSelectableConnectionPoints: (connectionPointIds: string[]) => {
    set({ dialogSelectableConnectionPoints: connectionPointIds })
  },

  setDialogSelectedConnectionPoint: (connectionPointId: string | null) => {
    set({ dialogSelectedConnectionPoint: connectionPointId })
  },

  setCollisionWarnings: (warnings: CollisionWarning[]) => {
    set({ collisionWarnings: warnings })
  },

  setProjectSettings: (material: string, dn: number, pn: number, wallThickness: number, connectionMethod: ConnectionMethod) => {
    set({
      projectSettings: {
        isConfigured: true,
        defaultMaterial: material,
        defaultDN: dn,
        defaultPN: pn,
        defaultWallThickness: wallThickness,
        defaultConnectionMethod: connectionMethod,
      },
    })
  },

  updateAllComponents: (updates: Partial<PipeComponent>) => {
    const newComponents = get().components.map((c) => {
      const updated = { ...c, ...updates }
      // Recalculate price if material, dn, pn, length, or wallThickness changed
      if (updates.material || updates.dn || updates.pn || updates.length || updates.wallThickness) {
        updated.price = calculateComponentPrice(updated)
      }
      // Regenerate connection points if dn, length, teeArmLengths, elbowArmLengths, or angle changed
      if (updates.dn || updates.length || updates.teeArmLengths || updates.elbowArmLengths || updates.angle !== undefined) {
        // Store existing connection info before regenerating
        const existingConnections = new Map(
          c.connectionPoints.map(cp => [cp.type, { connectedTo: cp.connectedTo, connectionMethod: cp.connectionMethod }])
        )

        // Generate new connection points with updated positions
        const newConnectionPoints = generateConnectionPoints(updated)

        // Restore connection info to new connection points
        updated.connectionPoints = newConnectionPoints.map(cp => ({
          ...cp,
          connectedTo: existingConnections.get(cp.type)?.connectedTo ?? cp.connectedTo,
          connectionMethod: existingConnections.get(cp.type)?.connectionMethod ?? cp.connectionMethod,
        }))
      }
      return updated
    })

    set((state) => ({
      components: newComponents,
      history: [...state.history.slice(0, state.historyIndex + 1), newComponents],
      historyIndex: state.historyIndex + 1,
    }))
    get().calculateTotalPrice()
  },

  calculateTotalPrice: () => {
    const total = get().components.reduce((sum, component) => sum + component.price, 0)
    set({ totalPrice: total })
  },

  clearAll: () => {
    set((state) => ({
      components: [],
      selectedComponent: null,
      totalPrice: 0,
      history: [...state.history.slice(0, state.historyIndex + 1), []],
      historyIndex: state.historyIndex + 1,
    }))
  },

  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      set({
        components: state.history[newIndex],
        historyIndex: newIndex,
      })
      get().calculateTotalPrice()
    }
  },

  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      set({
        components: state.history[newIndex],
        historyIndex: newIndex,
      })
      get().calculateTotalPrice()
    }
  },

  canUndo: () => {
    return get().historyIndex > 0
  },

  canRedo: () => {
    const state = get()
    return state.historyIndex < state.history.length - 1
  },

  getProjectData: () => {
    const state = get()
    return {
      components: state.components.map(c => ({
        ...c,
        position: { x: c.position.x, y: c.position.y, z: c.position.z },
        rotation: { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z },
      })),
      totalPrice: state.totalPrice,
      name: 'Rohrleitung Projekt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
}))
