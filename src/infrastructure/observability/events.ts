import type { FastifyBaseLogger } from 'fastify'
import { AppError, IntegrationError } from '../../shared/errors/AppError.js'
import { currentRequestId } from './request-context.js'

export type BusinessEvent =
  | 'execucao.iniciada'
  | 'execucao.finalizada'
  | 'execucao.falhou'
  | 'integration.failed'

type Level = 'info' | 'warn' | 'error'

// Business events are plain log lines with an "event" field, so dashboards and alerts
// can be built on the log search of any tool (New Relic, Datadog...). Mirrors the
// pattern already validated in mecanica-pos-SOAT (OS Service).
export class BusinessEventLogger {
  constructor(private readonly log: FastifyBaseLogger) {}

  emit(event: BusinessEvent, data: Record<string, unknown>, level: Level = 'info'): void {
    this.log[level]({ event, requestId: currentRequestId(), ...data }, event)
  }

  reportFailure(route: string | undefined, statusCode: number, error: Error): void {
    const level: Level = statusCode >= 500 ? 'error' : 'warn'
    const code = error instanceof AppError ? error.code : undefined

    this.emit(
      code === 'INTEGRATION_FAILURE' ? 'integration.failed' : 'execucao.falhou',
      {
        route,
        statusCode,
        code,
        integration: error instanceof IntegrationError ? error.integration : undefined,
        error: error.message,
        cause: error.cause instanceof Error ? error.cause.message : undefined,
      },
      level,
    )
  }
}
