import { BusinessRuleError } from '../../../shared/errors/AppError.js'

export enum ExecutionStatus {
  AGUARDANDO = 'AGUARDANDO',
  EM_DIAGNOSTICO = 'EM_DIAGNOSTICO',
  EM_EXECUCAO = 'EM_EXECUCAO',
  FINALIZADA = 'FINALIZADA',
  FALHOU = 'FALHOU',
}

const VALID_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
  [ExecutionStatus.AGUARDANDO]: [ExecutionStatus.EM_DIAGNOSTICO, ExecutionStatus.FALHOU],
  [ExecutionStatus.EM_DIAGNOSTICO]: [ExecutionStatus.EM_EXECUCAO, ExecutionStatus.FALHOU],
  [ExecutionStatus.EM_EXECUCAO]: [ExecutionStatus.FINALIZADA, ExecutionStatus.FALHOU],
  [ExecutionStatus.FINALIZADA]: [],
  [ExecutionStatus.FALHOU]: [],
}

// Proximo estado "feliz" na fila de execucao - usado pelo comando
// AvancarExecucao, que nao escolhe o destino (so avanca um passo).
const NEXT_STATUS: Partial<Record<ExecutionStatus, ExecutionStatus>> = {
  [ExecutionStatus.EM_DIAGNOSTICO]: ExecutionStatus.EM_EXECUCAO,
  [ExecutionStatus.EM_EXECUCAO]: ExecutionStatus.FINALIZADA,
}

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  [ExecutionStatus.AGUARDANDO]: 'Aguardando',
  [ExecutionStatus.EM_DIAGNOSTICO]: 'Em diagnóstico',
  [ExecutionStatus.EM_EXECUCAO]: 'Em execução',
  [ExecutionStatus.FINALIZADA]: 'Finalizada',
  [ExecutionStatus.FALHOU]: 'Falhou',
}

export function canTransition(from: ExecutionStatus, to: ExecutionStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export function assertTransition(from: ExecutionStatus, to: ExecutionStatus): void {
  if (!canTransition(from, to)) {
    throw new BusinessRuleError(
      `Transição inválida: "${STATUS_LABELS[from]}" → "${STATUS_LABELS[to]}". ` +
        `Próximos estados válidos: ${
          VALID_TRANSITIONS[from].map((s) => STATUS_LABELS[s]).join(', ') || 'nenhum (status terminal)'
        }`,
    )
  }
}

export function nextStatus(current: ExecutionStatus): ExecutionStatus {
  const next = NEXT_STATUS[current]
  if (!next) {
    throw new BusinessRuleError(
      `Não há próximo status para avançar a partir de "${STATUS_LABELS[current]}"`,
    )
  }
  return next
}

export function statusLabel(status: ExecutionStatus): string {
  return STATUS_LABELS[status]
}
