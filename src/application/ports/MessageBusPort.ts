// application/ports/MessageBusPort.ts

export interface MessageBusPort {
  /**
   * Publica un evento en el exchange
   * @param routingKey Ej: "plan.created"
   * @param message Payload del evento
   * @throws MessageBusError si falla la publicación
   */
  publish(routingKey: string, message: any): Promise<void>

  /**
   * Suscribe un handler a un evento
   * @param routingKey Ej: "guide.assigned"
   * @param handler Función que procesa el mensaje
   */
  subscribe(
    routingKey: string,
    handler: (message: any) => Promise<void>
  ): Promise<void>

  /**
   * Cierra conexión limpiamente
   */
  close(): Promise<void>
}
