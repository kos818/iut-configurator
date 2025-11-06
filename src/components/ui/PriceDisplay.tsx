import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'

export const PriceDisplay: React.FC = () => {
  const totalPrice = useConfiguratorStore((state) => state.totalPrice)
  const components = useConfiguratorStore((state) => state.components)

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-green-100 text-sm">Gesamtpreis</div>
          <div className="text-white font-bold text-3xl">
            {totalPrice.toFixed(2)} €
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-100 text-sm">Komponenten</div>
          <div className="text-white font-bold text-2xl">{components.length}</div>
        </div>
      </div>
    </div>
  )
}
