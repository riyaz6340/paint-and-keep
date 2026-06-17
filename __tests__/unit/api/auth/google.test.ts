import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Hoist mock functions so they're available during module initialization
const mockVerifyIdToken = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockCreateSession = vi.hoisted(() => vi.fn());

// Mock google-auth-library
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

// Mock session
vi.mock('@/lib/session', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
}));

// Mock rate limiter (allow all requests by default)
vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: () => vi.fn().mockResolvedValue(null),
}));

// Import the route handler after mocks are set up
import { POST } from '@/app/api/auth/google/route';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when credential is missing', async () => {
    const request = createRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 when credential is not a string', async () => {
    const request = createRequest({ credential: 123 });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('returns 401 when Google token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token signature'));

    const request = createRequest({ credential: 'invalid-token' });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token payload has no email', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: '123', email_verified: true }),
    });

    const request = createRequest({ credential: 'valid-token' });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when email is not verified by Google', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        email_verified: false,
      }),
    });

    const request = createRequest({ credential: 'valid-token' });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('creates a new user when email does not exist', async () => {
    const payload = {
      email: 'newuser@example.com',
      name: 'New User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    });

    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'new-user-id',
      email: payload.email,
      name: payload.name,
      profileImage: payload.picture,
    });
    mockCreateSession.mockResolvedValue('session-token-123');

    const request = createRequest({ credential: 'valid-google-token' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('newuser@example.com');
    expect(body.sessionToken).toBe('session-token-123');

    // Verify user was created with correct data
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: 'newuser@example.com',
        name: 'New User',
        profileImage: 'https://example.com/photo.jpg',
        provider: 'GOOGLE',
        emailVerified: true,
        isActive: true,
      },
    });
  });

  it('updates existing user on login', async () => {
    const payload = {
      email: 'existing@example.com',
      name: 'Existing User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    });

    const existingUser = {
      id: 'existing-user-id',
      email: payload.email,
      name: payload.name,
      profileImage: payload.picture,
    };

    mockFindUnique.mockResolvedValue(existingUser);
    mockUpdate.mockResolvedValue(existingUser);
    mockCreateSession.mockResolvedValue('session-token-456');

    const request = createRequest({ credential: 'valid-google-token' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('existing@example.com');
    expect(body.sessionToken).toBe('session-token-456');

    // Verify user was updated, not created
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when session creation fails', async () => {
    const payload = {
      email: 'user@example.com',
      name: 'Test User',
      picture: null,
      email_verified: true,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    });

    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'user-id',
      email: payload.email,
      name: payload.name,
      profileImage: null,
    });
    mockCreateSession.mockResolvedValue(null);

    const request = createRequest({ credential: 'valid-token' });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('sets httpOnly session cookie in response', async () => {
    const payload = {
      email: 'cookie@example.com',
      name: 'Cookie User',
      picture: null,
      email_verified: true,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    });

    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'user-id',
      email: payload.email,
      name: payload.name,
      profileImage: null,
    });
    mockCreateSession.mockResolvedValue('cookie-session-token');

    const request = createRequest({ credential: 'valid-token' });
    const response = await POST(request);

    expect(response.status).toBe(200);

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('session_token=cookie-session-token');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/');
  });

  it('uses email prefix as name when Google name is missing', async () => {
    const payload = {
      email: 'noname@example.com',
      name: undefined,
      picture: null,
      email_verified: true,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    });

    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'user-id',
      email: payload.email,
      name: 'noname',
      profileImage: null,
    });
    mockCreateSession.mockResolvedValue('session-token');

    const request = createRequest({ credential: 'valid-token' });
    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'noname',
        }),
      })
    );
  });
});
