import type {
  ExecutionRecord,
  IExecutionRepository,
} from '../../../domain/execution/repositories/IExecutionRepository.js'
import { ExecutionStatus, assertTransition } from '../../../domain/execution/value-objects/ExecutionStatus.js'
import type { IMessageBus } from '../../../domain/shared/messaging/IMessageBus.js'
import { OS_EVENTS_QUEUE, type ExecucaoFalhouEvent } from '../../../domain/shared/messaging/topics.js'
import { NotFoundError } from '../../../shared/errors/AppError.js'

// Reage ao comando FalharExecucao (fila execucao-commands - ver ADR 0006),
// enviado pelo OS Service quando o mecanico reporta que o reparo nao pode
// ser concluido. O OS Service recebe o evento e aplica a compensacao da
// saga (ver ADR 0006).
export class FailExecutionUseCase {
  constructor(
    private readonly executionRepo: IExecutionRepository,
    private readonly bus: IMessageBus,
  ) {}

  async execute(executionId: string, reason: string): Promise<ExecutionRecord> {
    const execution = await this.executionRepo.findById(executionId)
    if (!execution) {
      throw new NotFoundError('Item da fila de execução', executionId)
    }

    assertTransition(execution.status, ExecutionStatus.FALHOU)

    const failed = await this.executionRepo.fail(executionId, reason)

    await this.bus.publish<ExecucaoFalhouEvent>(OS_EVENTS_QUEUE, {
      type: 'ExecucaoFalhou',
      serviceOrderId: failed.serviceOrderId,
      executionId: failed.id,
      reason,
    })

    return failed
  }
}
