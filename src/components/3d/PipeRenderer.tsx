import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { DN_TO_MM } from '../../types'
import { StraightPipe } from './StraightPipe'
import { PipeWithBranches } from './PipeWithBranches'
import { ElbowPipe } from './ElbowPipe'
import { TeePipe } from './TeePipe'
import { YPipe } from './YPipe'
import { CrossPipe } from './CrossPipe'
import { Valve } from './Valve'
import { CheckValve } from './CheckValve'
import { Flange } from './Flange'
import { Reducer } from './Reducer'
import { Cap } from './Cap'
import { ConnectionFlangeVisualizer } from './ConnectionFlangeVisualizer'
import { CADModelWrapper } from './CADModelWrapper'

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
          case 'f_piece':
          case 'ff_piece':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                length={component.length || 1000}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <StraightPipe
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  length={component.length || 1000}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'ff_piece_one_branch':
          case 'ff_piece_two_branches':
          case 'fffor_one_branch':
          case 'fffrk_one_branch':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <PipeWithBranches
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  length={component.length || 500}
                  branch1={component.branch1}
                  branch2={component.branch2}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'elbow':
          case 'frk_equal':
          case 'frk_unequal':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <ElbowPipe
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
              </CADModelWrapper>
            )
          case 'tee':
          case 'ffft_symmetrical':
          case 'ffft_asymmetrical':
          case 'ffq_equal':
          case 'ffq_unequal':
          case 'union_straight':
          case 'union_angled':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <TeePipe
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
              </CADModelWrapper>
            )
          case 'wye':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <YPipe
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  armLength={component.armLength || 200}
                  leftAngle={Math.PI / 4}
                  rightAngle={Math.PI / 4}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'wye_angled':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <YPipe
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  armLength={component.armLength || 200}
                  leftAngle={Math.PI / 6}
                  rightAngle={((component.angle || 45) * Math.PI) / 180}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'cross':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <CrossPipe
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  armLength={component.armLength || 200}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'valve':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <Valve
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'check_valve':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <CheckValve
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'flange':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <Flange
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'reducer':
          case 'frr_concentric':
          case 'frr_eccentric':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <Reducer
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'cap':
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <Cap
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
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
