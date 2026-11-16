// Contrato de mensageria do Execucao/Producao Service - nomes de fila e
// formato das mensagens trocadas com o OS Service (ver ADR 0006 em
// mecanica-pos-SOAT/docs). O OS Service mantem a definicao espelhada do
// lado dele; qualquer mudanca de formato aqui precisa ser coordenada com o
// repositorio mecanica-pos-SOAT.

export const EXECUCAO_COMMANDS_QUEUE = 'execucao-commands'
export const OS_EVENTS_QUEUE = 'os-events'

export interface IniciarExecucaoCommand {
  type: 'IniciarExecucao'
  serviceOrderId: string
}

export interface AvancarExecucaoCommand {
  type: 'AvancarExecucao'
  executionId: string
}

export interface FalharExecucaoCommand {
  type: 'FalharExecucao'
  executionId: string
  reason: string
}

export type ExecucaoCommand =
  | IniciarExecucaoCommand
  | AvancarExecucaoCommand
  | FalharExecucaoCommand

export interface ExecucaoFinalizadaEvent {
  type: 'ExecucaoFinalizada'
  serviceOrderId: string
  executionId: string
}

export interface ExecucaoFalhouEvent {
  type: 'ExecucaoFalhou'
  serviceOrderId: string
  executionId: string
  reason: string
}

export type ExecucaoEvent = ExecucaoFinalizadaEvent | ExecucaoFalhouEvent
