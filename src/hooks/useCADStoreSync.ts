import { useEffect, useRef } from 'react'
import { useConfiguratorStore } from '../store/useConfiguratorStore'
import { useCADStore } from '../store/cadStore'

/**
 * Bidirectional sync between configuratorStore.selectedComponent and cadStore.selectedId.
 * Prevents infinite loops via a guard ref.
 */
export function useCADStoreSync() {
  const syncing = useRef(false)

  const configSelected = useConfiguratorStore((s) => s.selectedComponent)
  const cadSelected = useCADStore((s) => s.selectedId)

  // configuratorStore → cadStore
  useEffect(() => {
    if (syncing.current) return
    if (configSelected !== cadSelected) {
      syncing.current = true
      useCADStore.getState().setSelected(configSelected)
      syncing.current = false
    }
  }, [configSelected])

  // cadStore → configuratorStore
  useEffect(() => {
    if (syncing.current) return
    if (cadSelected !== configSelected) {
      syncing.current = true
      useConfiguratorStore.getState().selectComponent(cadSelected)
      syncing.current = false
    }
  }, [cadSelected])
}
