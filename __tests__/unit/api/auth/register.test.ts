import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before importing the route
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: () => vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/notifications', () => ({
  sendNotificationAsync: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
  },
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { sendNotificationAsync } from '@/lib/notifications';
import bcrypt from 'bcryptjs';

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      isActive: false,
    });
  });

  const validBody = {
    email: 'test@example.com',
    password: 'StrongP@ss1',
    name: 'Test User',
  };

  it('returns 201 on successful registration', async () => {
    const request = createRequest(validBody);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.message).toContain('Registration successful');
  });

  it('hashes password with bcrypt cost factor 12', async () => {
    const request = createRequest(validBody);
    await POST(request);

    expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ss1', 12);
  });

  it('normalizes email to lowercase', async () => {
    const request = createRequest({ ...validBody, email: 'Test@Example.COM' });
    await POST(request);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('creates user with emailVerified=false and isActive=false', async () => {
    const request = createRequest(validBody);
    await POST(request);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerified: false,
          isActive: false,
          provider: 'EMAIL',
        }),
      })
    );
  });

  it('generates a 64-char hex verification token', async () => {
    const request = createRequest(validBody);
    await POST(request);

    const createCall = (prisma.user.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.verificationToken).toHaveLength(64);
    expect(createCall.data.verificationToken).toMatch(/^[0-9a-f]+$/);
  });

  it('sets verification expiry to approximately 24 hours from now', async () => {
    const before = Date.now();
    const request = createRequest(validBody);
    await POST(request);
    const after = Date.now();

    const createCall = (prisma.user.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const expiry = new Date(createCall.data.verificationExpiry).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    expect(expiry).toBeGreaterThanOrEqual(before + twentyFourHours);
    expect(expiry).toBeLessThanOrEqual(after + twentyFourHours);
  });

  it('sends verification email asynchronously', async () => {
    const request = createRequest(validBody);
    await POST(request);

    expect(sendNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EMAIL_VERIFICATION',
        recipient: 'test@example.com',
        recipientId: 'user-123',
      })
    );
  });

  it('returns 400 for missing email', async () => {
    const request = createRequest({ password: 'StrongP@ss1', name: 'Test' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('BAD_REQUEST');
  });

  it('returns 400 for invalid email format', async () => {
    const request = createRequest({ ...validBody, email: 'not-an-email' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    const request = createRequest({ ...validBody, password: 'weak' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.details?.field).toBe('password');
  });

  it('returns 400 for missing name', async () => {
    const request = createRequest({ email: 'test@example.com', password: 'StrongP@ss1' });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.details?.field).toBe('name');
  });

  it('returns 409 when email already exists', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    });

    const request = createRequest(validBody);
    const response = await POST(request);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.code).toBe('CONFLICT');
  });

  it('does not expose user ID in response', async () => {
    const request = createRequest(validBody);
    const response = await POST(request);

    const data = await response.json();
    expect(data.id).toBeUndefined();
    expect(data.userId).toBeUndefined();
    expect(data.token).toBeUndefined();
  });
});
