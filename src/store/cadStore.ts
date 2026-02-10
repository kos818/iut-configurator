import { create } from 'zustand'
import { RefObject } from 'react'
import { Mesh } from 'three'
import { useConfiguratorStore } from './useConfiguratorStore'

interface CADState {
  selectedId: string | null
  hoveredId: string | null
  meshRefs: Map<string, RefObject<Mesh>>

  setSelected: (id: string | null) => void
  setHovered: (id: string | null) => void
  registerMeshRef: (id: string, ref: RefObject<Mesh>) => void
  unregisterMeshRef: (id: string) => void
}

export const useCADStore = create<CADState>((set) => ({
  selectedId: null,
  hoveredId: null,
  meshRefs: new Map(),

  setSelected: (id: string | null) => {
    set({ selectedId: id })
    // Sync to configurator store
    useConfiguratorStore.getState().selectComponent(id)
  },

  setHovered: (id: string | null) => {
    set({ hoveredId: id })
  },

  registerMeshRef: (id: string, ref: RefObject<Mesh>) => {
    set((state) => {
      const next = new Map(state.meshRefs)
      next.set(id, ref)
      return { meshRefs: next }
    })
  },

  unregisterMeshRef: (id: string) => {
    set((state) => {
      const next = new Map(state.meshRefs)
      next.delete(id)
      return { meshRefs: next }
    })
  },
}))

// Selector helpers
export const selectSelectedId = (state: CADState) => state.selectedId
export const selectHoveredId = (state: CADState) => state.hoveredId
