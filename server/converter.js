import occtimportjs from 'occt-import-js'

let occtInstance = null

// Initialize OCCT (lazy loading)
async function getOcct() {
  if (!occtInstance) {
    console.log('Initializing OpenCASCADE...')
    occtInstance = await occtimportjs()
    console.log('OpenCASCADE ready')
  }
  return occtInstance
}

// Convert STEP buffer to GLB buffer
export async function convertStepToGlb(stepBuffer) {
  const occt = await getOcct()

  // Parse STEP file
  const result = occt.ReadStepFile(new Uint8Array(stepBuffer), null)

  if (!result.success) {
    throw new Error('Failed to parse STEP file')
  }

  if (result.meshes.length === 0) {
    throw new Error('No geometry found in STEP file')
  }

  // Convert to glTF format
  const gltf = meshesToGltf(result.meshes)

  // Convert to GLB (binary glTF)
  const glb = gltfToGlb(gltf)

  return glb
}

// Convert OCCT meshes to glTF JSON structure
function meshesToGltf(meshes) {
  const positions = []
  const normals = []
  const indices = []

  let indexOffset = 0

  // Combine all meshes into one
  for (const mesh of meshes) {
    // Add positions
    for (let i = 0; i < mesh.attributes.position.array.length; i += 3) {
      positions.push(
        mesh.attributes.position.array[i],
        mesh.attributes.position.array[i + 1],
        mesh.attributes.position.array[i + 2]
      )
    }

    // Add normals (if available)
    if (mesh.attributes.normal) {
      for (let i = 0; i < mesh.attributes.normal.array.length; i += 3) {
        normals.push(
          mesh.attributes.normal.array[i],
          mesh.attributes.normal.array[i + 1],
          mesh.attributes.normal.array[i + 2]
        )
      }
    }

    // Add indices with offset
    if (mesh.index) {
      for (const idx of mesh.index.array) {
        indices.push(idx + indexOffset)
      }
    }

    indexOffset += mesh.attributes.position.array.length / 3
  }

  // Calculate bounding box for the model
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i])
    maxX = Math.max(maxX, positions[i])
    minY = Math.min(minY, positions[i + 1])
    maxY = Math.max(maxY, positions[i + 1])
    minZ = Math.min(minZ, positions[i + 2])
    maxZ = Math.max(maxZ, positions[i + 2])
  }

  console.log(`Model bounds: [${minX.toFixed(1)}, ${minY.toFixed(1)}, ${minZ.toFixed(1)}] to [${maxX.toFixed(1)}, ${maxY.toFixed(1)}, ${maxZ.toFixed(1)}]`)
  console.log(`Model size: ${(maxX - minX).toFixed(1)} x ${(maxY - minY).toFixed(1)} x ${(maxZ - minZ).toFixed(1)}`)

  // Build glTF structure
  const positionArray = new Float32Array(positions)
  const normalArray = normals.length > 0 ? new Float32Array(normals) : null
  const indexArray = new Uint32Array(indices)

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'step-converter-server'
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: {
          POSITION: 0
        },
        indices: normalArray ? 2 : 1,
        mode: 4 // TRIANGLES
      }]
    }],
    accessors: [],
    bufferViews: [],
    buffers: []
  }

  // Build binary buffer
  const bufferParts = []
  let byteOffset = 0

  // Position accessor
  gltf.accessors.push({
    bufferView: 0,
    byteOffset: 0,
    componentType: 5126, // FLOAT
    count: positionArray.length / 3,
    type: 'VEC3',
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ]
  })
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: byteOffset,
    byteLength: positionArray.byteLength,
    target: 34962 // ARRAY_BUFFER
  })
  bufferParts.push(positionArray)
  byteOffset += positionArray.byteLength

  // Normal accessor (if available)
  if (normalArray) {
    gltf.meshes[0].primitives[0].attributes.NORMAL = 1
    gltf.accessors.push({
      bufferView: 1,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: normalArray.length / 3,
      type: 'VEC3'
    })
    gltf.bufferViews.push({
      buffer: 0,
      byteOffset: byteOffset,
      byteLength: normalArray.byteLength,
      target: 34962 // ARRAY_BUFFER
    })
    bufferParts.push(normalArray)
    byteOffset += normalArray.byteLength
  }

  // Index accessor
  gltf.accessors.push({
    bufferView: normalArray ? 2 : 1,
    byteOffset: 0,
    componentType: 5125, // UNSIGNED_INT
    count: indexArray.length,
    type: 'SCALAR'
  })
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: byteOffset,
    byteLength: indexArray.byteLength,
    target: 34963 // ELEMENT_ARRAY_BUFFER
  })
  bufferParts.push(indexArray)
  byteOffset += indexArray.byteLength

  // Combine all buffer parts
  const totalLength = bufferParts.reduce((sum, part) => sum + part.byteLength, 0)
  const combinedBuffer = new Uint8Array(totalLength)
  let offset = 0
  for (const part of bufferParts) {
    combinedBuffer.set(new Uint8Array(part.buffer), offset)
    offset += part.byteLength
  }

  gltf.buffers.push({
    byteLength: totalLength
  })

  return { gltf, binaryBuffer: combinedBuffer }
}

// Convert glTF JSON + binary to GLB format
function gltfToGlb(gltfData) {
  const { gltf, binaryBuffer } = gltfData

  // Encode JSON
  const jsonString = JSON.stringify(gltf)
  const jsonBuffer = new TextEncoder().encode(jsonString)

  // Pad JSON to 4-byte alignment
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4
  const paddedJsonBuffer = new Uint8Array(jsonBuffer.length + jsonPadding)
  paddedJsonBuffer.set(jsonBuffer)
  for (let i = 0; i < jsonPadding; i++) {
    paddedJsonBuffer[jsonBuffer.length + i] = 0x20 // space
  }

  // Pad binary to 4-byte alignment
  const binPadding = (4 - (binaryBuffer.length % 4)) % 4
  const paddedBinBuffer = new Uint8Array(binaryBuffer.length + binPadding)
  paddedBinBuffer.set(binaryBuffer)

  // GLB structure:
  // - Header (12 bytes): magic, version, length
  // - JSON chunk (8 + jsonLength bytes)
  // - BIN chunk (8 + binLength bytes)
  const headerLength = 12
  const jsonChunkLength = 8 + paddedJsonBuffer.length
  const binChunkLength = 8 + paddedBinBuffer.length
  const totalLength = headerLength + jsonChunkLength + binChunkLength

  const glb = new ArrayBuffer(totalLength)
  const view = new DataView(glb)
  const uint8View = new Uint8Array(glb)

  // Header
  view.setUint32(0, 0x46546C67, true)  // magic: "glTF"
  view.setUint32(4, 2, true)            // version: 2
  view.setUint32(8, totalLength, true)  // total length

  // JSON chunk header
  view.setUint32(12, paddedJsonBuffer.length, true)  // chunk length
  view.setUint32(16, 0x4E4F534A, true)               // chunk type: "JSON"
  uint8View.set(paddedJsonBuffer, 20)

  // BIN chunk header
  const binChunkStart = 20 + paddedJsonBuffer.length
  view.setUint32(binChunkStart, paddedBinBuffer.length, true)  // chunk length
  view.setUint32(binChunkStart + 4, 0x004E4942, true)          // chunk type: "BIN\0"
  uint8View.set(paddedBinBuffer, binChunkStart + 8)

  return glb
}
