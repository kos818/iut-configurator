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
- **Echtzeit-Preiskalkulation**: Automatische Berechnung basierend auf Komponenten und Dimensionen
- **AutoCAD Export**: DXF-Export für weitere Planung in CAD-Programmen
- **Projekt-Verwaltung**: Speichern und Laden von Projekten als JSON
- **Intuitive Bedienung**:
  - Drag & Drop Kamerasteuerung
  - Click-to-select Komponenten
  - Echtzeit-Eigenschafts-Editor

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
   - Durchmesser
   - Länge (bei geraden Rohren)
   - Position (X, Y, Z)
   - Rotation (in Grad)
4. **Export**:
   - DXF-Export für AutoCAD
   - JSON-Export zum Speichern des Projekts

## Kamera-Steuerung

- **Orbit**: Rechte Maustaste + Ziehen
- **Zoom**: Mausrad
- **Pan**: Mittlere Maustaste + Ziehen (optional)

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
├── utils/
│   └── dxfExporter.ts           # DXF Export
├── types.ts                      # TypeScript Typen
├── App.tsx                       # Haupt-App
└── main.tsx                      # Entry Point
```

## Preiskalkulation

Die Preise werden automatisch berechnet basierend auf:
- Basis-Preis der Komponente
- Durchmesser
- Länge (bei geraden Rohren)
- Material-Multiplikatoren (optional)

Beispiel:
- Gerades Rohr 50mm, 1000mm Länge: 15,00 € Basis + (0,02 €/mm × 1000mm) = 35,00 €

## Zukünftige Erweiterungen

- [ ] 3D-Kollisionserkennung
- [ ] Automatische Rohrverbindungen
- [ ] Material-Auswahl (Stahl, Edelstahl, Kupfer, PVC)
- [ ] PDF-Export mit Stückliste
- [ ] Mehrere Projekte parallel verwalten
- [ ] Undo/Redo Funktionalität
- [ ] Import von DXF-Dateien

## Lizenz

Proprietär - Alle Rechte vorbehalten

## Autor

Entwickelt für professionellen Anlagenbau
