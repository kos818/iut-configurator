import React, { useRef } from 'react'
import { Mesh } from 'three'
import { getMaterialColor, getMaterialMetalness, getMaterialRoughness } from '../../utils/materialColors'
import { useDraggable } from '../../hooks/useDraggable'
import { BranchConfig, DN_TO_MM } from '../../types'

interface PipeWithBranchesProps {
  id: string
  diameter: number // Main pipe diameter in mm
  length: number // Main pipe length in mm
  branch1?: BranchConfig
  branch2?: BranchConfig
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  material: string
}

/**
 * PipeWithBranches - Straight pipe with one or two side branches
 * Used for FF-piece with branches, FFFOR, etc.
 */
export const PipeWithBranches: React.FC<PipeWithBranchesProps> = ({
  id,
  diameter,
  length,
  branch1,
  branch2,
  position,
  rotation,
  selected,
  material,
}) => {
  const meshRef = useRef<Mesh>(null)
  const { dragHandlers } = useDraggable(id)

  const mainRadius = (diameter / 2) / 1000
  const lengthM = length / 1000

  const color = getMaterialColor(material, selected)
  const metalness = getMaterialMetalness(material)
  const roughness = getMaterialRoughness(material)

  return (
    <group position={position} rotation={rotation} {...dragHandlers}>
      {/* Main pipe (vertical) */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[mainRadius, mainRadius, lengthM, 16]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>

      {/* Branch 1 */}
      {branch1 && (
        (() => {
          const branchLengthM = branch1.length / 1000
          const branchAngleRad = (branch1.angle * Math.PI) / 180
          const branchPosM = (branch1.position * lengthM) - (lengthM / 2)
          const branchRadius = (DN_TO_MM[branch1.dn] / 2) / 1000

          // Calculate branch position and rotation
          const branchX = (branchLengthM / 2) * Math.sin(branchAngleRad)
          const branchZ = (branchLengthM / 2) * Math.cos(branchAngleRad)

          // Rotation to align cylinder with branch direction
          const rotationZ = -branchAngleRad

          return (
            <mesh
              position={[branchX, branchPosM, branchZ]}
              rotation={[0, 0, rotationZ]}
            >
              <cylinderGeometry args={[branchRadius, branchRadius, branchLengthM, 16]} />
              <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
            </mesh>
          )
        })()
      )}

      {/* Branch 2 */}
      {branch2 && (
        (() => {
          const branchLengthM = branch2.length / 1000
          const branchAngleRad = (branch2.angle * Math.PI) / 180
          const branchPosM = (branch2.position * lengthM) - (lengthM / 2)
          const branchRadius = (DN_TO_MM[branch2.dn] / 2) / 1000

          // Calculate branch position (opposite side from branch1)
          const branchX = -(branchLengthM / 2) * Math.sin(branchAngleRad)
          const branchZ = (branchLengthM / 2) * Math.cos(branchAngleRad)

          // Rotation to align cylinder with branch direction
          const rotationZ = branchAngleRad

          return (
            <mesh
              position={[branchX, branchPosM, branchZ]}
              rotation={[0, 0, rotationZ]}
            >
              <cylinderGeometry args={[branchRadius, branchRadius, branchLengthM, 16]} />
              <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
            </mesh>
          )
        })()
      )}

      {/* Junction spheres at branch connection points */}
      {branch1 && (
        (() => {
          const branchPosM = (branch1.position * lengthM) - (lengthM / 2)
          return (
            <mesh position={[0, branchPosM, 0]}>
              <sphereGeometry args={[mainRadius * 1.3, 16, 16]} />
              <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
            </mesh>
          )
        })()
      )}

      {branch2 && (
        (() => {
          const branchPosM = (branch2.position * lengthM) - (lengthM / 2)
          return (
            <mesh position={[0, branchPosM, 0]}>
              <sphereGeometry args={[mainRadius * 1.3, 16, 16]} />
              <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
            </mesh>
          )
        })()
      )}
    </group>
  )
}
