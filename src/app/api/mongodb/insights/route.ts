import { NextRequest, NextResponse } from 'next/server';
import { mongodbService } from '../../../../services/mongodbService';
import { logger } from '../../../../utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { datasetId, context } = await request.json();

    if (!datasetId || !context) {
      return NextResponse.json({
        success: false,
        error: 'datasetId and context are required'
      }, { status: 400 });
    }

    await mongodbService.initialize();
    const insight = await mongodbService.generateInsight(datasetId, context);

    logger.info('Research insight generated', { 
      insightId: insight.id,
      datasetId 
    });

    return NextResponse.json({
      success: true,
      insight,
      message: 'Research insight generated successfully'
    });

  } catch (error) {
    logger.error('Insight generation failed', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate insight',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    await mongodbService.initialize();

    // This would require implementing getInsightsByDataset in mongodbService
    // For now, return a demo response
    return NextResponse.json({
      success: true,
      insights: [],
      message: 'Insights endpoint ready - full implementation pending'
    });

  } catch (error) {
    logger.error('Insight retrieval failed', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 