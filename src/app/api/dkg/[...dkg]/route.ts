import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dkgService } from '@/services/dkgService';

// Simplified DKG API route for hackathon demo
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ dkg: string[] }> }
) {
  try {
    const params = await context.params;
    const operation = params.dkg[0] || 'health';
    const { searchParams } = new URL(request.url);

    console.log('DKG GET request:', { operation, params: params.dkg });

    switch (operation) {
      case 'health':
        const health = await dkgService.healthCheck();
        return NextResponse.json({ success: true, data: health });

      case 'retrieve':
        const ual = searchParams.get('ual');
        if (!ual) {
          return NextResponse.json(
            { success: false, error: 'UAL parameter required' },
            { status: 400 }
          );
        }
        const data = await dkgService.retrieve(ual);
        return NextResponse.json({ success: true, data });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown operation: ${operation}` },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('DKG GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ dkg: string[] }> }
) {
  try {
    const params = await context.params;
    const operation = params.dkg[0] || 'publish';
    const body = await request.json();

    console.log('DKG POST request:', { operation, body });

    switch (operation) {
      case 'publish':
        if (!body.data) {
          return NextResponse.json(
            { success: false, error: 'Data field required for publishing' },
            { status: 400 }
          );
        }
        const publishResult = await dkgService.publish(body.data);
        return NextResponse.json({ success: true, data: publishResult });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown POST operation: ${operation}` },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('DKG POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 