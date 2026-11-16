import type {
  ExecutionRecord,
  IExecutionRepository,
} from '../../../domain/execution/repositories/IExecutionRepository.js'
import type { IniciarExecucaoCommand } from '../../../domain/shared/messaging/topics.js'

// Reage ao comando IniciarExecucao (fila execucao-commands - ver ADR 0006),
// publicado pelo OS Service assim que o pagamento e confirmado. Cria o item
// na fila de execucao ja em diagnostico - nao ha evento de volta aqui; o
// OS Service so precisa saber quando a execucao finaliza ou falha.
export class StartExecutionUseCase {
  constructor(private readonly executionRepo: IExecutionRepository) {}

  async execute(command: IniciarExecucaoCommand): Promise<ExecutionRecord> {
    return this.executionRepo.create({ serviceOrderId: command.serviceOrderId })
  }
}
