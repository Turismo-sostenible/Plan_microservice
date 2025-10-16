# Microservicio de Creación de Planes Turísticos

Este microservicio es responsable de la creación, gestión y publicación de planes turísticos. Está construido con una arquitectura limpia, separando las preocupaciones en dominio, aplicación e infraestructura.

## Características Principales

*   **Creación de Planes:** Permite a los administradores crear nuevos planes turísticos con detalles como nombre, descripción, precio, duración, etc.
*   **Gestión de Imágenes:** Soporte para carga de múltiples imágenes por plan.
*   **Comunicación Asíncrona:** Utiliza RabbitMQ para notificar a otros servicios sobre la creación de nuevos planes.
*   **Persistencia de Datos:** Utiliza MongoDB para almacenar la información de los planes.
*   **Autenticación y Autorización:** Protege el endpoint de creación de planes para que solo los administradores puedan usarlo (actualmente comentado).

## Arquitectura

El proyecto sigue los principios de la Arquitectura Limpia (Clean Architecture), dividiendo el código en las siguientes capas:

*   **Domain:** Contiene las entidades, la lógica de negocio principal y las interfaces de los repositorios.
*   **Application:** Orquesta los casos de uso, actuando como intermediario entre la infraestructura y el dominio.
*   **Infrastructure:** Contiene las implementaciones concretas de los servicios externos, como la base de datos, el bus de mensajes y el almacenamiento de archivos.
*   **Adapters:** Conecta la infraestructura con el mundo exterior (controladores HTTP, middlewares, etc.).

## Tecnologías Utilizadas

*   **Node.js & Express:** Para el servidor web.
*   **TypeScript:** Para un desarrollo robusto y tipado.
*   **MongoDB & Mongoose:** Como base de datos NoSQL.
*   **RabbitMQ & amqplib:** Para la mensajería asíncrona.
*   **Zod:** Para la validación de esquemas y DTOs.
*   **Multer:** Para el manejo de la carga de archivos.
*   **Pino:** Para el logging.
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
    *   `nombre` (string, required): Nombre del plan.
    *   `descripcion` (string, required): Descripción detallada.
    *   `precio` (string, required): Objeto JSON stringificado. Ej: `{"valor": 100000, "moneda": "COP"}`
    *   `duracion` (string, required): Duración del plan (ej: "3 días, 2 noches").
    *   `cupoMaximo` (number, required): Número máximo de personas.
    *   `fechasDisponibles` (string, required): Array JSON stringificado de fechas. Ej: `["2025-12-01", "2025-12-15"]`
    *   `images` (file, optional): Una o más imágenes del plan (hasta 3).

**Ejemplo de uso con `curl`:**

```bash
curl -X POST http://localhost:3000/api/v1/plans \
  -F "nombre=Aventura en la Montaña" \
  -F "descripcion=Un viaje increíble a las montañas más altas." \
  -F 'precio={"valor": 250.50, "moneda": "USD"}' \
  -F "duracion=5 días" \
  -F "cupoMaximo=10" \
  -F 'fechasDisponibles=["2025-11-20T00:00:00.000Z", "2025-12-05T00:00:00.000Z"]' \
  -F "images=@/path/to/your/image1.jpg" \
  -F "images=@/path/to/your/image2.jpg"
```

### Health Check

*   **GET** `/health`
*   **Descripción:** Verifica el estado del servicio y sus dependencias.

---