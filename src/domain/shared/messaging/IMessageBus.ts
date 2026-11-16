// Porta de mensageria (ver ADR 0006 em mecanica-pos-SOAT/docs). O codigo de
// dominio/aplicacao depende apenas desta interface - o adapter concreto
// (InMemoryMessageBus hoje, SQS real na Fase 5 do backlog) fica isolado na
// camada de infraestrutura e pode ser trocado sem tocar nos use cases.
export interface IMessageBus {
  publish<T>(queue: string, message: T): Promise<void>
  subscribe<T>(queue: string, handler: (message: T) => Promise<void>): void
}
