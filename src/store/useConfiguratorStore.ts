import { create } from 'zustand'
import { Vector3 } from 'three'
import { PipeComponent, ComponentTemplate, MaterialType } from '../types'
import { materialMultipliers, componentTemplates } from '../data/componentTemplates'
import { generateConnectionPoints } from '../utils/connectionHelpers'

// Helper function to calculate component price
const calculateComponentPrice = (component: Partial<PipeComponent>, template?: ComponentTemplate): number => {
  const tmpl = template || componentTemplates.find(t => t.type === component.type)
  if (!tmpl) return 0

  const basePrice = tmpl.basePrice
  const lengthPrice = (tmpl.pricePerMM && component.length) ? tmpl.pricePerMM * component.length : 0
  const wallThicknessPrice = (tmpl.pricePerMMWallThickness && component.wallThickness)
    ? tmpl.pricePerMMWallThickness * component.wallThickness : 0
  const materialMultiplier = materialMultipliers[component.material || 'steel'] || 1.0

  return (basePrice + lengthPrice + wallThicknessPrice) * materialMultiplier
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
  projectSettings: {
    isConfigured: boolean
    defaultMaterial: string
    defaultDN: number
    defaultWallThickness: number
  }

  // Actions
  addComponent: (template: ComponentTemplate, position?: Vector3) => string
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<PipeComponent>) => void
  updateAllComponents: (updates: Partial<PipeComponent>) => void
  selectComponent: (id: string | null) => void
  setSnapTargets: (targets: string[]) => void
  setIsDragging: (isDragging: boolean) => void
  setQuickAddConnectionPoint: (connectionPointId: string | null) => void
  setDialogSelectableConnectionPoints: (connectionPointIds: string[]) => void
  setDialogSelectedConnectionPoint: (connectionPointId: string | null) => void
  setProjectSettings: (material: string, dn: number, wallThickness: number) => void
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
  projectSettings: {
    isConfigured: false,
    defaultMaterial: 'steel',
    defaultDN: 50,
    defaultWallThickness: 3,
  },

  addComponent: (template: ComponentTemplate, position?: Vector3) => {
    const { projectSettings } = get()

    // Use project defaults if configured
    const material = projectSettings.isConfigured ? (projectSettings.defaultMaterial as MaterialType) : template.material
    const dn = projectSettings.isConfigured ? projectSettings.defaultDN as any : template.defaultDN
    const wallThickness = projectSettings.isConfigured ? projectSettings.defaultWallThickness : template.defaultWallThickness

    const newComponent: PipeComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      position: position || new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
      dn,
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
      price: calculateComponentPrice({
        type: template.type,
        length: template.defaultLength,
        wallThickness: template.defaultWallThickness,
        material
      }, template),
      material,
      connectionPoints: [], // will be generated below
      isValid: true,
      validationMessages: [],
    }

    // Generate connection points
    newComponent.connectionPoints = generateConnectionPoints(newComponent)

    const newComponents = [...get().components, newComponent]

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
    const newComponents = get().components.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...updates }
        // Recalculate price if material, dn, length, or wallThickness changed
        if (updates.material || updates.dn || updates.length || updates.wallThickness) {
          updated.price = calculateComponentPrice(updated)
        }
        // Regenerate connection points if any geometric properties changed
        if (updates.dn || updates.length || updates.teeArmLengths || updates.elbowArmLengths ||
            updates.angle !== undefined || updates.flangePosition || updates.branch1 || updates.branch2 ||
            updates.bendRadius !== undefined || updates.inletDN || updates.outletDN || updates.branchDN ||
            updates.branchOffset !== undefined || updates.branchAngle !== undefined) {
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

  setProjectSettings: (material: string, dn: number, wallThickness: number) => {
    set({
      projectSettings: {
        isConfigured: true,
        defaultMaterial: material,
        defaultDN: dn,
        defaultWallThickness: wallThickness,
      },
    })
  },

  updateAllComponents: (updates: Partial<PipeComponent>) => {
    const newComponents = get().components.map((c) => {
      const updated = { ...c, ...updates }
      // Recalculate price if material, dn, length, or wallThickness changed
      if (updates.material || updates.dn || updates.length || updates.wallThickness) {
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
