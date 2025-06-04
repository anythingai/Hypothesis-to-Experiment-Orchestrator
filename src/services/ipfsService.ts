// src/services/ipfsService.ts
import { create } from "ipfs-http-client";
import type { IPFSHTTPClient } from "ipfs-http-client";
// import { logger } from '../utils/logger'; // Logger will be passed via context
import type { ElizaOSContext } from '../elizaos/types'; // Import ElizaOSContext
import { ApplicationError, ErrorCode } from '../utils/errorHandling';

// Default IPFS configuration, can be overridden by context.config
const DEFAULT_IPFS_API_URL = 'http://localhost:5001/api/v0';
const DEFAULT_IPFS_GATEWAY_URL = 'https://ipfs.io/ipfs/';
const DEFAULT_IS_PRODUCTION = false; // Default to development mode

// Config keys to look for in context.config or process.env
// IPFS endpoint (can be local node or Pinata Cloud URL)
const IPFS_ENDPOINT_CONFIG_KEY = 'IPFS_ENDPOINT';
const IPFS_PROVIDER_CONFIG_KEY = 'IPFS_PROVIDER';
// Optional Pinata authentication
const IPFS_API_KEY_CONFIG_KEY = 'IPFS_API_KEY';
const IPFS_API_SECRET_CONFIG_KEY = 'IPFS_API_SECRET';
const IPFS_JWT_CONFIG_KEY = 'PINATA_JWT';
// Gateway URL for read-only access
const IPFS_GATEWAY_URL_CONFIG_KEY = 'IPFS_GATEWAY_URL';
// Production flag
const IS_PRODUCTION_CONFIG_KEY = 'IS_PRODUCTION';

class IPFSService {
  private client: IPFSHTTPClient | null = null;
  private initialized = false;
  private logger: ElizaOSContext['logger'] = console; // Default logger
  private apiUrl: string = DEFAULT_IPFS_API_URL;
  private gatewayUrl: string = DEFAULT_IPFS_GATEWAY_URL;
  private isProduction: boolean = DEFAULT_IS_PRODUCTION;

  constructor() {
    // Minimal constructor
  }

  initialize(context: ElizaOSContext): void {
    this.logger = context.logger || console;

    // Determine API URL (supporting local IPFS or Pinata Cloud URL)
    this.apiUrl = (
      (context.config?.[IPFS_ENDPOINT_CONFIG_KEY] as string) ||
      process.env[IPFS_ENDPOINT_CONFIG_KEY] ||
      DEFAULT_IPFS_API_URL
    );
                  
    // Override endpoint for Pinata provider
    const provider = (context.config?.[IPFS_PROVIDER_CONFIG_KEY] as string) || process.env[IPFS_PROVIDER_CONFIG_KEY];
    if (provider === 'pinata') {
      this.apiUrl = 'https://api.pinata.cloud/pinning';
    }

    // Determine gateway URL
    this.gatewayUrl = (
      (context.config?.[IPFS_GATEWAY_URL_CONFIG_KEY] as string) ||
                      process.env[IPFS_GATEWAY_URL_CONFIG_KEY] || 
      DEFAULT_IPFS_GATEWAY_URL
    );

    // Determine if running in production
    if (context.config?.[IS_PRODUCTION_CONFIG_KEY] !== undefined) {
        this.isProduction = !!context.config[IS_PRODUCTION_CONFIG_KEY];
    } else if (process.env[IS_PRODUCTION_CONFIG_KEY] !== undefined) {
        this.isProduction = process.env[IS_PRODUCTION_CONFIG_KEY]?.toLowerCase() === 'true';
    } else {
        this.isProduction = DEFAULT_IS_PRODUCTION;
    }
    
    this.logger.info(`IPFSService: Attempting to initialize. API URL: ${this.apiUrl}, Gateway: ${this.gatewayUrl}, Production: ${this.isProduction}`);

    try {
      // Prepare client config with optional Pinata auth
      const clientConfig: Record<string, unknown> = { url: this.apiUrl };
      const jwt = context.config?.[IPFS_JWT_CONFIG_KEY] as string || process.env[IPFS_JWT_CONFIG_KEY];
      const apiKey = context.config?.[IPFS_API_KEY_CONFIG_KEY] as string || process.env[IPFS_API_KEY_CONFIG_KEY];
      const apiSecret = context.config?.[IPFS_API_SECRET_CONFIG_KEY] as string || process.env[IPFS_API_SECRET_CONFIG_KEY];
      if (jwt) {
        clientConfig.headers = { Authorization: `Bearer ${jwt}` };
      } else if (apiKey && apiSecret) {
        const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        clientConfig.headers = { Authorization: `Basic ${basic}` };
      }
      this.client = create(clientConfig);
      
      this.client.version()
        .then(version => {
          this.logger.info(`IPFS connection established: ${version.version}`);
          this.initialized = true;
        })
        .catch(initError => {
          this.logger.error('Failed to connect to IPFS during initialization:', { 
              error: initError instanceof Error ? initError.message : String(initError), 
              apiUrl: this.apiUrl 
          });
          if (this.isProduction) {
            this.client = null;
            this.initialized = false;
            this.logger.error('IPFSService: CRITICAL - Failed to initialize IPFS client in production.');
          } else {
            this.logger.warn('IPFSService: Creating mock IPFS client for development as real connection failed.');
            this.client = null;
      this.initialized = true;
          }
        });
    } catch (error) {
      this.logger.error('Synchronous error creating IPFS client:', { 
          error: error instanceof Error ? error.message : String(error), 
          apiUrl: this.apiUrl 
      });
      if (this.isProduction) {
        this.initialized = false;
        this.client = null;
      } else {
        this.logger.warn('IPFSService: Using mock IPFS due to synchronous client creation error.');
        this.initialized = true;
        this.client = null;
      }
    }
  }

  private async ensureInitialized(context: ElizaOSContext): Promise<void> {
    if (!this.initialized) {
      this.logger.info('IPFSService: Auto-initializing...');
      this.initialize(context); 
    }
  }

  async store(data: string | Buffer): Promise<string> {
    if (!this.client) {
      throw new ApplicationError('IPFS client not initialized', ErrorCode.SERVICE_UNAVAILABLE);
    }
    
    try {
      const content = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
      
      const result = await this.client.add(content);
      this.logger.info(`IPFS: Successfully stored content`, { 
        hash: result.cid.toString(),
        size: result.size 
      });
      
      return result.cid.toString();
    } catch (error) {
      this.logger.error('IPFS: Failed to store content', { error });
      throw new ApplicationError(
        'Failed to store content to IPFS',
        ErrorCode.SERVICE_UNAVAILABLE,
        { originalError: error }
      );
    }
  }

  async retrieve(hash: string): Promise<Buffer> {
    if (!this.client) {
      throw new ApplicationError('IPFS client not initialized', ErrorCode.SERVICE_UNAVAILABLE);
    }
    
    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks);
      this.logger.info(`IPFS: Successfully retrieved content`, { 
        hash,
        size: content.length 
      });
      
      return content;
    } catch (error) {
      this.logger.error('IPFS: Failed to retrieve content', { hash, error });
      throw new ApplicationError(
        'Failed to retrieve content from IPFS',
        ErrorCode.SERVICE_UNAVAILABLE,
        { hash, originalError: error }
      );
    }
  }

  getGatewayUrl(cid: string, context?: ElizaOSContext): string {
    if (context && !this.initialized) { 
        this.logger.warn('IPFSService: getGatewayUrl called before explicit initialization. Gateway URL might be default.');
    }
    const effectiveLogger = context?.logger || this.logger;
    effectiveLogger.debug(`IPFSService: Getting gateway URL for CID: ${cid}. Using base: ${this.gatewayUrl}`);
    return `${this.gatewayUrl}${cid}`;
  }
  
  async shutdown(context?: ElizaOSContext): Promise<void> {
    const effectiveLogger = context?.logger || this.logger;
    effectiveLogger.info('IPFSService: Shutting down');
    this.client = null;
    this.initialized = false;
  }
}

export const ipfsService = new IPFSService(); 