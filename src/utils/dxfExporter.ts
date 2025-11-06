import { PipeComponent } from '../types'

// Simplified DXF export - generates basic DXF format for AutoCAD
export const exportToDXF = (components: PipeComponent[], projectName: string) => {
  const dxfContent = generateDXF(components)

  // Create blob and download
  const blob = new Blob([dxfContent], { type: 'application/dxf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${projectName}_${Date.now()}.dxf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`

  // Add each component as a 3D entity
  components.forEach((component) => {
    const layer = component.type === 'straight' ? 'PIPES' : 'FITTINGS'

    // Convert position to mm (DXF typically uses mm)
    const x = component.position.x * 1000
    const y = component.position.y * 1000
    const z = component.position.z * 1000

    if (component.type === 'straight' && component.length) {
      // Draw as 3D line/polyline
      const length = component.length
      const rotX = component.rotation.x
      const rotZ = component.rotation.z

      // Calculate end point (simplified - assumes vertical pipe)
      const endY = y + length * Math.cos(rotX) * Math.cos(rotZ)

      dxf += `0
LINE
8
${layer}
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
${z.toFixed(3)}
11
${x.toFixed(3)}
21
${endY.toFixed(3)}
31
${z.toFixed(3)}
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
${z.toFixed(3)}
40
${(component.diameter / 2).toFixed(3)}
0
TEXT
8
${layer}
10
${x.toFixed(3)}
20
${(y + component.diameter).toFixed(3)}
30
${z.toFixed(3)}
40
${(component.diameter * 0.3).toFixed(3)}
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
${(x + component.diameter).toFixed(3)}
20
${y.toFixed(3)}
30
${z.toFixed(3)}
40
${(component.diameter * 0.2).toFixed(3)}
1
D${component.diameter}
`
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
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${projectName}_${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
