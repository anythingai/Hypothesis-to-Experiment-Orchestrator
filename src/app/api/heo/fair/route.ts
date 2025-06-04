import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fairService, type FairPackageInput } from '@/services/fairService';
import { ipfsService } from '@/services/ipfsService';
import type { ElizaOSContext } from '@/elizaos/types';

const fairSchema = z.object({
  protocol_instance_id: z.string(),
  protocol_template_id: z.string(),
  raw_data_cid: z.string(),
  solana_tx_uri: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parse = fairSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ success: false, errors: parse.error.errors }, { status: 400 });
  }
  const input = parse.data as FairPackageInput;
  const context: ElizaOSContext = { config: { ...process.env }, logger: console };

  // Initialize IPFS client before storing JSON-LD
  ipfsService.initialize(context);

  try {
    const cid = await fairService.storeFairPackage(input, context);
    const jsonLd = fairService.toJsonLd(input);
    return NextResponse.json({ success: true, data: { cid, jsonLd } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 