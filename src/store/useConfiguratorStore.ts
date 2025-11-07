import { create } from 'zustand'
import { Vector3 } from 'three'
import { PipeComponent, ComponentTemplate } from '../types'
import { materialMultipliers, componentTemplates } from '../data/componentTemplates'
import { generateConnectionPoints } from '../utils/connectionHelpers'

// Helper function to calculate component price
const calculateComponentPrice = (component: Partial<PipeComponent>, template?: ComponentTemplate): number => {
  const tmpl = template || componentTemplates.find(t => t.type === component.type)
  if (!tmpl) return 0

  const basePrice = tmpl.basePrice
  const lengthPrice = (tmpl.pricePerMM && component.length) ? tmpl.pricePerMM * component.length : 0
  const materialMultiplier = materialMultipliers[component.material || 'steel'] || 1.0

  return (basePrice + lengthPrice) * materialMultiplier
}

interface ConfiguratorState {
  components: PipeComponent[]
  selectedComponent: string | null
  totalPrice: number
  history: PipeComponent[][]
  historyIndex: number
  snapTargets: string[] // Connection point IDs that are potential snap targets

  // Actions
  addComponent: (template: ComponentTemplate, position?: Vector3) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<PipeComponent>) => void
  selectComponent: (id: string | null) => void
  setSnapTargets: (targets: string[]) => void
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

  addComponent: (template: ComponentTemplate, position?: Vector3) => {
    const newComponent: PipeComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      position: position || new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
      dn: template.defaultDN,
      length: template.defaultLength,
      angle: template.defaultAngle,
      price: calculateComponentPrice({
        type: template.type,
        length: template.defaultLength,
        material: template.material
      }, template),
      material: template.material,
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
  },

  removeComponent: (id: string) => {
    const newComponents = get().components.filter((c) => c.id !== id)

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
        // Recalculate price if material, dn, or length changed
        if (updates.material || updates.dn || updates.length) {
          updated.price = calculateComponentPrice(updated)
        }
        // Regenerate connection points if dn or length changed
        if (updates.dn || updates.length) {
          updated.connectionPoints = generateConnectionPoints(updated)
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
