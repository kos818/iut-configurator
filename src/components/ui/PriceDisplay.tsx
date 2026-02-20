import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

export const PriceDisplay: React.FC = () => {
  const totalPrice = useConfiguratorStore((state) => state.totalPrice)
  const components = useConfiguratorStore((state) => state.components)

  return (
    <div
      className="p-5 rounded-xl shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #002B50 0%, #004B87 50%, #0077C8 100%)',
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Gesamtpreis
          </div>
          <div className="font-bold text-3xl mt-1" style={{ color: '#ffffff' }}>
            {totalPrice.toFixed(2)} €
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Komponenten
          </div>
          <div className="font-bold text-3xl mt-1" style={{ color: '#ffffff' }}>
            {components.length}
          </div>
        </div>
      </div>
    </div>
  )
}
