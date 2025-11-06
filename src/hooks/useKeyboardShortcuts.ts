import { useEffect } from 'react'
import { useConfiguratorStore } from '../store/useConfiguratorStore'

export const useKeyboardShortcuts = () => {
  const undo = useConfiguratorStore((state) => state.undo)
  const redo = useConfiguratorStore((state) => state.redo)
  const canUndo = useConfiguratorStore((state) => state.canUndo())
  const canRedo = useConfiguratorStore((state) => state.canRedo())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          undo()
        }
      }

      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac) or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        if (canRedo) {
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [undo, redo, canUndo, canRedo])
}
