// application/ports/ImageStoragePort.ts

export interface ImageFile {
  buffer: Buffer
  originalName: string
  mimetype: string
  size: number
}

export interface SaveImageOptions {
  tenantId: string
  planId: string
  compress?: boolean // Default: true
  maxWidth?: number // Default: 1920px
  quality?: number // Default: 80
}

export interface ImageStoragePort {
  /**
   * Guarda múltiples imágenes y retorna sus URLs
   * @throws StorageError si falla (ej: disco lleno)
   */
  saveImages(
    files: ImageFile[],
    options: SaveImageOptions
  ): Promise<string[]> // Array de URLs/paths

  /**
   * Elimina imágenes (rollback)
   */
  deleteImages(urls: string[]): Promise<void>

  /**
   * Valida formato y tamaño ANTES de guardar
   */
  validateFiles(files: ImageFile[]): void
}
