import type { ExecutionQueueItem as ExecutionModel } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import type {
  CreateExecutionInput,
  ExecutionRecord,
  IExecutionRepository,
} from '../../../domain/execution/repositories/IExecutionRepository.js'
import { ExecutionStatus } from '../../../domain/execution/value-objects/ExecutionStatus.js'

function toRecord(row: ExecutionModel): ExecutionRecord {
  return {
    id: row.id,
    serviceOrderId: row.serviceOrderId,
    status: row.status as ExecutionStatus,
    diagnosis: row.diagnosis,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  }
}

export class PrismaExecutionRepository implements IExecutionRepository {
  async create(input: CreateExecutionInput): Promise<ExecutionRecord> {
    const row = await prisma.executionQueueItem.create({
      data: {
        serviceOrderId: input.serviceOrderId,
        status: ExecutionStatus.EM_DIAGNOSTICO,
        startedAt: new Date(),
      },
    })
    return toRecord(row)
  }

  async findById(id: string): Promise<ExecutionRecord | null> {
    const row = await prisma.executionQueueItem.findUnique({ where: { id } })
    return row ? toRecord(row) : null
  }

  async advance(id: string, to: ExecutionStatus): Promise<ExecutionRecord> {
    const row = await prisma.executionQueueItem.update({
      where: { id },
      data: {
        status: to,
        finishedAt: to === ExecutionStatus.FINALIZADA ? new Date() : undefined,
      },
    })
    return toRecord(row)
  }

  async fail(id: string, reason: string): Promise<ExecutionRecord> {
    const row = await prisma.executionQueueItem.update({
      where: { id },
      data: {
        status: ExecutionStatus.FALHOU,
        failureReason: reason,
        finishedAt: new Date(),
      },
    })
    return toRecord(row)
  }
}
