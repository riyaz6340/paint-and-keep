import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock = mockDeep<PrismaClient>() as MockPrismaClient;

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock,
}));

/**
 * Reset all Prisma mocks between tests.
 * Call this in beforeEach or afterEach.
 */
export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

/**
 * Helper to mock a Prisma transaction.
 * The callback receives the mock client so you can set up
 * expectations within the transaction scope.
 */
export function mockTransaction(
  callback: (tx: MockPrismaClient) => void
): void {
  prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
    callback(prismaMock);
    if (typeof fn === 'function') {
      return fn(prismaMock);
    }
    return fn;
  });
}
