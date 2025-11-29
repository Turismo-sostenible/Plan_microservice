# Etapa 1: Construcción (Builder)
FROM node:22-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiamos el código fuente
COPY . .

# Compilamos TypeScript a JavaScript (crea carpeta dist)
RUN npm run build

# Etapa 2: Producción (Runner)
FROM node:22-alpine AS runner

WORKDIR /app

# Instalamos solo dependencias de producción para aligerar la imagen
COPY package*.json ./
RUN npm ci --only=production

# Copiamos los archivos compilados desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Creamos el directorio de uploads y asignamos permisos al usuario 'node'
RUN mkdir -p uploads && chown -R node:node uploads

# --- Variables de Entorno Solicitadas ---
# Base de datos (Nota: localhost aquí se refiere al contenedor mismo)
ENV MONGODB_URI=mongodb://host.docker.internal:27017/plans-microservice

# RabbitMQ
ENV RABBITMQ_URL=amqp://host.docker.internal:5672

# Servidor
ENV PORT=3002
# IMPORTANTE: En Docker debe ser 0.0.0.0 para ser accesible desde fuera
ENV HOST=0.0.0.0
# Usamos production para evitar errores con pino-pretty (que es devDependency)
ENV NODE_ENV=production

# Storage
ENV UPLOAD_PATH=./uploads
ENV MAX_FILE_SIZE=10485760

# Logging
ENV LOG_LEVEL=info

# CORS
ENV CORS_ORIGIN=http://localhost:3000

# Exponemos el puerto
EXPOSE 3002

# Usamos el usuario node por seguridad (no root)
USER node

# Comando de inicio
CMD ["npm", "run", "start"]