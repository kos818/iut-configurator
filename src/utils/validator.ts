import { PipeComponent } from '../types'
import { validateDNConnection } from './connectionHelpers'
import { getEffectivePipeBodyLength, getEffectiveArmLength, validateEffectiveLength } from './flangeUtils'

/**
 * Validates all components in the configuration
 * Returns an array of validation issues
 */
export interface ValidationIssue {
  componentId: string
  type: 'error' | 'warning'
  message: string
}

export const validateConfiguration = (components: PipeComponent[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = []

  // Build a map of connection points for quick lookup
  const connectionPointMap = new Map<string, { component: PipeComponent; cpIndex: number }>()
  components.forEach((component) => {
    component.connectionPoints.forEach((cp, index) => {
      connectionPointMap.set(cp.id, { component, cpIndex: index })
    })
  })

  // Check each component
  components.forEach((component) => {
    // Check for disconnected connection points (warning)
    const unconnectedCount = component.connectionPoints.filter(cp => cp.connectedTo === null).length
    if (unconnectedCount > 0 && components.length > 1) {
      issues.push({
        componentId: component.id,
        type: 'warning',
        message: `${unconnectedCount} offene Verbindung${unconnectedCount > 1 ? 'en' : ''}`,
      })
    }

    // Check effective length when flanges are included
    const flangesIncluded = component.flangesIncludedInLength ?? true
    if (component.type === 'straight' && component.length) {
      const effLength = getEffectivePipeBodyLength(
        component.length, component.connectionPoints, component.dn, component.pn, flangesIncluded
      )
      const err = validateEffectiveLength(effLength, 'Rohr')
      if (err) issues.push({ componentId: component.id, type: 'error', message: err })
    }
    if (component.type === 'elbow') {
      const rawIn = component.elbowArmLengths?.inlet || 150
      const rawOut = component.elbowArmLengths?.outlet || 150
      const effIn = getEffectiveArmLength(rawIn, 'A', component.connectionPoints, component.dn, component.pn, flangesIncluded)
      const effOut = getEffectiveArmLength(rawOut, 'B', component.connectionPoints, component.dn, component.pn, flangesIncluded)
      const errIn = validateEffectiveLength(effIn, 'Bogen Arm A')
      const errOut = validateEffectiveLength(effOut, 'Bogen Arm B')
      if (errIn) issues.push({ componentId: component.id, type: 'error', message: errIn })
      if (errOut) issues.push({ componentId: component.id, type: 'error', message: errOut })
    }
    if (component.type === 'tee') {
      const rawIn = component.teeArmLengths?.inlet || component.armLength || 200
      const rawOut = component.teeArmLengths?.outlet || component.armLength || 200
      const rawBr = component.teeArmLengths?.branch || component.armLength || 200
      const effIn = getEffectiveArmLength(rawIn, 'A', component.connectionPoints, component.dn, component.pn, flangesIncluded)
      const effOut = getEffectiveArmLength(rawOut, 'B', component.connectionPoints, component.dn, component.pn, flangesIncluded)
      const effBr = getEffectiveArmLength(rawBr, 'C', component.connectionPoints, component.dn, component.pn, flangesIncluded)
      const errIn = validateEffectiveLength(effIn, 'T-Stück Arm A')
      const errOut = validateEffectiveLength(effOut, 'T-Stück Arm B')
      const errBr = validateEffectiveLength(effBr, 'T-Stück Arm C')
      if (errIn) issues.push({ componentId: component.id, type: 'error', message: errIn })
      if (errOut) issues.push({ componentId: component.id, type: 'error', message: errOut })
      if (errBr) issues.push({ componentId: component.id, type: 'error', message: errBr })
    }

    // Check DN compatibility for each connection
    component.connectionPoints.forEach((cp) => {
      if (cp.connectedTo) {
        const connectedCP = connectionPointMap.get(cp.connectedTo)
        if (connectedCP) {
          const validation = validateDNConnection(cp.dn, connectedCP.component.connectionPoints[connectedCP.cpIndex].dn)
          if (!validation.isValid) {
            issues.push({
              componentId: component.id,
              type: 'error',
              message: validation.message || 'DN-Inkompatibilität',
            })
          } else if (validation.message) {
            // Warning for minor DN differences
            issues.push({
              componentId: component.id,
              type: 'warning',
              message: validation.message,
            })
          }
        }
      }
    })
  })

  return issues
}

/**
 * Updates component validation status based on validation issues
 */
export const updateComponentValidation = (
  components: PipeComponent[],
  issues: ValidationIssue[]
): PipeComponent[] => {
  return components.map((component) => {
    const componentIssues = issues.filter(issue => issue.componentId === component.id)
    const hasErrors = componentIssues.some(issue => issue.type === 'error')

    return {
      ...component,
      isValid: !hasErrors,
      validationMessages: componentIssues.map(issue => issue.message),
    }
  })
}
