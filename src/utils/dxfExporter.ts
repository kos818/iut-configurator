import { PipeComponent } from '../types'
import { downloadText } from './downloadHelper'

// Simplified DXF export - generates basic DXF format for AutoCAD
export const exportToDXF = (components: PipeComponent[], projectName: string) => {
  const dxfContent = generateDXF(components)
  downloadText(dxfContent, `${projectName}_${Date.now()}.dxf`, 'application/dxf')
}

const generateDXF = (components: PipeComponent[]): string => {
  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LTYPE
0
LTYPE
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
ENDTAB
0
TABLE
2
LAYER
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
PIPES
70
0
62
1
6
CONTINUOUS
0
LAYER
2
FITTINGS
70
0
62
3
6
CONTINUOUS
0
LAYER
2
CONNECTIONS
70
0
62
5
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`

  // Add each component as a 2D entity (Top view projection: X-Y plane)
  components.forEach((component) => {
    const layer = component.type === 'straight' ? 'PIPES' : 'FITTINGS'

    // Convert position to mm (DXF typically uses mm)
    // Project to 2D top view (X-Y plane, Z=0)
    const x = component.position.x * 1000
    const y = component.position.y * 1000

    if (component.type === 'straight' && component.length) {
      // Draw pipe as 2D line with proper rotation projection
      const length = component.length / 1000 // Convert to meters

      // Calculate start and end points of the pipe in 3D
      // Pipe is along Y-axis in local coordinates: from (0, -length/2, 0) to (0, length/2, 0)
      const startLocal = { x: 0, y: -length / 2, z: 0 }
      const endLocal = { x: 0, y: length / 2, z: 0 }

      // Apply rotation (simple 2D rotation around Z-axis for top view)
      const rotZ = component.rotation.z
      const cosZ = Math.cos(rotZ)
      const sinZ = Math.sin(rotZ)

      // Rotate and translate to world coordinates
      const startX = (startLocal.x * cosZ - startLocal.y * sinZ) * 1000 + x
      const startY = (startLocal.x * sinZ + startLocal.y * cosZ) * 1000 + y
      const endX = (endLocal.x * cosZ - endLocal.y * sinZ) * 1000 + x
      const endY = (endLocal.x * sinZ + endLocal.y * cosZ) * 1000 + y

      // Draw as 2D line (Z=0)
      dxf += `0
LINE
8
${layer}
10
${startX.toFixed(3)}
20
${startY.toFixed(3)}
30
0.0
11
${endX.toFixed(3)}
21
${endY.toFixed(3)}
31
0.0
`
    } else {
      // Draw other components as circles (top view) with text annotation
      dxf += `0
CIRCLE
8
${layer}
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0.0
40
${(component.dn / 2).toFixed(3)}
0
TEXT
8
${layer}
10
${x.toFixed(3)}
20
${(y + component.dn).toFixed(3)}
30
0.0
40
${(component.dn * 0.3).toFixed(3)}
1
${component.type.toUpperCase()}
`
    }

    // Add dimension annotation
    dxf += `0
TEXT
8
${layer}
10
${(x + component.dn).toFixed(3)}
20
${y.toFixed(3)}
30
0.0
40
${(component.dn * 0.2).toFixed(3)}
1
DN${component.dn}
`
  })

  // Add connection lines
  components.forEach((component) => {
    component.connectionPoints.forEach((cp) => {
      if (cp.connectedTo && cp.id < cp.connectedTo) { // Avoid duplicates
        // Find the connected component
        const connectedComp = components.find((c) =>
          c.connectionPoints.some((p) => p.id === cp.connectedTo)
        )
        if (connectedComp) {
          const x1 = component.position.x * 1000
          const y1 = component.position.y * 1000
          const x2 = connectedComp.position.x * 1000
          const y2 = connectedComp.position.y * 1000

          // Draw connection line
          dxf += `0
LINE
8
CONNECTIONS
10
${x1.toFixed(3)}
20
${y1.toFixed(3)}
30
0.0
11
${x2.toFixed(3)}
21
${y2.toFixed(3)}
31
0.0
`
        }
      }
    })
  })

  dxf += `0
ENDSEC
0
EOF
`

  return dxf
}

// Export as JSON for saving/loading projects
export const exportToJSON = (components: PipeComponent[], projectName: string) => {
  const projectData = {
    name: projectName,
    version: '1.0',
    createdAt: new Date().toISOString(),
    components: components.map(c => ({
      ...c,
      position: { x: c.position.x, y: c.position.y, z: c.position.z },
      rotation: { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z },
    })),
  }

  const json = JSON.stringify(projectData, null, 2)
  downloadText(json, `${projectName}_${Date.now()}.json`, 'application/json')
}
