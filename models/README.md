# CAD Models for Rohr Konfigurator 3D

Place your converted `.glb` files in the appropriate subdirectories.

## Directory Structure

```
models/
├── pipes/
│   ├── straight.glb
│   ├── f_piece.glb
│   └── ff_piece.glb
├── elbows/
│   ├── elbow_90.glb
│   ├── frk_equal.glb
│   └── frk_unequal.glb
├── tees/
│   ├── tee.glb
│   ├── ffft_symmetrical.glb
│   ├── ffft_asymmetrical.glb
│   ├── ffq_equal.glb
│   ├── ffq_unequal.glb
│   ├── cross.glb
│   ├── wye.glb
│   └── wye_angled.glb
├── valves/
│   ├── valve.glb
│   └── check_valve.glb
└── fittings/
    ├── flange.glb
    ├── reducer.glb
    └── cap.glb
```

## Model Requirements

### Reference Size
All models should be designed at **DN100** (100mm diameter). The application will scale them dynamically for other DN sizes.

### Units
Models should be in **millimeters** (mm).

### Origin
The model's origin (0, 0, 0) should be at the **center** of the component.

### Orientation
- **Y-axis**: Primary flow direction (up = outlet, down = inlet)
- **X-axis**: Secondary/branch direction (for T-pieces, etc.)
- **Z-axis**: Depth

### Materials
Models can have any material - the application will override all materials with its own material system (steel, stainless, copper, PVC).

### Geometry
- Use double-sided faces for visibility from all angles
- Keep polygon count reasonable for web performance
- Recommended: 1000-5000 triangles per component

## Converting STEP to glTF

### Using FreeCAD

1. Open FreeCAD (v0.20+)
2. File → Import → Select your .step file
3. Select the imported object
4. File → Export → Choose "glTF 2.0 (*.gltf *.glb)"
5. Save as .glb (binary format, smaller file)

### Using Blender

1. Install Blender (free)
2. Import STEP (may need CAD addon)
3. File → Export → glTF 2.0 (.glb)
4. Settings:
   - Format: glTF Binary (.glb)
   - Include: Selected Objects
   - Transform: +Y Up

## Testing

After adding a model, refresh the application. If the model loads successfully, it will replace the procedural geometry. If the model is missing or fails to load, the procedural fallback will be used automatically.
