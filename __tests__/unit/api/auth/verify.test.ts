import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before importing the route
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET } from '@/app/api/auth/verify/[token]/route';
import { prisma } from '@/lib/prisma';

function createRequest(token: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/auth/verify/${token}`, {
    method: 'GET',
  });
}

describe('GET /api/auth/verify/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
    isActive: false,
    verificationToken: 'valid-token-abc123',
    verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
  };

  it('returns success when token is valid and not expired', async () => {
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(validUser);
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...validUser,
      emailVerified: true,
      isActive: true,
      verificationToken: null,
      verificationExpiry: null,
    });

    const request = createRequest('valid-token-abc123');
    const response = await GET(request, { params: { token: 'valid-token-abc123' } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toContain('Email verified successfully');
  });

  it('sets emailVerified=true and isActive=true on verification', async () => {
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(validUser);
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const request = createRequest('valid-token-abc123');
    await GET(request, { params: { token: 'valid-token-abc123' } });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        emailVerified: true,
        isActive: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });
  });

  it('returns 404 for invalid token', async () => {
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = createRequest('invalid-token');
    const response = await GET(request, { params: { token: 'invalid-token' } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe('NOT_FOUND');
  });

  it('returns 400 for expired token', async () => {
    const expiredUser = {
      ...validUser,
      verificationExpiry: new Date(Date.now() - 1000), // Expired 1 second ago
    };
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(expiredUser);

    const request = createRequest('valid-token-abc123');
    const response = await GET(request, { params: { token: 'valid-token-abc123' } });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('expired');
  });

  it('returns success message for already-verified user', async () => {
    const alreadyVerified = { ...validUser, emailVerified: true };
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(alreadyVerified);

    const request = createRequest('valid-token-abc123');
    const response = await GET(request, { params: { token: 'valid-token-abc123' } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toContain('already verified');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('returns 400 for empty token', async () => {
    const request = createRequest('');
    const response = await GET(request, { params: { token: '' } });

    expect(response.status).toBe(400);
  });
});
