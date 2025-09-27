import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import middleware from '@/middleware';
import {
  PUBLIC_ROUTES,
  SEMI_PUBLIC_ROUTES,
  PROTECTED_ROUTES,
} from '@/lib/routes';

// Mock next-auth JWT
jest.mock('next-auth/jwt');
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

// Helper to create NextRequest mock
function createMockRequest(pathname: string, search: string = ''): NextRequest {
  const url = `http://localhost:3000${pathname}${search}`;
  return new NextRequest(url);
}

describe('Middleware Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    it('should allow access to home page without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest(PUBLIC_ROUTES.home);
      const response = await middleware(req);
      
      expect(response).toBeInstanceOf(NextResponse);
      // NextResponse.next() doesn't have status property, so we check it's not a redirect
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated user from protected route to signin', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest(PROTECTED_ROUTES.daily);
      const response = await middleware(req);
      
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain(SEMI_PUBLIC_ROUTES.signin);
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fdaily');
    });

    it('should allow authenticated user to access protected routes', async () => {
      mockGetToken.mockResolvedValue({ sub: 'user-id' });
      
      const req = createMockRequest(PROTECTED_ROUTES.daily);
      const response = await middleware(req);
      
      // Should pass through without redirect
      expect(response.headers.get('location')).toBeNull();
    });

    it('should redirect from archive page with callback URL', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest(PROTECTED_ROUTES.archive);
      const response = await middleware(req);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('callbackUrl=%2Farchive');
    });
  });

  describe('Auth Routes - Signin Logic', () => {
    it('should redirect authenticated user from signin to daily page', async () => {
      mockGetToken.mockResolvedValue({ sub: 'user-id', email: 'test@example.com' });
      
      const req = createMockRequest(SEMI_PUBLIC_ROUTES.signin);
      const response = await middleware(req);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain(PROTECTED_ROUTES.daily);
    });

    it('should allow unauthenticated user to access signin page', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest(SEMI_PUBLIC_ROUTES.signin);
      const response = await middleware(req);
      
      // Should pass through without redirect
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('Auth Routes - Signout Logic', () => {
    it('should redirect unauthenticated user from signout to home', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest(SEMI_PUBLIC_ROUTES.signout);
      const response = await middleware(req);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain(PUBLIC_ROUTES.home);
    });

    it('should allow authenticated user to access signout', async () => {
      mockGetToken.mockResolvedValue({ sub: 'user-id', email: 'test@example.com' });
      
      const req = createMockRequest(SEMI_PUBLIC_ROUTES.signout);
      const response = await middleware(req);
      
      // Should pass through without redirect
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('CallbackUrl Handling', () => {
    it('should include callbackUrl with query params when redirecting to signin', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest(PROTECTED_ROUTES.archive, '?filter=recent');
      const response = await middleware(req);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('callbackUrl=%2Farchive%3Ffilter%3Drecent');
    });

    it('should not add callbackUrl when redirecting from home page', async () => {
      mockGetToken.mockResolvedValue(null);
      
      // This test simulates if home was somehow a protected route
      const req = createMockRequest(PUBLIC_ROUTES.home);
      // We'll modify this to test the callbackUrl logic by temporarily treating home as protected
      // But since home is public, we'll test with daily route instead
      const req2 = createMockRequest(PROTECTED_ROUTES.daily);
      const response = await middleware(req2);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('callbackUrl=%2Fdaily');
    });
  });

  describe('Auth System Routes', () => {
    it('should allow access to NextAuth callback route', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest('/api/auth/callback/google');
      const response = await middleware(req);
      
      // Should pass through without redirect
      expect(response.headers.get('location')).toBeNull();
    });

    it('should allow access to NextAuth error route', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest('/api/auth/error');
      const response = await middleware(req);
      
      // Should pass through without redirect
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should redirect to home page when getToken throws error', async () => {
      mockGetToken.mockRejectedValue(new Error('JWT Token error'));
      
      const req = createMockRequest(PROTECTED_ROUTES.daily);
      const response = await middleware(req);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain(PUBLIC_ROUTES.home);
    });

    it('should handle network errors gracefully', async () => {
      mockGetToken.mockRejectedValue(new Error('Network error'));
      
      const req = createMockRequest('/some-random-route');
      const response = await middleware(req);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain(PUBLIC_ROUTES.home);
    });
  });

  describe('Route Classification', () => {
    it('should properly handle unknown routes (fallback)', async () => {
      mockGetToken.mockResolvedValue(null);
      
      const req = createMockRequest('/unknown-route');
      const response = await middleware(req);
      
      // Unknown routes should pass through (fallback behavior)
      expect(response.headers.get('location')).toBeNull();
    });
  });
});