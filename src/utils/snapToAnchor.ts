import { Vector3, Quaternion } from 'three'

export interface Anchor {
  position: Vector3
  direction: Vector3
}

export function snapToAnchor(
  _source: Anchor,
  _target: Anchor
): { position: Vector3; rotation: Quaternion } {
  // Stub: returns target position + identity rotation
  return {
    position: _target.position.clone(),
    rotation: new Quaternion(),
  }
}
