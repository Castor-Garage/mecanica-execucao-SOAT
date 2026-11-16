import { describe, it, expect, vi } from 'vitest'
import { FailExecutionUseCase } from '../../../../../src/application/use-cases/execution/FailExecutionUseCase.js'
import { ExecutionStatus } from '../../../../../src/domain/execution/value-objects/ExecutionStatus.js'
import type {
  ExecutionRecord,
  IExecutionRepository,
} from '../../../../../src/domain/execution/repositories/IExecutionRepository.js'
import type { IMessageBus } from '../../../../../src/domain/shared/messaging/IMessageBus.js'
import { NotFoundError, BusinessRuleError } from '../../../../../src/shared/errors/AppError.js'

function makeExecutionRecord(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
  return {
    id: 'execution-1',
    serviceOrderId: 'os-1',
    status: ExecutionStatus.EM_EXECUCAO,
    diagnosis: null,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: new Date(),
    finishedAt: null,
    ...overrides,
  }
}

describe('FailExecutionUseCase', () => {
  it('fails a non-terminal execution item and publishes ExecucaoFalhou', async () => {
    const current = makeExecutionRecord()
    const failed = makeExecutionRecord({
      status: ExecutionStatus.FALHOU,
      failureReason: 'Peça indisponível',
      finishedAt: new Date(),
    })
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(current),
      advance: vi.fn(),
      fail: vi.fn().mockResolvedValue(failed),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new FailExecutionUseCase(executionRepo, bus)

    const result = await useCase.execute('execution-1', 'Peça indisponível')

    expect(executionRepo.fail).toHaveBeenCalledWith('execution-1', 'Peça indisponível')
    expect(bus.publish).toHaveBeenCalledWith('os-events', {
      type: 'ExecucaoFalhou',
      serviceOrderId: failed.serviceOrderId,
      executionId: failed.id,
      reason: 'Peça indisponível',
    })
    expect(result).toBe(failed)
  })

  it('throws NotFoundError when the execution item does not exist', async () => {
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      advance: vi.fn(),
      fail: vi.fn(),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new FailExecutionUseCase(executionRepo, bus)

    await expect(useCase.execute('missing', 'erro')).rejects.toThrow(NotFoundError)
  })

  it('throws BusinessRuleError when the item is already terminal', async () => {
    const finalized = makeExecutionRecord({ status: ExecutionStatus.FINALIZADA })
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(finalized),
      advance: vi.fn(),
      fail: vi.fn(),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new FailExecutionUseCase(executionRepo, bus)

    await expect(useCase.execute('execution-1', 'erro')).rejects.toThrow(BusinessRuleError)
    expect(executionRepo.fail).not.toHaveBeenCalled()
  })
})
