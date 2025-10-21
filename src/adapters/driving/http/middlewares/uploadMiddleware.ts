// adapters/http/middlewares/uploadMiddleware.ts

import multer from 'multer';

// Configurar multer para usar almacenamiento en memoria
const storage = multer.memoryStorage();

// Limitar el número de archivos y su tamaño si es necesario
const upload = multer({
  storage: storage,
  limits: {
    files: 3, // Máximo 3 archivos, como se especifica en los criterios de aceptación
    fileSize: 100 * 1024 * 1024, // 100 MB por archivo, como se especifica
  },
});

// El nombre del campo en el formulario debe ser 'images' para que coincida
export const uploadMiddleware = upload.array('images', 3);
