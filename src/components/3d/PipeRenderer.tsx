import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { DN_TO_MM } from '../../types'
import { getEffectivePipeBodyLength } from '../../utils/flangeUtils'
import { StraightPipe } from './StraightPipe'
import { ElbowPipe } from './ElbowPipe'
import { TeePipe } from './TeePipe'
import { FlanschPipe } from './FlanschPipe'
import { FFQPipe } from './FFQPipe'
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
          case 'straight': {
            const rawLength = component.length || 1000
            const effectiveBodyLength = getEffectivePipeBodyLength(
              rawLength, component.connectionPoints, component.dn, component.pn,
              component.flangesIncludedInLength ?? true
            )
            return (
              <CADModelWrapper
                key={component.id}
                id={component.id}
                type={component.type}
                dn={component.dn}
                length={effectiveBodyLength}
                position={position}
                rotation={rotation}
                material={component.material}
                selected={selected}
              >
                <StraightPipe
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  length={effectiveBodyLength}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          }
          case 'elbow': {
            const elbowAngle = component.angle || 90
            const effInlet = component.elbowArmLengths?.inlet || 150
            const effOutlet = component.elbowArmLengths?.outlet || 150
            const elbowContent = (
              <ElbowPipe
                id={component.id}
                diameter={DN_TO_MM[component.dn]}
                angle={elbowAngle}
                inletLength={effInlet}
                outletLength={effOutlet}
                position={position}
                rotation={rotation}
                selected={selected}
                material={component.material}
              />
            )
            // GLB model is 90° only — use procedural for other angles
            if (elbowAngle !== 90) {
              return <React.Fragment key={component.id}>{elbowContent}</React.Fragment>
            }
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
                {elbowContent}
              </CADModelWrapper>
            )
          }
          case 'tee': {
            const teeInlet = component.teeArmLengths?.inlet || component.armLength || 200
            const teeOutlet = component.teeArmLengths?.outlet || component.armLength || 200
            const teeBranch = component.teeArmLengths?.branch || component.armLength || 200
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
                  inletLength={teeInlet}
                  outletLength={teeOutlet}
                  branchLength={teeBranch}
                  branchAngle={component.branchAngle || 45}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          }
          case 'glatter_flansch':
          case 'losflansch':
          case 'vorschweissboerdel':
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
                <FlanschPipe
                  id={component.id}
                  diameter={DN_TO_MM[component.dn]}
                  type={component.type}
                  position={position}
                  rotation={rotation}
                  selected={selected}
                  material={component.material}
                />
              </CADModelWrapper>
            )
          case 'ffq_stueck':
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
                <FFQPipe
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
