/**
 * IPFS Service - Simplified Mock Implementation for Hackathon Demo
 * 
 * This is a simplified mock implementation for demonstration purposes.
 * In production, this would connect to an actual IPFS node.
 */

import { logger } from '@/utils/logger';

interface IPFSFile {
  hash: string;
  path: string;
  size: number;
  data: any;
  mimeType?: string;
  uploadDate: Date;
}

class IPFSService {
  private mockStorage: Map<string, IPFSFile> = new Map();
  private hashCounter: number = 1000;

  constructor() {
    // Initialize with some sample data for demo
    this.initializeMockData();
  }

  private initializeMockData() {
    const sampleFiles = [
      {
        hash: 'QmSample1234567890abcdef',
        path: '/experiment-data/crispr-results.json',
        size: 1024,
        data: {
          experimentId: 'exp-001',
          results: { efficiency: 0.92, reproducibility: 0.95 },
          timestamp: '2025-06-20T12:00:00Z'
        },
        mimeType: 'application/json',
        uploadDate: new Date('2025-06-20')
      },
      {
        hash: 'QmSample2345678901bcdefg',
        path: '/protocols/pcr-protocol.json',
        size: 512,
        data: {
          protocolId: 'pcr-001',
          name: 'PCR Optimization Protocol',
          parameters: { temperature: 72, cycles: 30, time: 120 }
        },
        mimeType: 'application/json',
        uploadDate: new Date('2025-06-20')
      }
    ];

    sampleFiles.forEach(file => {
      this.mockStorage.set(file.hash, file);
    });
  }

  private generateMockHash(): string {
    this.hashCounter++;
    return `QmMock${this.hashCounter}${Math.random().toString(16).substr(2, 8)}`;
  }

  /**
   * Upload data to IPFS and return hash
   */
  async upload(data: any, options: {
    pin?: boolean;
    filename?: string;
    mimeType?: string;
  } = {}): Promise<{ hash: string; size: number }> {
    try {
      logger.info('Uploading to IPFS (mock):', { 
        dataType: typeof data, 
        filename: options.filename,
        pin: options.pin 
      });

      const hash = this.generateMockHash();
      const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
      const size = new Blob([serializedData]).size;

      const file: IPFSFile = {
        hash,
        path: options.filename ? `/${options.filename}` : `/file-${this.hashCounter}`,
        size,
        data,
        mimeType: options.mimeType || 'application/json',
        uploadDate: new Date()
      };

      this.mockStorage.set(hash, file);

      logger.info('Successfully uploaded to IPFS (mock):', { hash, size });

      return { hash, size };
    } catch (error) {
      logger.error('Failed to upload to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve data from IPFS by hash
   */
  async retrieve(hash: string): Promise<any> {
    try {
      logger.info('Retrieving from IPFS (mock):', { hash });

      const file = this.mockStorage.get(hash);
      if (!file) {
        throw new Error(`File not found: ${hash}`);
      }

      logger.info('Successfully retrieved from IPFS (mock):', { 
        hash, 
        size: file.size,
        mimeType: file.mimeType 
      });

      return file.data;
    } catch (error) {
      logger.error('Failed to retrieve from IPFS:', error);
      throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin content to ensure it stays available
   */
  async pin(hash: string): Promise<{ pinned: boolean }> {
    try {
      logger.info('Pinning to IPFS (mock):', { hash });

      const file = this.mockStorage.get(hash);
      if (!file) {
        throw new Error(`File not found for pinning: ${hash}`);
      }

      // Mock pinning - always succeeds
      logger.info('Successfully pinned to IPFS (mock):', { hash });

      return { pinned: true };
    } catch (error) {
      logger.error('Failed to pin to IPFS:', error);
      throw new Error(`IPFS pinning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unpin content from IPFS
   */
  async unpin(hash: string): Promise<{ unpinned: boolean }> {
    try {
      logger.info('Unpinning from IPFS (mock):', { hash });

      const file = this.mockStorage.get(hash);
      if (!file) {
        throw new Error(`File not found for unpinning: ${hash}`);
      }

      // Mock unpinning - always succeeds
      logger.info('Successfully unpinned from IPFS (mock):', { hash });

      return { unpinned: true };
    } catch (error) {
      logger.error('Failed to unpin from IPFS:', error);
      throw new Error(`IPFS unpinning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get information about stored files
   */
  async getFileInfo(hash: string): Promise<{
    hash: string;
    size: number;
    mimeType?: string;
    uploadDate: Date;
  }> {
    try {
      const file = this.mockStorage.get(hash);
      if (!file) {
        throw new Error(`File not found: ${hash}`);
      }

      return {
        hash: file.hash,
        size: file.size,
        mimeType: file.mimeType,
        uploadDate: file.uploadDate
      };
    } catch (error) {
      logger.error('Failed to get IPFS file info:', error);
      throw new Error(`IPFS file info failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all stored files (for demo purposes)
   */
  async listFiles(): Promise<Array<{
    hash: string;
    path: string;
    size: number;
    mimeType?: string;
    uploadDate: Date;
  }>> {
    try {
      const files = Array.from(this.mockStorage.values()).map(file => ({
        hash: file.hash,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadDate: file.uploadDate
      }));

      logger.info('Listed IPFS files (mock):', { count: files.length });

      return files;
    } catch (error) {
      logger.error('Failed to list IPFS files:', error);
      throw new Error(`IPFS list failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for IPFS service
   */
  async healthCheck(): Promise<{ status: string; nodeId?: string }> {
    try {
      // Mock health check - always returns healthy for demo
      return {
        status: 'healthy',
        nodeId: '12D3KooWMockNodeId123456789abcdef'
      };
    } catch (error) {
      logger.error('IPFS health check failed:', error);
      return {
        status: 'unhealthy'
      };
    }
  }

  /**
   * Initialize the IPFS service with context
   */
  initialize(context?: any): void {
    const effectiveLogger = context?.logger || logger;
    effectiveLogger.info('Initializing IPFS service (mock)');
    // Mock initialization - no actual setup needed for demo
  }

  /**
   * Shutdown the IPFS service
   */
  async shutdown(context?: any): Promise<void> {
    const effectiveLogger = context?.logger || logger;
    effectiveLogger.info('Shutting down IPFS service (mock)');
    // Mock shutdown - no actual cleanup needed for demo
  }

  /**
   * Get gateway URL for a given IPFS hash
   */
  getGatewayUrl(hash: string, context?: any): string {
    const effectiveLogger = context?.logger || logger;
    effectiveLogger.debug('Getting IPFS gateway URL (mock):', { hash });
    
    // Return a mock gateway URL for demo purposes
    return `https://ipfs.io/ipfs/${hash}`;
  }

  /**
   * Store data and return hash (alias for upload method)
   */
  async store(data: any, options?: {
    pin?: boolean;
    filename?: string;
    mimeType?: string;
  }): Promise<string> {
    const result = await this.upload(data, options);
    return result.hash;
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
export default ipfsService; 