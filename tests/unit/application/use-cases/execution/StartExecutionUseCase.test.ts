import { describe, it, expect, vi } from 'vitest'
import { StartExecutionUseCase } from '../../../../../src/application/use-cases/execution/StartExecutionUseCase.js'
import { ExecutionStatus } from '../../../../../src/domain/execution/value-objects/ExecutionStatus.js'
import type {
  ExecutionRecord,
  IExecutionRepository,
} from '../../../../../src/domain/execution/repositories/IExecutionRepository.js'

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

describe('StartExecutionUseCase', () => {
  it('creates an execution queue item for the service order', async () => {
    const created = makeExecutionRecord()
    const executionRepo: IExecutionRepository = {
      create: vi.fn().mockResolvedValue(created),
      findById: vi.fn(),
      advance: vi.fn(),
      fail: vi.fn(),
    }
    const useCase = new StartExecutionUseCase(executionRepo)

    const result = await useCase.execute({ type: 'IniciarExecucao', serviceOrderId: 'os-1' })

    expect(executionRepo.create).toHaveBeenCalledWith({ serviceOrderId: 'os-1' })
    expect(result).toBe(created)
  })
})
