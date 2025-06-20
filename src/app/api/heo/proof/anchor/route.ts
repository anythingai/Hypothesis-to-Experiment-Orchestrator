import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { solanaService } from '@/services/solanaService';
import type { ElizaOSContext } from '@/elizaos/types';
// ProofData type defined inline
interface ProofData {
  hash: string;
  publicInputs: string[];
  proof: any;
}

const anchorSchema = z.object({
  protocolInstanceId: z.string(),
  proof: z.any(),
  ipfsCid: z.string(),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parse = anchorSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ success: false, errors: parse.error.errors }, { status: 400 });
  }
  const { protocolInstanceId, proof, ipfsCid } = parse.data;
  const context: ElizaOSContext = { config: { ...process.env }, logger: console };
  
  // Mock proof anchoring for demo
  try {
    // In production, this would call solanaService.anchorProof
    const mockTxId = `mock-anchor-tx-${Date.now()}-${Math.random().toString(16).substr(2, 8)}`;
    
    // Simulate proof anchoring
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    return NextResponse.json({ 
      success: true, 
      transactionId: mockTxId,
      message: 'Proof anchored successfully (mock implementation)',
      details: {
        protocolInstanceId,
        ipfsCid,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 