import React from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      <button
        onClick={onZoomIn}
        className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg shadow-lg transition-colors"
        title="Zoom In (Mausrad nach oben)"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button
        onClick={onZoomOut}
        className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg shadow-lg transition-colors"
        title="Zoom Out (Mausrad nach unten)"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button
        onClick={onResetView}
        className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg shadow-lg transition-colors"
        title="Ansicht zurücksetzen"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
    </div>
  )
}
