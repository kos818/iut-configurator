/**
 * Centralized flange thickness and deduction logic.
 * Phase 1: thickness = dn * 0.2 (matches current visualizer).
 * Ready for DIN lookup table in the future.
 */
import { ConnectionPoint, DNValue, PNValue } from '../types'

/** Returns flange thickness in mm for a given DN (and optional PN). */
export const getFlangeThickness = (dn: DNValue, _pn?: PNValue): number => {
  return dn * 0.2
}

/** Sums flange thickness for all CPs with connectionMethod === 'flanged'. */
export const calculateFlangeDeduction = (
  connectionPoints: ConnectionPoint[],
  dn: DNValue,
  pn?: PNValue
): number => {
  const thickness = getFlangeThickness(dn, pn)
  const flangedCount = connectionPoints.filter(cp => cp.connectionMethod === 'flanged').length
  return flangedCount * thickness
}

/**
 * Returns effective pipe body length for straight pipes.
 * If flangesIncluded is true, the body shrinks by the total flange deduction.
 */
export const getEffectivePipeBodyLength = (
  overallLength: number,
  connectionPoints: ConnectionPoint[],
  dn: DNValue,
  pn?: PNValue,
  flangesIncluded: boolean = true
): number => {
  if (!flangesIncluded) return overallLength
  const deduction = calculateFlangeDeduction(connectionPoints, dn, pn)
  return overallLength - deduction
}

/**
 * Returns effective arm length for a specific arm (by CP label 'A', 'B', 'C').
 * Only deducts if that specific CP is flanged.
 */
export const getEffectiveArmLength = (
  armLength: number,
  cpLabel: string,
  connectionPoints: ConnectionPoint[],
  dn: DNValue,
  pn?: PNValue,
  flangesIncluded: boolean = true
): number => {
  if (!flangesIncluded) return armLength
  const cp = connectionPoints.find(p => p.label === cpLabel)
  if (!cp || cp.connectionMethod !== 'flanged') return armLength
  return armLength - getFlangeThickness(dn, pn)
}

/**
 * Validates that effective body/arm length is not too short.
 * Returns error string if body < minLength mm, null otherwise.
 */
export const validateEffectiveLength = (
  effectiveLength: number,
  label: string,
  minLength: number = 50
): string | null => {
  if (effectiveLength < minLength) {
    return `${label}: Effektive Länge (${Math.round(effectiveLength)} mm) ist zu kurz (min. ${minLength} mm)`
  }
  return null
}
