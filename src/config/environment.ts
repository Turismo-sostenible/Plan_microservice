export const config = {
  // Base de datos
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/plans-microservice'
  },
  
  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: 'plans.events',
  },
  
  // Servidor
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  
  // Storage
  storage: {
    uploadPath: process.env.UPLOAD_PATH,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV === 'development',
  },
};
