import { create } from 'zustand'
import { Vector3 } from 'three'
import { PipeComponent, ComponentTemplate } from '../types'

interface ConfiguratorState {
  components: PipeComponent[]
  selectedComponent: string | null
  totalPrice: number

  // Actions
  addComponent: (template: ComponentTemplate, position?: Vector3) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<PipeComponent>) => void
  selectComponent: (id: string | null) => void
  calculateTotalPrice: () => void
  clearAll: () => void
  getProjectData: () => any
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  components: [],
  selectedComponent: null,
  totalPrice: 0,

  addComponent: (template: ComponentTemplate, position?: Vector3) => {
    const newComponent: PipeComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      position: position || new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
      diameter: template.defaultDiameter,
      length: template.defaultLength,
      angle: template.defaultAngle,
      price: template.basePrice + (template.pricePerMM && template.defaultLength ? template.pricePerMM * template.defaultLength : 0),
      material: template.material,
    }

    set((state) => ({
      components: [...state.components, newComponent],
    }))

    get().calculateTotalPrice()
  },

  removeComponent: (id: string) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedComponent: state.selectedComponent === id ? null : state.selectedComponent,
    }))
    get().calculateTotalPrice()
  },

  updateComponent: (id: string, updates: Partial<PipeComponent>) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }))
    get().calculateTotalPrice()
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponent: id })
  },

  calculateTotalPrice: () => {
    const total = get().components.reduce((sum, component) => sum + component.price, 0)
    set({ totalPrice: total })
  },

  clearAll: () => {
    set({
      components: [],
      selectedComponent: null,
      totalPrice: 0,
    })
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
