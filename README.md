# Microservicio de Gestión de Planes Turísticos

Este documento es tu guía completa para construir un microservicio de gestión de planes turísticos usando **arquitectura hexagonal** (Ports & Adapters). No solo aprenderás *qué* código escribir, sino **por qué** tomar cada decisión arquitectónica y **cuándo** aplicar cada patrón.

## User Story Principal

```gherkin
Como: Administrador
Quiero: crear un nuevo plan turístico en la plataforma
Para: ofrecer experiencias actualizadas y atractivas a los clientes
Prioridad: Alta
```

## Arquitectura Hexagonal Aplicada

### ¿Qué es Arquitectura Hexagonal?

**Concepto central:**
Separar la **lógica de negocio** (dominio) de los **detalles técnicos** (bases de datos, frameworks, APIs externas). El dominio no debe depender de nada externo.

### Capas de la arquitectura

```
┌───────────────────────────────────────────────────────────┐
│                    ADAPTERS (HTTP)                        │
│              Express Controllers & Routes                 │
│                    (Entry Points)                         │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                         │
│            Use Cases + DTOs + Ports                       │
│    (CreatePlanUseCase, UpdatePlanUseCase)                 │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER                            │
│    Entities + Value Objects + Domain Events               │
│         (Plan, Precio, FechasDisponibles)                 │
└───────────────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────┴─────────────────────────────────────┐
│              INFRASTRUCTURE ADAPTERS                      │
│   MongoDB | RabbitMQ | LocalStorage | Pino Logger         │
│              (Exit Points / Driven)                       │
└───────────────────────────────────────────────────────────┘
```

### Estructura de carpetas

```
src/
├── domain/                        # 🔵 CAPA DE DOMINIO (puro TypeScript)
│   ├── entities/
│   │   └── Plan.ts                # Entidad principal
│   ├── value-objects/
│   │   ├── Precio.ts              # Value Object inmutable
│   │   ├── Duracion.ts
│   │   └── FechasDisponibles.ts   # Lógica de no-solapamiento
│   ├── events/
│   │   ├── PlanCreated.ts         # Domain Event
│   │   └── PlanUpdated.ts
│   └── errors/
│       ├── ValidationError.ts     # Errores de dominio
│       └── DomainError.ts
│
├── application/                   # 🟢 CAPA DE APLICACIÓN
│   ├── use-cases/
│   │   ├── CreatePlanUseCase.ts   # Caso de uso principal
│   │   └── __tests__/             # Tests unitarios
│   ├── ports/                     # Interfaces (contratos)
│   │   ├── PlanRepositoryPort.ts
│   │   ├── ImageStoragePort.ts
│   │   ├── MessageBusPort.ts
│   │   └── LoggerPort.ts
│   └── dtos/
│       ├── CreatePlanDTO.ts       # Input DTO
│       ├── PlanResponseDTO.ts     # Output DTO
│       └── schemas/               # Zod schemas
│           └── createPlanSchema.ts
│
├── infrastructure/                # 🟡 CAPA DE INFRAESTRUCTURA
│   ├── persistence/
│   │   ├── mongoose/
│   │   │   ├── models/
│   │   │   │   ├── PlanModel.ts   # Mongoose schema
│   │   │   │   └── OutboxModel.ts # Para patrón Outbox
│   │   │   └── MongoPlanRepository.ts  # Implementa Port
│   │   └── mongodb.config.ts
│   ├── messaging/
│   │   ├── RabbitMQPublisher.ts   # Implementa MessageBusPort
│   │   ├── OutboxWorker.ts        # Worker que reintenta eventos
│   │   └── rabbitmq.config.ts
│   ├── storage/
│   │   ├── LocalImageStorage.ts   # Implementa ImageStoragePort
│   │   ├── image-processor.ts     # Compresión con sharp
│   │   └── S3ImageStorage.ts      # Para producción (futuro)
│   └── logger/
│       └── PinoLogger.ts          # Implementa LoggerPort
│
├── adapters/                      # 🔴 ADAPTERS HTTP
│   ├── http/
│   │   ├── controllers/
│   │   │   └── PlanController.ts
│   │   ├── routes/
│   │   │   └── planRoutes.ts
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.ts   # Valida JWT
│   │   │   ├── errorHandler.ts     # Centraliza errores
│   │   │   ├── tenantMiddleware.ts # Extrae tenantId
│   │   │   └── uploadMiddleware.ts # Multer config
│   │   └── swagger/
│   │       └── swagger.config.ts
│   └── consumers/                  # Consumidores de eventos
│       └── GuideEventsConsumer.ts  # Escucha guide.assigned
│
├── config/                         # ⚙️ CONFIGURACIÓN
│   ├── index.ts                    # Carga env vars
│   └── dependencies.ts             # Inyección de dependencias
│
└── server.ts                       # 🚀 Entry point
```

## Tecnologías Utilizadas

*   **Node.js & Express:** Para el servidor web.
*   **TypeScript:** Para un desarrollo robusto y tipado.
*   **MongoDB & Mongoose:** Como base de datos NoSQL.
*   **RabbitMQ & amqplib:** Para la mensajería asíncrona con patrón Outbox.
*   **Zod:** Para la validación de esquemas y DTOs.
*   **Multer:** Para el manejo de la carga de archivos.
*   **Sharp:** Para la compresión de imágenes.
*   **Pino:** Para el logging estructurado.
*   **JWT:** Para la autenticación basada en tokens.

## Requisitos Previos

*   Node.js v24.9.0
*   npm v11.4.2
*   MongoDB
*   RabbitMQ
*   Docker

## Instalación y Puesta en Marcha

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd microServiceCreatePlan
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:

    ```env
    # Server configuration
    PORT=3000
    HOST=0.0.0.0

    # MongoDB configuration
    MONGODB_URI=mongodb://localhost:27017/plans_service

    # RabbitMQ configuration
    RABBITMQ_URL=amqp://localhost

    # JWT configuration
    JWT_SECRET=your_super_secret_key

    # Logger configuration
    LOG_LEVEL=info

    # Storage configuration
    STORAGE_PATH=./uploads
    ```

4.  **Iniciar en modo de desarrollo:**
    ```bash
    npm run dev
    ```
    El servidor se iniciará en `http://localhost:3000`.

## Scripts Disponibles

*   `npm run start`: Inicia el servidor en modo de producción (requiere compilación previa).
*   `npm run build`: Compila el código TypeScript a JavaScript.
*   `npm run dev`: Inicia el servidor en modo de desarrollo con recarga automática.

## API Endpoints

### Crear un Plan

*   **POST** `/api/v1/plans`
*   **Descripción:** Crea un nuevo plan turístico.
*   **Content-Type:** `multipart/form-data`
*   **Body (form-data):**
    *   `nombre` (string, 10-1000 caracteres, required): Nombre del plan.
    *   `descripcion` (string, 10-5000 caracteres, required): Descripción detallada.
    *   `precioValor` (number, >0, required): Valor del precio.
    *   `precioMoneda` (string, 'COP' | 'USD' | 'EUR', required): Moneda del precio.
    *   `duracion` (number, >0, required): Duración en horas.
    *   `cupoMaximo` (number, 1-12, required): Número máximo de personas.
    *   `fechasDisponibles` (string, JSON array de rangos, required): Ej: `[{"desde":"2025-12-01T10:00:00.000Z","hasta":"2025-12-15T18:00:00.000Z"}]`
    *   `files` (file, 1-3 archivos, JPG/PNG, max 100MB c/u, required): Imágenes del plan.

**Ejemplo de uso con `curl`:**

```bash
curl -X POST http://localhost:3000/api/v1/plans \
  -H "Authorization: Bearer <tu_jwt_de_admin>" \
  -F "nombre=Aventura en la Montaña" \
  -F "descripcion=Un viaje increíble a las montañas más altas." \
  -F "precioValor=250" \
  -F "precioMoneda=USD" \
  -F "duracion=48" \
  -F "cupoMaximo=10" \
  -F 'fechasDisponibles=[{"desde":"2025-11-20T09:00:00.000Z", "hasta":"2025-11-25T18:00:00.000Z"}]' \
  -F "files=@/path/to/your/image1.jpg" \
  -F "files=@/path/to/your/image2.jpg"
```

### Health Check

*   **GET** `/health`
*   **Descripción:** Verifica el estado del servicio y sus dependencias.
