import type { FastifyBaseLogger } from 'fastify'
import newrelic from 'newrelic'
import { messageBus } from './bus.js'
import { EXECUCAO_COMMANDS_QUEUE, type ExecucaoCommand } from '../../domain/shared/messaging/topics.js'
import { PrismaExecutionRepository } from '../database/repositories/PrismaExecutionRepository.js'
import { StartExecutionUseCase } from '../../application/use-cases/execution/StartExecutionUseCase.js'
import { AdvanceExecutionUseCase } from '../../application/use-cases/execution/AdvanceExecutionUseCase.js'
import { FailExecutionUseCase } from '../../application/use-cases/execution/FailExecutionUseCase.js'

// Liga o consumer de execucao-commands (ver ADR 0006) ao InMemoryMessageBus
// do processo. Na Fase 5 do backlog, o mesmo `messageBus.subscribe` passa a
// ser atendido por um adapter SQS real - nada aqui precisa mudar, so o
// adapter importado em bus.ts.
export function bootstrapExecucaoCommandsConsumer(log: FastifyBaseLogger): void {
  const executionRepo = new PrismaExecutionRepository()

  const startExecution = new StartExecutionUseCase(executionRepo)
  const advanceExecution = new AdvanceExecutionUseCase(executionRepo, messageBus)
  const failExecution = new FailExecutionUseCase(executionRepo, messageBus)

  messageBus.subscribe<ExecucaoCommand>(EXECUCAO_COMMANDS_QUEUE, async (command) => {
    // Consumo de fila nao passa por uma transacao HTTP, entao o agente do
    // New Relic nao traca nada aqui por padrao - sem isso, cada comando
    // processado e invisivel no APM. startBackgroundTransaction cria uma
    // transacao propria por comando, com o tipo como atributo pesquisavel.
    await newrelic.startBackgroundTransaction(`saga/execucao-commands/${command.type}`, async () => {
      const transaction = newrelic.getTransaction()
      newrelic.addCustomAttribute('commandType', command.type)
      try {
        switch (command.type) {
          case 'IniciarExecucao':
            newrelic.addCustomAttribute('serviceOrderId', command.serviceOrderId)
            await startExecution.execute(command)
            break
          case 'AvancarExecucao':
            newrelic.addCustomAttribute('executionId', command.executionId)
            await advanceExecution.execute(command.executionId)
            break
          case 'FalharExecucao':
            newrelic.addCustomAttribute('executionId', command.executionId)
            await failExecution.execute(command.executionId, command.reason)
            break
        }
      } catch (error) {
        newrelic.noticeError(error as Error)
        log.error({ err: error, command }, 'Falha ao processar comando de execução')
      } finally {
        transaction.end()
      }
    })
  })
}
