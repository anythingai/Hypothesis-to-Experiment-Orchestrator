import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { mongodbService } from '../../../../services/mongodbService';
import { logger } from '../../../../utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const searchType = searchParams.get('type') || 'vector'; // 'vector' or 'text'
    const limit = parseInt(searchParams.get('limit') || '10');

    await mongodbService.initialize();

    if (!query) {
      // Return all datasets if no query
      const allDatasets = await mongodbService.searchDatasetsByText('', 50);
      return NextResponse.json({
        success: true,
        datasets: allDatasets,
        searchType: 'all',
        count: allDatasets.length
      });
    }

    let datasets;
    if (searchType === 'vector') {
      datasets = await mongodbService.searchDatasetsByVector(query, limit);
    } else {
      datasets = await mongodbService.searchDatasetsByText(query, limit);
    }

    logger.info('Dataset search completed', { 
      query, 
      searchType, 
      resultsCount: datasets.length 
    });

    return NextResponse.json({
      success: true,
      datasets,
      searchType,
      query,
      count: datasets.length
    });

  } catch (error) {
    logger.error('Dataset search failed', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search datasets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dataset = await request.json();

    await mongodbService.initialize();
    const datasetId = await mongodbService.storeDataset(dataset);

    logger.info('Dataset created', { datasetId });

    return NextResponse.json({
      success: true,
      datasetId,
      message: 'Dataset stored successfully'
    });

  } catch (error) {
    logger.error('Dataset creation failed', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create dataset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 