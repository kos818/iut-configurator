import React, { useMemo } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { CADMesh } from '../cad/CADMesh'
import { useDraggable } from '../../hooks/useDraggable'
import { BranchConfig, DN_TO_MM } from '../../types'

interface PipeWithBranchesProps {
  id: string
  diameter: number
  length: number
  branch1?: BranchConfig
  branch2?: BranchConfig
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

export const PipeWithBranches: React.FC<PipeWithBranchesProps> = ({
  id,
  diameter,
  length,
  branch1,
  branch2,
  position,
  rotation,
}) => {
  const { dragHandlers } = useDraggable(id)

  const mainRadius = (diameter / 2) / 1000
  const lengthM = length / 1000

  const mainGeom = useMemo(
    () => new CylinderGeometry(mainRadius, mainRadius, lengthM, 16),
    [mainRadius, lengthM]
  )

  const junctionGeom = useMemo(
    () => new SphereGeometry(mainRadius * 1.3, 16, 16),
    [mainRadius]
  )

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      <CADMesh id={id} geometry={mainGeom} />

      {branch1 && (
        <Branch
          id={id}
          branch={branch1}
          lengthM={lengthM}
          side={1}
        />
      )}

      {branch2 && (
        <Branch
          id={id}
          branch={branch2}
          lengthM={lengthM}
          side={-1}
        />
      )}

      {branch1 && (
        (() => {
          const branchPosM = (branch1.position * lengthM) - (lengthM / 2)
          return <CADMesh id={id} geometry={junctionGeom} position={[0, branchPosM, 0]} />
        })()
      )}

      {branch2 && (
        (() => {
          const branchPosM = (branch2.position * lengthM) - (lengthM / 2)
          return <CADMesh id={id} geometry={junctionGeom} position={[0, branchPosM, 0]} />
        })()
      )}
    </group>
  )
}

const Branch: React.FC<{
  id: string
  branch: BranchConfig
  lengthM: number
  side: 1 | -1
}> = ({ id, branch, lengthM, side }) => {
  const branchLengthM = branch.length / 1000
  const branchAngleRad = (branch.angle * Math.PI) / 180
  const branchPosM = (branch.position * lengthM) - (lengthM / 2)
  const branchRadius = (DN_TO_MM[branch.dn] / 2) / 1000

  const branchX = side * (branchLengthM / 2) * Math.sin(branchAngleRad)
  const branchZ = (branchLengthM / 2) * Math.cos(branchAngleRad)

  const branchGeom = useMemo(
    () => new CylinderGeometry(branchRadius, branchRadius, branchLengthM, 16),
    [branchRadius, branchLengthM]
  )

  return (
    <CADMesh
      id={id}
      geometry={branchGeom}
      position={[branchX, branchPosM, branchZ]}
      rotation={[-Math.PI / 2, side * branchAngleRad, 0]}
    />
  )
}
