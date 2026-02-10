import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'

interface YPipeProps {
  id: string
  diameter: number
  armLength?: number
  leftAngle?: number
  rightAngle?: number
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const YPipe: React.FC<YPipeProps> = ({
  id,
  diameter,
  armLength = 200,
  leftAngle = Math.PI / 4,
  rightAngle = Math.PI / 4,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const outerRadius = (diameter / 2) / 1000
  const armLengthM = armLength / 1000

  const inletY = -armLengthM / 2
  const leftOutletX = -armLengthM * Math.sin(leftAngle) / 2
  const leftOutletY = armLengthM * Math.cos(leftAngle) / 2
  const rightOutletX = armLengthM * Math.sin(rightAngle) / 2
  const rightOutletY = armLengthM * Math.cos(rightAngle) / 2

  const armGeom = useMemo(
    () => new CylinderGeometry(outerRadius, outerRadius, armLengthM, 16),
    [outerRadius, armLengthM]
  )
  const sphereGeom = useMemo(
    () => new SphereGeometry(outerRadius * 1.5, 16, 16),
    [outerRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={armGeom} position={[0, inletY, 0]} />
      <CADMesh id={id} geometry={armGeom} position={[leftOutletX, leftOutletY, 0]} rotation={[0, 0, leftAngle]} />
      <CADMesh id={id} geometry={armGeom} position={[rightOutletX, rightOutletY, 0]} rotation={[0, 0, -rightAngle]} />
      <CADMesh id={id} geometry={sphereGeom} />
    </group>
  )
}
