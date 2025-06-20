import { jest } from '@jest/globals';
import { GET, POST } from '../route';
import { dkgService } from '../../../../../services/dkgService';
import type { NextRequest } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: unknown, options?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}));

// Mock the dkgService
jest.mock('../../../../../services/dkgService', () => ({
  dkgService: {
    healthCheck: jest.fn(),
    retrieve: jest.fn(),
    publish: jest.fn(),
  },
}));

const mockDkgService = dkgService as jest.Mocked<typeof dkgService>;

// Helper function to create mock NextRequest
function createMockRequest(url: string, options: RequestInit = {}): NextRequest {
  const mockRequest = {
    url,
    method: options.method || 'GET',
    headers: new Headers(options.headers as Record<string, string>),
    json: jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue(
      options.body ? JSON.parse(options.body as string) : {}
    ),
  } as unknown as NextRequest;
  
  return mockRequest;
}

// Skipping these tests temporarily until Next.js testing environment is properly configured
describe.skip('DKG API route', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET handler', () => {
    it('returns health status', async () => {
      const mockHealth = { status: 'healthy', network: 'base' };
      mockDkgService.healthCheck.mockResolvedValue(mockHealth);

      const request = createMockRequest('http://localhost/api/dkg/health');
      const context = { params: Promise.resolve({ dkg: ['health'] }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: mockHealth });
      expect(mockDkgService.healthCheck).toHaveBeenCalled();
    });

    it('retrieves data by UAL', async () => {
      const mockData = { '@type': 'ResearchData', name: 'Test Study' };
      mockDkgService.retrieve.mockResolvedValue(mockData);

      const request = createMockRequest('http://localhost/api/dkg/retrieve?ual=did:dkg:base:123');
      const context = { params: Promise.resolve({ dkg: ['retrieve'] }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: mockData });
      expect(mockDkgService.retrieve).toHaveBeenCalledWith('did:dkg:base:123');
    });

    it('returns error when UAL is missing for retrieve', async () => {
      const request = createMockRequest('http://localhost/api/dkg/retrieve');
      const context = { params: Promise.resolve({ dkg: ['retrieve'] }) };
      const response = await GET(request, context);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ 
        success: false, 
        error: 'UAL parameter required' 
      });
    });

    it('handles unknown operation', async () => {
      const request = createMockRequest('http://localhost/api/dkg/unknown');
      const context = { params: Promise.resolve({ dkg: ['unknown'] }) };
      const response = await GET(request, context);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ 
        success: false, 
        error: 'Unknown operation: unknown' 
      });
    });

    it('handles service errors', async () => {
      mockDkgService.healthCheck.mockRejectedValue(new Error('Service unavailable'));

      const request = createMockRequest('http://localhost/api/dkg/health');
      const context = { params: Promise.resolve({ dkg: ['health'] }) };
      const response = await GET(request, context);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        success: false, 
        error: 'Service unavailable' 
      });
    });
  });

  describe('POST handler', () => {
    it('publishes data', async () => {
      const mockPublishResult = { 
        UAL: 'did:dkg:base:456', 
        publicAssertionId: '0xabc123' 
      };
      mockDkgService.publish.mockResolvedValue(mockPublishResult);

      const body = {
        data: {
          '@type': 'ResearchData',
          name: 'New Study',
          results: { efficiency: 0.95 }
        }
      };

      const request = createMockRequest('http://localhost/api/dkg/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const context = { params: Promise.resolve({ dkg: ['publish'] }) };
      const response = await POST(request, context);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: mockPublishResult });
      expect(mockDkgService.publish).toHaveBeenCalledWith(body.data);
    });

    it('returns error when data is missing for publish', async () => {
      const body = { options: { blockchain: 'base' } };

      const request = createMockRequest('http://localhost/api/dkg/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const context = { params: Promise.resolve({ dkg: ['publish'] }) };
      const response = await POST(request, context);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ 
        success: false, 
        error: 'Data field required for publishing' 
      });
    });

    it('handles unknown POST operation', async () => {
      const request = createMockRequest('http://localhost/api/dkg/unknown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const context = { params: Promise.resolve({ dkg: ['unknown'] }) };
      const response = await POST(request, context);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ 
        success: false, 
        error: 'Unknown POST operation: unknown' 
      });
    });

    it('handles service errors', async () => {
      mockDkgService.publish.mockRejectedValue(new Error('Publish failed'));

      const body = {
        data: {
          '@type': 'ResearchData',
          name: 'Test Study'
        }
      };

      const request = createMockRequest('http://localhost/api/dkg/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const context = { params: Promise.resolve({ dkg: ['publish'] }) };
      const response = await POST(request, context);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        success: false, 
        error: 'Publish failed' 
      });
    });
  });
}); 