import DKG from 'dkg.js';
import { BLOCKCHAIN_IDS } from 'dkg.js/constants';
import type { ElizaOSContext } from '../elizaos/types';

export class DkgService {
  // Using any until dkg.js provides type definitions
  private client: DKG | null = null;
  private logger: ElizaOSContext['logger'] = console;

  /**
   * Initialize the DKG client using context.config and context.logger
   */
  initialize(context: ElizaOSContext): void {
    this.logger = context.logger || console;
    const cfg = context.config as Record<string, string>;
    const endpoint = cfg.OT_NODE_HOSTNAME || process.env.OT_NODE_HOSTNAME!;
    const port = Number(cfg.OT_NODE_PORT || process.env.OT_NODE_PORT);
    const chainKey = cfg.BLOCKCHAIN_ID || process.env.BLOCKCHAIN_ID!;
    const blockchainName = BLOCKCHAIN_IDS[chainKey];
    this.logger.info('DkgService: Initializing DKG client', { endpoint, port, chain: blockchainName });
    this.client = new DKG({
      environment: cfg.ENVIRONMENT || process.env.ENVIRONMENT as string,
      endpoint,
      port,
      blockchain: {
        name: blockchainName,
        publicKey: cfg.PUBLIC_KEY || process.env.PUBLIC_KEY!,
        privateKey: cfg.PRIVATE_KEY || process.env.PRIVATE_KEY!,
      },
    });
  }

/**
   * Retrieve node info to verify connection
 */
  async nodeInfo(): Promise<unknown> {
    // Returns node info metadata
    return this.client!.node.info();
      }
      
  /**
   * Execute a SPARQL SELECT query against the DKG
   */
  async query(sparql: string): Promise<unknown> {
    return this.client!.graph.query(sparql, { type: 'SELECT' });
  }

  /**
   * Create a new Knowledge Asset or Collection with flexible options
   */
  async createAsset(content: unknown, options?: Record<string, unknown>): Promise<unknown> {
    return this.client!.asset.create(content, options || {});
      }

  /**
   * Retrieve a Knowledge Asset by its UAL (public/private/all)
   */
  async getAsset(ual: string, contentType: 'all' | 'public' | 'private' = 'all'): Promise<unknown> {
    return this.client!.asset.get(ual, { contentType });
  }
}

export const dkgService = new DkgService();