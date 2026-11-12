import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '../../src/infrastructure/database/prisma/client.js'

describe('Database connection', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to the database and run a trivial query', async () => {
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`
    expect(result[0]?.ok).toBe(1)
  })
})
