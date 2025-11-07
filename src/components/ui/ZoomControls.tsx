import React from 'react'
import { ZoomIn, ZoomOut, Maximize2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onPanUp: () => void
  onPanDown: () => void
  onPanLeft: () => void
  onPanRight: () => void
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex gap-4 z-10">
      {/* Pan Controls */}
      <div className="flex flex-col gap-2">
        <div className="text-white text-xs text-center mb-1 font-semibold">Verschieben</div>
        <div className="grid grid-cols-3 gap-1">
          <div></div>
          <button
            onClick={onPanUp}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
            title="Nach oben verschieben"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div></div>
          <button
            onClick={onPanLeft}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
            title="Nach links verschieben"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div></div>
          <button
            onClick={onPanRight}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
            title="Nach rechts verschieben"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div></div>
          <button
            onClick={onPanDown}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
            title="Nach unten verschieben"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <div></div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col gap-2">
        <div className="text-white text-xs text-center mb-1 font-semibold">Zoom</div>
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
    </div>
  )
}
