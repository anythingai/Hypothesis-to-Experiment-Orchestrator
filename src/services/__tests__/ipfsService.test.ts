/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('ipfs-http-client', () => ({
  create: () => ({
    version: () => Promise.resolve({ version: 'test' }),
    add: jest.fn().mockResolvedValue({ cid: { toString: () => 'testcid' }, size: 0 }),
    cat: async function* () { yield Buffer.from(''); }
  })
}));

import { ipfsService } from '../ipfsService';
import type { ElizaOSContext } from '../../elizaos/types';

describe('IPFSService getGatewayUrl', () => {
  beforeEach(() => {
    // Reset to defaults
    (ipfsService as any).initialized = false;
  });

  it('returns default gateway URL concatenated with CID', () => {
    const cid = 'QmTestCid';
    const url = ipfsService.getGatewayUrl(cid);
    expect(url).toBe('https://ipfs.io/ipfs/QmTestCid');
  });

  it('returns custom gateway URL from context', () => {
    const mockContext: ElizaOSContext = {
      logger: console,
      config: { IPFS_GATEWAY_URL: 'https://gateway.local/ipfs/' },
      runtime: {} as any
    };
    ipfsService.initialize(mockContext);
    const url = ipfsService.getGatewayUrl('CID', mockContext);
    expect(url).toBe('https://gateway.local/ipfs/CID');
  });
}); 