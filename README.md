# Rohr Konfigurator 3D

Ein moderner 3D-Konfigurator für Anlagenbauer zur visuellen Planung von Rohrleitungssystemen mit Echtzeit-Preiskalkulation und AutoCAD-Export.

## Features

- **3D-Visualisierung**: Interaktive 3D-Ansicht mit Three.js und React Three Fiber
- **Komponenten-Bibliothek**:
  - Gerade Rohre (variable Längen)
  - Rohrbögen (45° und 90°)
  - T-Stücke
  - Absperrventile
  - Flansche
  - Reduzierstücke
- **Material-Auswahl**:
  - Stahl (×1.0)
  - Edelstahl (×2.5)
  - Kupfer (×3.0)
  - PVC (×0.4)
  - Material-basierte 3D-Visualisierung mit unterschiedlichen Farben und Eigenschaften
- **Echtzeit-Preiskalkulation**: Automatische Berechnung basierend auf Komponenten, Dimensionen und Material
- **Undo/Redo**:
  - Vollständige History-Verwaltung
  - Tastaturkürzel: Strg+Z (Rückgängig), Strg+Y (Wiederherstellen)
- **AutoCAD Export**: DXF-Export für weitere Planung in CAD-Programmen
- **Projekt-Verwaltung**: Speichern und Laden von Projekten als JSON
- **Intuitive Bedienung**:
  - Drag & Drop Kamerasteuerung
  - Click-to-select Komponenten
  - Echtzeit-Eigenschafts-Editor
  - Keyboard Shortcuts

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production Build
npm run build
```

## Verwendung

1. **Komponente hinzufügen**: Klicken Sie auf eine Komponente in der linken Sidebar
2. **Komponente auswählen**: Klicken Sie auf ein Objekt in der 3D-Ansicht
3. **Eigenschaften bearbeiten**: Nutzen Sie das Properties-Panel zum Anpassen von:
   - Material (Stahl, Edelstahl, Kupfer, PVC)
   - Durchmesser
   - Länge (bei geraden Rohren)
   - Position (X, Y, Z)
   - Rotation (in Grad)
4. **Undo/Redo**: Verwenden Sie Strg+Z und Strg+Y oder die Buttons in der Toolbar
5. **Export**:
   - DXF-Export für AutoCAD
   - JSON-Export zum Speichern des Projekts

## Steuerung

### Kamera
- **Orbit**: Rechte Maustaste + Ziehen
- **Zoom**: Mausrad
- **Pan**: Mittlere Maustaste + Ziehen (optional)

### Tastaturkürzel
- **Strg+Z**: Rückgängig
- **Strg+Y**: Wiederherstellen
- **Strg+Shift+Z**: Wiederherstellen (Alternative)

## Technologie-Stack

- **React 18** + **TypeScript**
- **Vite** - Build Tool
- **Three.js** + **React Three Fiber** - 3D-Rendering
- **@react-three/drei** - 3D-Hilfsbibliothek
- **Zustand** - State Management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Projekt-Struktur

```
src/
├── components/
│   ├── 3d/              # 3D-Komponenten
│   │   ├── Scene3D.tsx
│   │   ├── PipeRenderer.tsx
│   │   ├── StraightPipe.tsx
│   │   ├── ElbowPipe.tsx
│   │   ├── TeePipe.tsx
│   │   ├── Valve.tsx
│   │   ├── Flange.tsx
│   │   └── Reducer.tsx
│   └── ui/              # UI-Komponenten
│       ├── ComponentSelector.tsx
│       ├── PropertiesPanel.tsx
│       ├── PriceDisplay.tsx
│       └── Toolbar.tsx
├── store/
│   └── useConfiguratorStore.ts  # Zustand Store
├── data/
│   └── componentTemplates.ts    # Komponenten-Vorlagen
├── hooks/
│   └── useKeyboardShortcuts.ts  # Keyboard Shortcuts
├── utils/
│   ├── dxfExporter.ts           # DXF Export
│   └── materialColors.ts        # Material-Farben
├── types.ts                      # TypeScript Typen
├── App.tsx                       # Haupt-App
└── main.tsx                      # Entry Point
```

## Preiskalkulation

Die Preise werden automatisch berechnet basierend auf:
- Basis-Preis der Komponente
- Durchmesser
- Länge (bei geraden Rohren)
- Material-Multiplikator:
  - Stahl: ×1.0
  - Edelstahl: ×2.5
  - Kupfer: ×3.0
  - PVC: ×0.4

Beispiel:
- Gerades Rohr 50mm, 1000mm Länge, Stahl: (15,00 € + 0,02 €/mm × 1000mm) × 1.0 = 35,00 €
- Gleiches Rohr aus Edelstahl: (15,00 € + 20,00 €) × 2.5 = 87,50 €

## Implementierte Features ✅

- [x] 3D-Visualisierung mit Three.js
- [x] Komponenten-Bibliothek (6 Typen)
- [x] Material-Auswahl (Stahl, Edelstahl, Kupfer, PVC)
- [x] Echtzeit-Preiskalkulation mit Material-Multiplikatoren
- [x] Undo/Redo Funktionalität
- [x] Keyboard Shortcuts
- [x] DXF-Export für AutoCAD
- [x] JSON-Export zum Speichern
- [x] Material-basierte 3D-Visualisierung

## Geplante Erweiterungen

- [ ] PDF-Export mit Stückliste und technischer Zeichnung
- [ ] 3D-Kollisionserkennung
- [ ] Automatische Rohrverbindungen (Snap-to-Connect)
- [ ] Verbindungspunkte-Visualisierung
- [ ] Mehrere Projekte parallel verwalten
- [ ] Import von DXF-Dateien
- [ ] Foto-realistische Rendering-Option

## Lizenz

Proprietär - Alle Rechte vorbehalten

## Autor

Entwickelt für professionellen Anlagenbau
