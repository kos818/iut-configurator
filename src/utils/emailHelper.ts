/**
 * Email helper - localStorage persistence + mailto: link generation
 */

const STORAGE_KEY = 'kos-configurator-email'

export const loadSavedEmail = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export const saveEmail = (email: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, email)
  } catch {
    // localStorage unavailable - silently ignore
  }
}

interface MailtoConfig {
  to: string
  projectName: string
  componentCount: number
  totalPrice: number
}

export const openMailtoLink = ({ to, projectName, componentCount, totalPrice }: MailtoConfig) => {
  const subject = encodeURIComponent(`Stückliste: ${projectName}`)
  const body = encodeURIComponent(
    `Sehr geehrte Damen und Herren,\n\n` +
    `anbei erhalten Sie die Stückliste für das Projekt "${projectName}".\n\n` +
    `Zusammenfassung:\n` +
    `- Komponenten: ${componentCount}\n` +
    `- Gesamtpreis: ${totalPrice.toFixed(2)} €\n\n` +
    `Bitte beachten Sie die angehängte PDF-Datei mit der vollständigen Stückliste.\n\n` +
    `Mit freundlichen Grüßen`
  )

  window.open(`mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`, '_self')
}
