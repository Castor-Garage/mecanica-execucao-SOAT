import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  BusinessRuleError,
  InsufficientStockError,
  IntegrationError,
} from '../../../../src/shared/errors/AppError.js'

describe('AppError', () => {
  describe('AppError', () => {
    it('should create an error with message and default statusCode', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBeUndefined()
      expect(error.name).toBe('AppError')
    })

    it('should create an error with custom statusCode', () => {
      const error = new AppError('Test error', 500)
      expect(error.statusCode).toBe(500)
    })

    it('should create an error with code', () => {
      const error = new AppError('Test error', 500, 'CUSTOM_CODE')
      expect(error.code).toBe('CUSTOM_CODE')
    })

    it('should be an instance of Error', () => {
      const error = new AppError('Test error')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('NotFoundError', () => {
    it('should create a NotFoundError with resource name', () => {
      const error = new NotFoundError('Item da fila de execução')
      expect(error.message).toBe('Item da fila de execução não encontrado')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.name).toBe('NotFoundError')
    })

    it('should create a NotFoundError with resource and identifier', () => {
      const error = new NotFoundError('Item da fila de execução', '123')
      expect(error.message).toBe('Item da fila de execução não encontrado (123)')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })

    it('should be an instance of AppError', () => {
      const error = new NotFoundError('Item da fila de execução')
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('ConflictError', () => {
    it('should create a ConflictError', () => {
      const error = new ConflictError('Execução já finalizada')
      expect(error.message).toBe('Execução já finalizada')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
      expect(error.name).toBe('ConflictError')
    })

    it('should be an instance of AppError', () => {
      const error = new ConflictError('test')
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError with default message', () => {
      const error = new UnauthorizedError()
      expect(error.message).toBe('Não autorizado')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.name).toBe('UnauthorizedError')
    })

    it('should create an UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Credenciais inválidas')
      expect(error.message).toBe('Credenciais inválidas')
      expect(error.statusCode).toBe(401)
    })

    it('should be an instance of AppError', () => {
      const error = new UnauthorizedError()
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError with default message', () => {
      const error = new ForbiddenError()
      expect(error.message).toBe('Acesso negado')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
      expect(error.name).toBe('ForbiddenError')
    })

    it('should be an instance of AppError', () => {
      const error = new ForbiddenError()
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('ValidationError', () => {
    it('should create a ValidationError', () => {
      const error = new ValidationError('Status inválido')
      expect(error.message).toBe('Status inválido')
      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.name).toBe('ValidationError')
    })

    it('should be an instance of AppError', () => {
      const error = new ValidationError('test')
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('BusinessRuleError', () => {
    it('should create a BusinessRuleError', () => {
      const error = new BusinessRuleError('Só é possível iniciar execução de itens aguardando')
      expect(error.message).toBe('Só é possível iniciar execução de itens aguardando')
      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION')
      expect(error.name).toBe('BusinessRuleError')
    })

    it('should be an instance of AppError', () => {
      const error = new BusinessRuleError('test')
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('InsufficientStockError', () => {
    it('should create an InsufficientStockError with correct message', () => {
      const error = new InsufficientStockError('Pneu Premium', 5, 10)
      expect(error.message).toBe(
        'Estoque insuficiente para "Pneu Premium": disponível 5, solicitado 10',
      )
      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('INSUFFICIENT_STOCK')
      expect(error.name).toBe('InsufficientStockError')
    })

    it('should be an instance of AppError', () => {
      const error = new InsufficientStockError('test', 1, 2)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('IntegrationError', () => {
    it('should create an IntegrationError that keeps the integration and the cause', () => {
      const cause = new Error('connection refused')
      const error = new IntegrationError('sqs', 'Não foi possível publicar o evento.', cause)
      expect(error.message).toBe('Não foi possível publicar o evento.')
      expect(error.statusCode).toBe(502)
      expect(error.code).toBe('INTEGRATION_FAILURE')
      expect(error.name).toBe('IntegrationError')
      expect(error.integration).toBe('sqs')
      expect(error.cause).toBe(cause)
    })

    it('should be an instance of AppError', () => {
      const error = new IntegrationError('sqs', 'test')
      expect(error).toBeInstanceOf(AppError)
    })
  })
})
