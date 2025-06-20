import type { Db, ObjectId } from 'mongodb';

// MongoDB connection types
export type MongoDBConnection = {
  db: Db;
  client: unknown;
  isConnected: boolean;
};

export type DatasetDocument = {
  _id?: unknown;
  title: string;
  description: string;
  tags: string[];
  dataType: string;
  size: number;
  createdAt: Date;
  metadata: unknown;
  vector_embedding?: unknown;
  searchVector?: unknown;
};

export type InsightDocument = {
  _id?: unknown;
  datasetId: string;
  title: string;
  content: string;
  category: string;
  confidence: number;
  createdAt: Date;
  metadata: unknown;
};

// MongoDB service type definitions
export type MongoDBServiceType = {
  connect(): Promise<MongoDBConnection>;
  disconnect(): Promise<void>;
  getDatasets(filters?: unknown): Promise<DatasetDocument[]>;
  createDataset(dataset: Omit<DatasetDocument, '_id' | 'createdAt'>): Promise<string>;
  searchDatasets(query: string): Promise<DatasetDocument[]>;
  generateInsights(datasetId: string): Promise<InsightDocument[]>;
};

// Application-specific MongoDB types
export interface ScientificDataset {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
}

export interface ScientificInsight {
  _id?: ObjectId;
  id: string; 
  title: string;
  content: string;
} 