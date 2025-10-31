import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Microservicio de Planes Turísticos API',
      version: '1.0.0',
      description: 'API para la gestión de planes turísticos, construido con arquitectura hexagonal.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    // Usa paths absolutos desde la raíz del proyecto para evitar problemas de build (dist/src)
    path.resolve(process.cwd(), 'src/adapters/driving/http/routes/**/*.ts'),
    path.resolve(process.cwd(), 'src/application/dtos/**/*.ts'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
