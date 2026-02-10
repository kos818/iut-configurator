import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { convertStepToGlb } from './converter.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

// Enable CORS for the React dev server
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
}))

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase()
    if (ext.endsWith('.step') || ext.endsWith('.stp')) {
      cb(null, true)
    } else {
      cb(new Error('Only .step and .stp files are allowed'))
    }
  }
})

// Directory for converted models
const modelsDir = join(__dirname, '..', 'public', 'models', 'converted')
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true })
}

// Root page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>STEP Converter Server</title></head>
      <body style="font-family: sans-serif; padding: 40px; background: #1a1a2e; color: #eee;">
        <h1>🔧 STEP Converter Server</h1>
        <p style="color: #4ade80;">✓ Server is running on port 3001</p>

        <h3>API Endpoints:</h3>
        <ul style="line-height: 2;">
          <li>
            <a href="http://localhost:3001/api/convert" style="color: #60a5fa;">http://localhost:3001/api/convert</a>
            <span style="color: #888;"> - POST to upload .step/.stp file</span>
          </li>
          <li>
            <a href="http://localhost:3001/api/models" style="color: #60a5fa;">http://localhost:3001/api/models</a>
            <span style="color: #888;"> - GET list of converted models</span>
          </li>
          <li>
            <a href="http://localhost:3001/api/health" style="color: #60a5fa;">http://localhost:3001/api/health</a>
            <span style="color: #888;"> - GET health check</span>
          </li>
        </ul>

        <h3>Quick Test:</h3>
        <form action="http://localhost:3001/api/convert" method="post" enctype="multipart/form-data" style="background: #2a2a4e; padding: 20px; border-radius: 8px;">
          <input type="file" name="file" accept=".step,.stp" style="margin-bottom: 10px;" />
          <br/>
          <button type="submit" style="background: #4ade80; color: #000; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
            Upload & Convert
          </button>
        </form>

        <h3 style="margin-top: 30px;">React App:</h3>
        <p>
          <a href="http://localhost:3000" style="color: #60a5fa; font-size: 18px;">http://localhost:3000</a>
          <span style="color: #888;"> - Main application with STEP uploader in sidebar</span>
        </p>
      </body>
    </html>
  `)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'STEP converter server is running' })
})

// Convert endpoint - GET shows instructions
app.get('/api/convert', (req, res) => {
  res.json({
    message: 'Use POST to upload a STEP file',
    usage: 'curl -X POST -F "file=@your-model.step" http://localhost:3001/api/convert',
    note: 'Or use the upload form in the React app at http://localhost:3000'
  })
})

// Convert STEP to GLB endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    console.log(`Converting: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`)

    // Convert STEP buffer to GLB
    const glbBuffer = await convertStepToGlb(req.file.buffer)

    // Generate filename
    const baseName = req.file.originalname.replace(/\.(step|stp)$/i, '')
    const fileName = `${baseName}_${Date.now()}.glb`
    const filePath = join(modelsDir, fileName)

    // Save to public folder
    fs.writeFileSync(filePath, Buffer.from(glbBuffer))

    console.log(`Saved: ${fileName}`)

    // Return the URL to access the converted model
    res.json({
      success: true,
      fileName,
      url: `/models/converted/${fileName}`,
      size: glbBuffer.byteLength
    })

  } catch (error) {
    console.error('Conversion error:', error)
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    })
  }
})

// List converted models
app.get('/api/models', (req, res) => {
  try {
    const files = fs.readdirSync(modelsDir)
      .filter(f => f.endsWith('.glb'))
      .map(f => ({
        name: f,
        url: `/models/converted/${f}`,
        size: fs.statSync(join(modelsDir, f)).size
      }))
    res.json(files)
  } catch (error) {
    res.json([])
  }
})

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  STEP Converter Server                                ║
║  Running on http://localhost:${PORT}                    ║
║                                                       ║
║  Endpoints:                                           ║
║  - POST /api/convert  (upload .step/.stp file)        ║
║  - GET  /api/models   (list converted models)         ║
║  - GET  /api/health   (health check)                  ║
╚═══════════════════════════════════════════════════════╝
  `)
})
