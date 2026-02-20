import React, { Suspense } from 'react'
import { CADModel } from './CADModel'
import { getModelConfig, calculateScaleFactor } from '../../data/modelRegistry'
import { PipeComponentType, DNValue } from '../../types'

interface CADModelWrapperProps {
  id: string
  type: PipeComponentType
  dn: DNValue
  length?: number // Component length in mm (for stretching)
  position: [number, number, number]
  rotation: [number, number, number]
  material: string
  selected: boolean
  children: React.ReactNode // Fallback procedural component
}

// Error boundary for catching model loading failures
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export const CADModelWrapper: React.FC<CADModelWrapperProps> = ({
  id,
  type,
  dn,
  length,
  position,
  rotation,
  material,
  selected,
  children, // Fallback procedural component
}) => {
  const modelConfig = getModelConfig(type)

  // If no CAD model configured for this type, use procedural fallback
  if (!modelConfig) {
    return <>{children}</>
  }

  // Calculate scale factor based on DN and model scale adjustment
  // Use DN value directly (not DN_TO_MM which is outer diameter and causes 14.3% oversize)
  const targetDiameter = dn
  const scaleFactor = calculateScaleFactor(targetDiameter, modelConfig.referenceDN, modelConfig.modelScale)

  // Calculate length scale factor if model has a defined length
  // Compensate for the DN ratio so the length axis only converts mm→meters
  let lengthScaleFactor = 1
  if (modelConfig.modelLength && length) {
    const dnRatio = targetDiameter / modelConfig.referenceDN
    lengthScaleFactor = (length / modelConfig.modelLength) / dnRatio
  }

  // Calculate position offset scaled for the current length
  // The offset needs to scale with length to keep the model centered
  let scaledPositionOffset = modelConfig.positionOffset
  if (modelConfig.positionOffset && modelConfig.modelLength && length) {
    const lengthRatio = length / modelConfig.modelLength
    const axis = modelConfig.lengthAxis ?? 2
    scaledPositionOffset = [...modelConfig.positionOffset] as [number, number, number]
    scaledPositionOffset[axis] = modelConfig.positionOffset[axis] * lengthRatio
  }

  return (
    <ModelErrorBoundary fallback={children}>
      <Suspense fallback={children}>
        <CADModelWithFallback
          id={id}
          modelPath={modelConfig.modelPath}
          position={position}
          rotation={rotation}
          material={material}
          selected={selected}
          scale={scaleFactor}
          lengthScale={lengthScaleFactor}
          lengthAxis={modelConfig.lengthAxis}
          rotationOffset={modelConfig.rotationOffset}
          positionOffset={scaledPositionOffset}
          fallback={children}
        />
      </Suspense>
    </ModelErrorBoundary>
  )
}

// Inner component that renders the CAD model
// Errors are caught by the ErrorBoundary, which will render the fallback
const CADModelWithFallback: React.FC<{
  id: string
  modelPath: string
  position: [number, number, number]
  rotation: [number, number, number]
  material: string
  selected: boolean
  scale: number
  lengthScale?: number
  lengthAxis?: 0 | 1 | 2
  rotationOffset?: [number, number, number]
  positionOffset?: [number, number, number]
  fallback: React.ReactNode
}> = ({ id, modelPath, position, rotation, material, selected, scale, lengthScale, lengthAxis, rotationOffset, positionOffset }) => {
  return (
    <CADModel
      id={id}
      modelPath={modelPath}
      position={position}
      rotation={rotation}
      material={material}
      selected={selected}
      scale={scale}
      lengthScale={lengthScale}
      lengthAxis={lengthAxis}
      rotationOffset={rotationOffset}
      positionOffset={positionOffset}
    />
  )
}
