const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.txt', '.pdf', '.docx', '.pptx']

export function isSupportedDocument(fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  return SUPPORTED_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

export function supportedDocumentAccept(): string {
  return SUPPORTED_EXTENSIONS.join(',')
}

export function supportedDocumentLabel(): string {
  return '.md, .txt, .pdf, .docx, .pptx'
}

export function validateMarkdownFile(fileName: string): boolean {
  return isSupportedDocument(fileName)
}
