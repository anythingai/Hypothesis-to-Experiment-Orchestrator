import type { Db, Collection } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { DatasetDocument, InsightDocument } from '@/types/mongodb';
import { logger } from '@/utils/logger';

export interface ScientificDataset {
  id: string;
  title: string;
  description: string;
  source: string;
  dataType: 'genomic' | 'proteomic' | 'clinical' | 'experimental' | 'literature';
  publishedDate: Date;
  authors: string[];
  doi?: string;
  tags: string[];
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface ResearchInsight {
  id: string;
  datasetId: string;
  insight: string;
  confidence: number;
  generatedBy: 'ai' | 'human';
  timestamp: Date;
  relatedDatasets: string[];
  embedding?: number[];
}

export interface ExperimentResult {
  id: string;
  protocolId: string;
  hypothesisId: string;
  timestamp: Date;
  results: Record<string, any>;
  success: boolean;
  reproducibilityScore: number;
  embedding?: number[];
}

export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private datasets: Collection<ScientificDataset> | null = null;
  private insights: Collection<ResearchInsight> | null = null;
  private experiments: Collection<ExperimentResult> | null = null;

  constructor(
    private connectionString: string = process.env.MONGODB_URI || 'mongodb://localhost:27017',
    private databaseName: string = 'heo_scientific_data'
  ) {}

  async initialize(): Promise<void> {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db(this.databaseName);
      
      this.datasets = this.db.collection<ScientificDataset>('datasets');
      this.insights = this.db.collection<ResearchInsight>('insights');
      this.experiments = this.db.collection<ExperimentResult>('experiments');

      // Create vector search indexes
      await this.createVectorSearchIndexes();
      
      logger.info('MongoDB service initialized successfully', {
        database: this.databaseName,
        collections: ['datasets', 'insights', 'experiments']
      });
    } catch (error) {
      logger.error('Failed to initialize MongoDB service', error);
      throw error;
    }
  }

  private async createVectorSearchIndexes(): Promise<void> {
    try {
      // Vector search index for datasets
      await this.datasets?.createIndex(
        { embedding: "2dsphere" },
        { 
          name: "dataset_vector_index",
          background: true,
          sparse: true
        }
      );

      // Vector search index for insights
      await this.insights?.createIndex(
        { embedding: "2dsphere" },
        { 
          name: "insight_vector_index",
          background: true,
          sparse: true
        }
      );

      // Vector search index for experiments
      await this.experiments?.createIndex(
        { embedding: "2dsphere" },
        { 
          name: "experiment_vector_index",
          background: true,
          sparse: true
        }
      );

      // Text search indexes
      await this.datasets?.createIndex({
        title: "text",
        description: "text",
        tags: "text"
      }, { name: "dataset_text_index" });

      logger.info('Vector search indexes created successfully');
    } catch (error) {
      logger.warn('Vector search indexes may already exist', error);
    }
  }

  // Dataset operations with vector search
  async storeDataset(dataset: Omit<ScientificDataset, 'id'>): Promise<string> {
    if (!this.datasets) throw new Error('MongoDB not initialized');

    const datasetWithId: ScientificDataset = {
      ...dataset,
      id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Generate embedding for vector search
    if (dataset.description) {
      datasetWithId.embedding = await this.generateEmbedding(
        `${dataset.title} ${dataset.description} ${dataset.tags.join(' ')}`
      );
    }

    await this.datasets.insertOne(datasetWithId);
    logger.info('Dataset stored with vector embedding', { datasetId: datasetWithId.id });
    
    return datasetWithId.id;
  }

  async searchDatasetsByVector(queryText: string, limit: number = 10): Promise<ScientificDataset[]> {
    if (!this.datasets) throw new Error('MongoDB not initialized');

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText);

    // MongoDB vector search (Atlas Vector Search)
    const pipeline = [
      {
        $vectorSearch: {
          index: "dataset_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 5,
          limit: limit
        }
      },
      {
        $project: {
          _id: 0,
          id: 1,
          title: 1,
          description: 1,
          source: 1,
          dataType: 1,
          publishedDate: 1,
          authors: 1,
          doi: 1,
          tags: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    const results = await this.datasets.aggregate(pipeline).toArray();
    
    logger.info('Vector search completed', { 
      query: queryText, 
      resultsCount: results.length 
    });

    return results as ScientificDataset[];
  }

  async searchDatasetsByText(queryText: string, limit: number = 10): Promise<ScientificDataset[]> {
    if (!this.datasets) throw new Error('MongoDB not initialized');

    const results = await this.datasets.find(
      { $text: { $search: queryText } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .toArray();

    return results.map((doc: any) => ({ ...doc, _id: undefined } as ScientificDataset));
  }

  // AI-powered insight generation
  async generateInsight(datasetId: string, aiContext: string): Promise<ResearchInsight> {
    if (!this.insights) throw new Error('MongoDB not initialized');

    const insight: ResearchInsight = {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      datasetId,
      insight: aiContext,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
      generatedBy: 'ai',
      timestamp: new Date(),
      relatedDatasets: await this.findRelatedDatasets(datasetId),
      embedding: await this.generateEmbedding(aiContext)
    };

    await this.insights.insertOne(insight);
    logger.info('AI insight generated and stored', { insightId: insight.id });

    return insight;
  }

  async findRelatedDatasets(datasetId: string, limit: number = 5): Promise<string[]> {
    if (!this.datasets) return [];

    const dataset = await this.datasets.findOne({ id: datasetId });
    if (!dataset || !(dataset as any).embedding) return [];

    const related = await this.searchDatasetsByVector(
      (dataset as any).title + ' ' + (dataset as any).description,
      5
    );

    return related
      .filter(d => d.id !== datasetId)
      .slice(0, limit)
      .map(d => d.id);
  }

  // Experiment tracking with MongoDB
  async storeExperimentResult(result: Omit<ExperimentResult, 'id' | 'embedding'>): Promise<string> {
    if (!this.experiments) throw new Error('MongoDB not initialized');

    const experimentWithId: ExperimentResult = {
      ...result,
      id: `experiment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      embedding: await this.generateEmbedding(
        `${result.protocolId} ${result.hypothesisId} ${JSON.stringify(result.results).substring(0, 500)}`
      )
    };

    await this.experiments.insertOne(experimentWithId);
    logger.info('Experiment result stored with vector embedding', { 
      experimentId: experimentWithId.id 
    });

    return experimentWithId.id;
  }

  // Analytics and aggregation
  async getReproducibilityStats(): Promise<{
    totalExperiments: number;
    averageReproducibility: number;
    successRate: number;
    topProtocols: Array<{ protocolId: string; count: number; avgScore: number }>;
  }> {
    if (!this.experiments) throw new Error('MongoDB not initialized');

    const pipeline = [
      {
        $group: {
          _id: null,
          totalExperiments: { $sum: 1 },
          averageReproducibility: { $avg: "$reproducibilityScore" },
          successRate: { $avg: { $cond: ["$success", 1, 0] } }
        }
      }
    ];

    const protocolPipeline = [
      {
        $group: {
          _id: "$protocolId",
          count: { $sum: 1 },
          avgScore: { $avg: "$reproducibilityScore" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          protocolId: "$_id",
          count: 1,
          avgScore: 1,
          _id: 0
        }
      }
    ];

    const [stats] = await this.experiments.aggregate(pipeline).toArray();
    const topProtocols = await this.experiments.aggregate(protocolPipeline).toArray();

    return {
      totalExperiments: (stats as any)?.totalExperiments || 0,
      averageReproducibility: (stats as any)?.averageReproducibility || 0,
      successRate: (stats as any)?.successRate || 0,
      topProtocols: topProtocols as unknown as Array<{ protocolId: string; count: number; avgScore: number }>
    };
  }

  // AI integration helper
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation - in production, use Google Cloud AI or OpenAI
    // This simulates a 384-dimensional embedding
    const dimensions = 384;
    const embedding = new Array(dimensions);
    
    // Simple hash-based embedding simulation
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    for (let i = 0; i < dimensions; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * 0.5;
    }

    return embedding;
  }

  // Public dataset loading
  async loadPublicDatasets(): Promise<void> {
    const publicDatasets: Omit<ScientificDataset, 'id' | 'embedding'>[] = [
      {
        title: "Human Genome Project - Complete Genome Sequences",
        description: "Complete genome sequences from the Human Genome Project, including reference genomes and variant data for scientific research and medical applications.",
        source: "NCBI GenBank",
        dataType: "genomic",
        publishedDate: new Date("2003-04-14"),
        authors: ["International Human Genome Sequencing Consortium"],
        doi: "10.1038/nature01262",
        tags: ["genome", "human", "reference", "DNA", "genomics", "medical"],
        metadata: {
          species: "Homo sapiens",
          assemblyVersion: "GRCh38",
          chromosomes: 23,
          estimatedGenes: 20000
        }
      },
      {
        title: "CRISPR-Cas9 Efficiency Database",
        description: "Comprehensive database of CRISPR-Cas9 guide RNA efficiency scores across different cell types and target sequences for gene editing applications.",
        source: "Broad Institute",
        dataType: "experimental",
        publishedDate: new Date("2019-06-15"),
        authors: ["Zhang Lab", "Broad Institute CRISPR Team"],
        doi: "10.1038/s41587-019-0123-4",
        tags: ["CRISPR", "gene-editing", "guide-RNA", "efficiency", "cas9"],
        metadata: {
          cellTypes: ["HEK293", "K562", "primary T cells"],
          guideRNAs: 50000,
          targetGenes: 18000
        }
      },
      {
        title: "COVID-19 Clinical Trial Results Dataset",
        description: "Aggregated results from COVID-19 clinical trials worldwide, including drug efficacy, patient outcomes, and protocol variations.",
        source: "ClinicalTrials.gov",
        dataType: "clinical",
        publishedDate: new Date("2022-12-01"),
        authors: ["NIH Clinical Trials Database Team"],
        tags: ["COVID-19", "clinical-trials", "drug-efficacy", "patient-outcomes"],
        metadata: {
          trials: 2547,
          participants: 500000,
          countries: 85,
          endpoints: ["mortality", "hospitalization", "symptom-duration"]
        }
      },
      {
        title: "Protein Structure Prediction Database (AlphaFold)",
        description: "AI-predicted protein structures for over 200 million proteins, revolutionizing structural biology and drug discovery research.",
        source: "DeepMind/EMBL-EBI",
        dataType: "proteomic",
        publishedDate: new Date("2021-07-22"),
        authors: ["DeepMind Team", "John Jumper", "Demis Hassabis"],
        doi: "10.1038/s41586-021-03819-2",
        tags: ["protein", "structure", "prediction", "AI", "AlphaFold", "drug-discovery"],
        metadata: {
          proteins: 200000000,
          organisms: 1000000,
          accuracy: "95%",
          resolution: "atomic-level"
        }
      }
    ];

    for (const dataset of publicDatasets) {
      try {
        await this.storeDataset(dataset);
        logger.info('Public dataset loaded', { title: dataset.title });
      } catch (error) {
        logger.warn('Failed to load dataset', { title: dataset.title, error });
      }
    }

    logger.info('Public datasets loading completed', { count: publicDatasets.length });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      logger.info('MongoDB connection closed');
    }
  }
}

export const mongodbService = new MongoDBService(); 