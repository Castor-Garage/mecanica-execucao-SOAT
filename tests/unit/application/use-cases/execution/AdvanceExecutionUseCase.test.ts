import { describe, it, expect, vi } from 'vitest'
import { AdvanceExecutionUseCase } from '../../../../../src/application/use-cases/execution/AdvanceExecutionUseCase.js'
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
    status: ExecutionStatus.EM_DIAGNOSTICO,
    diagnosis: null,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: new Date(),
    finishedAt: null,
    ...overrides,
  }
}

describe('AdvanceExecutionUseCase', () => {
  it('advances from EM_DIAGNOSTICO to EM_EXECUCAO without publishing an event', async () => {
    const current = makeExecutionRecord()
    const advanced = makeExecutionRecord({ status: ExecutionStatus.EM_EXECUCAO })
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(current),
      advance: vi.fn().mockResolvedValue(advanced),
      fail: vi.fn(),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new AdvanceExecutionUseCase(executionRepo, bus)

    const result = await useCase.execute('execution-1')

    expect(executionRepo.advance).toHaveBeenCalledWith('execution-1', ExecutionStatus.EM_EXECUCAO)
    expect(bus.publish).not.toHaveBeenCalled()
    expect(result).toBe(advanced)
  })

  it('publishes ExecucaoFinalizada when advancing to FINALIZADA', async () => {
    const current = makeExecutionRecord({ status: ExecutionStatus.EM_EXECUCAO })
    const finalized = makeExecutionRecord({
      status: ExecutionStatus.FINALIZADA,
      finishedAt: new Date(),
    })
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(current),
      advance: vi.fn().mockResolvedValue(finalized),
      fail: vi.fn(),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new AdvanceExecutionUseCase(executionRepo, bus)

    await useCase.execute('execution-1')

    expect(bus.publish).toHaveBeenCalledWith('os-events', {
      type: 'ExecucaoFinalizada',
      serviceOrderId: finalized.serviceOrderId,
      executionId: finalized.id,
    })
  })

  it('throws NotFoundError when the execution item does not exist', async () => {
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      advance: vi.fn(),
      fail: vi.fn(),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new AdvanceExecutionUseCase(executionRepo, bus)

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundError)
  })

  it('throws BusinessRuleError when the item has no next status', async () => {
    const finalized = makeExecutionRecord({ status: ExecutionStatus.FINALIZADA })
    const executionRepo: IExecutionRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(finalized),
      advance: vi.fn(),
      fail: vi.fn(),
    }
    const bus: IMessageBus = { publish: vi.fn(), subscribe: vi.fn() }
    const useCase = new AdvanceExecutionUseCase(executionRepo, bus)

    await expect(useCase.execute('execution-1')).rejects.toThrow(BusinessRuleError)
    expect(executionRepo.advance).not.toHaveBeenCalled()
  })
})
