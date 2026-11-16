import type { ExecutionStatus } from '../value-objects/ExecutionStatus.js'

export interface ExecutionRecord {
  id: string
  serviceOrderId: string
  status: ExecutionStatus
  diagnosis: string | null
  failureReason: string | null
  createdAt: Date
  updatedAt: Date
  startedAt: Date | null
  finishedAt: Date | null
}

export interface CreateExecutionInput {
  serviceOrderId: string
}

export interface IExecutionRepository {
  create(input: CreateExecutionInput): Promise<ExecutionRecord>
  findById(id: string): Promise<ExecutionRecord | null>
  advance(id: string, to: ExecutionStatus): Promise<ExecutionRecord>
  fail(id: string, reason: string): Promise<ExecutionRecord>
}
