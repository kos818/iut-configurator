import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { DN_TO_MM } from '../../types'
import { StraightPipe } from './StraightPipe'
import { ElbowPipe } from './ElbowPipe'
import { TeePipe } from './TeePipe'
import { CrossPipe } from './CrossPipe'
import { Valve } from './Valve'
import { CheckValve } from './CheckValve'
import { Flange } from './Flange'
import { Reducer } from './Reducer'
import { Cap } from './Cap'
import { ConnectionFlangeVisualizer } from './ConnectionFlangeVisualizer'

export const PipeRenderer: React.FC = () => {
  const components = useConfiguratorStore((state) => state.components)
  const selectedComponent = useConfiguratorStore((state) => state.selectedComponent)

  return (
    <group>
      {/* Render all components */}
      {components.map((component) => {
        const position: [number, number, number] = [
          component.position.x,
          component.position.y,
          component.position.z,
        ]
        const rotation: [number, number, number] = [
          component.rotation.x,
          component.rotation.y,
          component.rotation.z,
        ]
        const selected = component.id === selectedComponent

        switch (component.type) {
          case 'straight':
            return (
              <StraightPipe
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                length={component.length || 1000}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'elbow':
            return (
              <ElbowPipe
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                angle={component.angle || 90}
                inletLength={component.elbowArmLengths?.inlet}
                outletLength={component.elbowArmLengths?.outlet}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'tee':
          case 'ffft_symmetrical':
          case 'ffft_asymmetrical':
          case 'ffq_equal':
          case 'ffq_unequal':
          case 'wye':
          case 'wye_angled':
          case 'union_straight':
          case 'union_angled':
            return (
              <TeePipe
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                inletLength={component.teeArmLengths?.inlet || component.armLength || 200}
                outletLength={component.teeArmLengths?.outlet || component.armLength || 200}
                branchLength={component.teeArmLengths?.branch || component.armLength || 200}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'cross':
            return (
              <CrossPipe
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                armLength={component.armLength || 200}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'valve':
            return (
              <Valve
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'check_valve':
            return (
              <CheckValve
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'flange':
            return (
              <Flange
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'reducer':
          case 'frr_concentric':
          case 'frr_eccentric':
            return (
              <Reducer
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          case 'cap':
            return (
              <Cap
                key={component.id}
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
          default:
            return null
        }
      })}

      {/* Render flanges for all flanged connections */}
      {components.map((component) => (
        <ConnectionFlangeVisualizer key={`flange-${component.id}`} component={component} />
      ))}
    </group>
  )
}
