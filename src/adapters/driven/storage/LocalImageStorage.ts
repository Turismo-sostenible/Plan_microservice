import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

import { ImageStoragePort, ImageFile, SaveImageOptions } from '../../application/ports/ImageStoragePort'
import { ValidationError } from '../../domain/errors/ValidationError'
import { LoggerPort } from '../../application/ports/LoggerPort'

export class LocalImageStorage implements ImageStoragePort {
  private readonly baseDir: string

  constructor(
    baseDir: string, // Ej: './uploads'
    private readonly logger: LoggerPort
  ) {
    this.baseDir = path.resolve(baseDir)
  }

  validateFiles(files: ImageFile[]): void {
    // Validar cantidad
    if (files.length < 1 || files.length > 3) {
      throw new ValidationError(
        'imagenes',
        'Debe incluir entre 1 y 3 imágenes'
      )
    }

    // Validar cada archivo
    for (const file of files) {
      // Validar formato
      const allowedTypes = ['image/jpeg', 'image/png']
      if (!allowedTypes.includes(file.mimetype)) {
        throw new ValidationError(
          'imagenes',
          `Formato no permitido: ${file.mimetype}. Solo JPG y PNG`
        )
      }

      // Validar tamaño (100MB = 104857600 bytes)
      const maxSize = 104857600
      if (file.size > maxSize) {
        throw new ValidationError(
          'imagenes',
          `Imagen ${file.originalName} excede el tamaño máximo de 100MB`
        )
      }
    }
  }

  async saveImages(
    files: ImageFile[],
    options: SaveImageOptions
  ): Promise<string[]> {
    // Crear directorio si no existe
    const uploadDir = path.join(
      this.baseDir,
      'planes',
      options.tenantId,
      options.planId
    )

    await fs.mkdir(uploadDir, { recursive: true })

    const savedUrls: string[] = []

    try {
      for (const file of files) {
        const url = await this.saveAndCompressImage(file, uploadDir, options)
        savedUrls.push(url)
      }

      this.logger.info('Imágenes guardadas exitosamente', {
        count: savedUrls.length,
        tenantId: options.tenantId,
        planId: options.planId
      })

      return savedUrls
    } catch (error) {
      // Si falla alguna, eliminar las que ya se guardaron
      await this.deleteImages(savedUrls).catch(err => {
        this.logger.error('Error al hacer rollback de imágenes', err)
      })

      throw error
    }
  }

  private async saveAndCompressImage(
    file: ImageFile,
    uploadDir: string,
    options: SaveImageOptions
  ): Promise<string> {
    // Generar nombre único
    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg'
    const filename = `${uuidv4()}.${ext}`
    const filePath = path.join(uploadDir, filename)

    // Comprimir imagen con sharp
    const shouldCompress = options.compress !== false
    const maxWidth = options.maxWidth || 1920
    const quality = options.quality || 80

    if (shouldCompress) {
      await sharp(file.buffer)
        .resize(maxWidth, null, {
          withoutEnlargement: true, // No agrandar si es más pequeña
          fit: 'inside'
        })
        .jpeg({ quality }) // Convertir todo a JPEG para uniformidad
        .toFile(filePath)

      this.logger.debug('Imagen comprimida', {
        original: file.originalName,
        saved: filename,
        originalSize: file.size
      })
    } else {
      // Guardar sin comprimir
      await fs.writeFile(filePath, file.buffer)
    }

    // Retornar ruta relativa (desde baseDir)
    return `/uploads/planes/${options.tenantId}/${options.planId}/${filename}`
  }

  async deleteImages(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        const filePath = path.join(this.baseDir, url.replace('/uploads/', ''))
        await fs.unlink(filePath)
        
        this.logger.debug('Imagen eliminada', { url })
      } catch (error) {
        this.logger.warn('Error al eliminar imagen', {
          url,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }
  }
}
