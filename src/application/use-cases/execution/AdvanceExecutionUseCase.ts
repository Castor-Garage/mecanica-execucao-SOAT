import type {
  ExecutionRecord,
  IExecutionRepository,
} from '../../../domain/execution/repositories/IExecutionRepository.js'
import { ExecutionStatus, assertTransition, nextStatus } from '../../../domain/execution/value-objects/ExecutionStatus.js'
import type { IMessageBus } from '../../../domain/shared/messaging/IMessageBus.js'
import { OS_EVENTS_QUEUE, type ExecucaoFinalizadaEvent } from '../../../domain/shared/messaging/topics.js'
import { NotFoundError } from '../../../shared/errors/AppError.js'

// Reage ao comando AvancarExecucao (fila execucao-commands - ver ADR 0006),
// enviado pelo OS Service a pedido do mecanico/admin (diagnostico concluido,
// reparo concluido). So avanca um passo por chamada; ao chegar em
// FINALIZADA publica o evento que fecha a saga do lado da execucao.
export class AdvanceExecutionUseCase {
  constructor(
    private readonly executionRepo: IExecutionRepository,
    private readonly bus: IMessageBus,
  ) {}

  async execute(executionId: string): Promise<ExecutionRecord> {
    const execution = await this.executionRepo.findById(executionId)
    if (!execution) {
      throw new NotFoundError('Item da fila de execução', executionId)
    }

    const to = nextStatus(execution.status)
    assertTransition(execution.status, to)

    const advanced = await this.executionRepo.advance(executionId, to)

    if (advanced.status === ExecutionStatus.FINALIZADA) {
      await this.bus.publish<ExecucaoFinalizadaEvent>(OS_EVENTS_QUEUE, {
        type: 'ExecucaoFinalizada',
        serviceOrderId: advanced.serviceOrderId,
        executionId: advanced.id,
      })
    }

    return advanced
  }
}
