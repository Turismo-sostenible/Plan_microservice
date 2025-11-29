# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript
RUN npm install -g typescript && \
    tsc

# Stage 2: Runtime
FROM node:24-alpine

WORKDIR /app

# Instalar dumb-init para manejar señales correctamente
RUN apk add --no-cache dumb-init

# Copiar node_modules desde el builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Copiar archivos de configuración
COPY package.json ./

# Crear directorio para uploads
RUN mkdir -p ./uploads

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Usar dumb-init para iniciar la aplicación
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
