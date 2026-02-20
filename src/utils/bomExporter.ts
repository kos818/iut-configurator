/**
 * BOM (Bill of Materials / Stückliste) Export - CSV + PDF
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PipeComponent } from '../types'
import { componentTemplates } from '../data/componentTemplates'
import { downloadBlob, downloadText } from './downloadHelper'

// Material display names (German)
const MATERIAL_NAMES: Record<string, string> = {
  steel: 'Stahl',
  stainless_v2a: 'V2A (1.4301)',
  stainless_v4a: 'V4A (1.4401)',
}

// Column headers for the BOM table
const BOM_HEADERS = [
  'Pos',
  'Bezeichnung',
  'DN',
  'PN',
  'Länge (mm)',
  'Winkel (°)',
  'Material',
  'Wandstärke (mm)',
  'Preis (EUR)',
]

interface BOMRow {
  pos: number
  name: string
  dn: number
  pn: number
  length: string
  angle: string
  material: string
  wallThickness: string
  price: string
}

/** Find the German display name for a component */
const getComponentName = (component: PipeComponent): string => {
  const template = componentTemplates.find(t => t.type === component.type)
  return template?.name ?? component.type
}

/** Get the relevant length/dimension for a component */
const getComponentLength = (component: PipeComponent): string => {
  if (component.type === 'straight' && component.length) {
    return component.length.toString()
  }
  if (component.elbowArmLengths) {
    return `${component.elbowArmLengths.inlet}/${component.elbowArmLengths.outlet}`
  }
  if (component.teeArmLengths) {
    return `${component.teeArmLengths.inlet}/${component.teeArmLengths.outlet}/${component.teeArmLengths.branch}`
  }
  if (component.length) {
    return component.length.toString()
  }
  if (component.armLength) {
    return component.armLength.toString()
  }
  return '-'
}

/** Build BOM rows from components array */
export const buildBOMRows = (components: PipeComponent[]): BOMRow[] => {
  return components.map((comp, index) => ({
    pos: index + 1,
    name: getComponentName(comp),
    dn: comp.dn,
    pn: comp.pn,
    length: getComponentLength(comp),
    angle: comp.angle ? comp.angle.toString() : '-',
    material: MATERIAL_NAMES[comp.material] ?? comp.material,
    wallThickness: comp.wallThickness ? comp.wallThickness.toString() : '-',
    price: comp.price.toFixed(2),
  }))
}

/** Export BOM as CSV (semicolon-separated for German Excel, UTF-8 BOM) */
export const exportToCSV = (components: PipeComponent[], projectName: string) => {
  const rows = buildBOMRows(components)
  const totalPrice = components.reduce((sum, c) => sum + c.price, 0)

  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'

  const header = BOM_HEADERS.join(';')
  const dataLines = rows.map(r =>
    [r.pos, r.name, `DN${r.dn}`, `PN${r.pn}`, r.length, r.angle, r.material, r.wallThickness, r.price].join(';')
  )
  const totalLine = ['', '', '', '', '', '', '', 'Gesamt:', totalPrice.toFixed(2)].join(';')

  const csv = BOM + [header, ...dataLines, '', totalLine].join('\r\n')
  downloadText(csv, `${projectName}_Stueckliste_${Date.now()}.csv`, 'text/csv;charset=utf-8')
}

/** Export BOM as PDF via jsPDF + jspdf-autotable */
export const exportToPDF = (components: PipeComponent[], projectName: string, totalPrice: number) => {
  const rows = buildBOMRows(components)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(0, 43, 80) // #002B50
  doc.text(`Stückliste: ${projectName}`, 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 28)

  // Table
  const tableData = rows.map(r => [
    r.pos.toString(),
    r.name,
    `DN${r.dn}`,
    `PN${r.pn}`,
    r.length,
    r.angle,
    r.material,
    r.wallThickness,
    `${r.price} €`,
  ])

  autoTable(doc, {
    startY: 34,
    head: [BOM_HEADERS],
    body: tableData,
    foot: [['', '', '', '', '', '', '', 'Gesamt:', `${totalPrice.toFixed(2)} €`]],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 75, 135], // #004B87
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: [240, 244, 248],
      textColor: [0, 43, 80],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 3,
    },
    didDrawPage: (data) => {
      // Footer with page numbers
      const pageCount = doc.getNumberOfPages()
      const pageNumber = data.pageNumber
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Seite ${pageNumber} von ${pageCount}`,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 10
      )
      doc.text('KOS Rohr-Konfigurator', 14, doc.internal.pageSize.getHeight() - 10)
    },
  })

  const blob = doc.output('blob')
  downloadBlob(blob, `${projectName}_Stueckliste_${Date.now()}.pdf`)
}
