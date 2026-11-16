import { describe, it, expect } from 'vitest'
import {
  ExecutionStatus,
  canTransition,
  assertTransition,
  nextStatus,
  statusLabel,
} from '../../../../src/domain/execution/value-objects/ExecutionStatus.js'
import { BusinessRuleError } from '../../../../src/shared/errors/AppError.js'

describe('ExecutionStatus transitions', () => {
  describe('canTransition', () => {
    it('allows the forward flow', () => {
      expect(canTransition(ExecutionStatus.AGUARDANDO, ExecutionStatus.EM_DIAGNOSTICO)).toBe(true)
      expect(canTransition(ExecutionStatus.EM_DIAGNOSTICO, ExecutionStatus.EM_EXECUCAO)).toBe(true)
      expect(canTransition(ExecutionStatus.EM_EXECUCAO, ExecutionStatus.FINALIZADA)).toBe(true)
    })

    it('allows failing from any non-terminal status', () => {
      expect(canTransition(ExecutionStatus.AGUARDANDO, ExecutionStatus.FALHOU)).toBe(true)
      expect(canTransition(ExecutionStatus.EM_DIAGNOSTICO, ExecutionStatus.FALHOU)).toBe(true)
      expect(canTransition(ExecutionStatus.EM_EXECUCAO, ExecutionStatus.FALHOU)).toBe(true)
    })

    it('rejects skipping states', () => {
      expect(canTransition(ExecutionStatus.AGUARDANDO, ExecutionStatus.EM_EXECUCAO)).toBe(false)
      expect(canTransition(ExecutionStatus.AGUARDANDO, ExecutionStatus.FINALIZADA)).toBe(false)
    })

    it('FINALIZADA and FALHOU are terminal', () => {
      for (const status of Object.values(ExecutionStatus)) {
        expect(canTransition(ExecutionStatus.FINALIZADA, status as ExecutionStatus)).toBe(false)
        expect(canTransition(ExecutionStatus.FALHOU, status as ExecutionStatus)).toBe(false)
      }
    })
  })

  describe('assertTransition', () => {
    it('does not throw for a valid transition', () => {
      expect(() =>
        assertTransition(ExecutionStatus.EM_DIAGNOSTICO, ExecutionStatus.EM_EXECUCAO),
      ).not.toThrow()
    })

    it('throws BusinessRuleError for an invalid transition', () => {
      expect(() =>
        assertTransition(ExecutionStatus.FINALIZADA, ExecutionStatus.EM_EXECUCAO),
      ).toThrow(BusinessRuleError)
    })
  })

  describe('nextStatus', () => {
    it('returns EM_EXECUCAO after EM_DIAGNOSTICO', () => {
      expect(nextStatus(ExecutionStatus.EM_DIAGNOSTICO)).toBe(ExecutionStatus.EM_EXECUCAO)
    })

    it('returns FINALIZADA after EM_EXECUCAO', () => {
      expect(nextStatus(ExecutionStatus.EM_EXECUCAO)).toBe(ExecutionStatus.FINALIZADA)
    })

    it('throws BusinessRuleError when there is no next status', () => {
      expect(() => nextStatus(ExecutionStatus.FINALIZADA)).toThrow(BusinessRuleError)
      expect(() => nextStatus(ExecutionStatus.AGUARDANDO)).toThrow(BusinessRuleError)
    })
  })

  describe('statusLabel', () => {
    it('returns the Portuguese label for each status', () => {
      expect(statusLabel(ExecutionStatus.EM_DIAGNOSTICO)).toBe('Em diagnóstico')
      expect(statusLabel(ExecutionStatus.EM_EXECUCAO)).toBe('Em execução')
      expect(statusLabel(ExecutionStatus.FINALIZADA)).toBe('Finalizada')
      expect(statusLabel(ExecutionStatus.FALHOU)).toBe('Falhou')
    })
  })
})
