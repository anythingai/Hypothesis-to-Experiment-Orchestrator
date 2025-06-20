'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/utils/browserLogger';

interface ScientificDataset {
  id: string;
  title: string;
  description: string;
  source: string;
  dataType: 'genomic' | 'proteomic' | 'clinical' | 'experimental' | 'literature';
  publishedDate: string;
  authors: string[];
  doi?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  score?: number;
}

interface ResearchInsight {
  id: string;
  datasetId: string;
  insight: string;
  confidence: number;
  generatedBy: 'ai' | 'human';
  timestamp: string;
  relatedDatasets: string[];
}

export default function DatasetExplorer() {
  const [datasets, setDatasets] = useState<ScientificDataset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'vector' | 'text'>('vector');
  const [loading, setLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<ScientificDataset | null>(null);
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [insightContext, setInsightContext] = useState('');

  const loadDefaultDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mongodb/datasets');
      const data = await response.json();
      
      if (data.success) {
        setDatasets(data.datasets);
        logger.info('Default datasets loaded', { count: data.datasets.length });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      logger.error('Failed to load datasets', error);
      // Load demo datasets for demo purposes
      setDatasets(getDemoDatasets());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDefaultDatasets();
  }, [loadDefaultDatasets]);

  const searchDatasets = async () => {
    if (!searchQuery.trim()) {
      loadDefaultDatasets();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        type: searchType,
        limit: '20'
      });

      const response = await fetch(`/api/mongodb/datasets?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDatasets(data.datasets);
        logger.info('Dataset search completed', { 
          query: searchQuery, 
          type: searchType, 
          results: data.datasets.length 
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      logger.error('Dataset search failed', error);
      alert('Search failed. Using demo data.');
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    if (!selectedDataset || !insightContext.trim()) return;

    setGeneratingInsight(true);
    try {
      const response = await fetch('/api/mongodb/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          context: insightContext
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setInsights(prev => [data.insight, ...prev]);
        setInsightContext('');
        logger.info('Research insight generated', { insightId: data.insight.id });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      logger.error('Insight generation failed', error);
      alert('Insight generation failed. Try again.');
    } finally {
      setGeneratingInsight(false);
    }
  };

  const getDemoDatasets = (): ScientificDataset[] => [
    {
      id: 'demo-1',
      title: 'Human Genome Project - Complete Genome Sequences',
      description: 'Complete genome sequences from the Human Genome Project, including reference genomes and variant data for scientific research and medical applications.',
      source: 'NCBI GenBank',
      dataType: 'genomic',
      publishedDate: '2003-04-14',
      authors: ['International Human Genome Sequencing Consortium'],
      doi: '10.1038/nature01262',
      tags: ['genome', 'human', 'reference', 'DNA', 'genomics', 'medical'],
      metadata: {
        species: 'Homo sapiens',
        assemblyVersion: 'GRCh38',
        chromosomes: 23,
        estimatedGenes: 20000
      }
    },
    {
      id: 'demo-2', 
      title: 'CRISPR-Cas9 Efficiency Database',
      description: 'Comprehensive database of CRISPR-Cas9 guide RNA efficiency scores across different cell types and target sequences for gene editing applications.',
      source: 'Broad Institute',
      dataType: 'experimental',
      publishedDate: '2019-06-15',
      authors: ['Zhang Lab', 'Broad Institute CRISPR Team'],
      doi: '10.1038/s41587-019-0123-4',
      tags: ['CRISPR', 'gene-editing', 'guide-RNA', 'efficiency', 'cas9'],
      metadata: {
        cellTypes: ['HEK293', 'K562', 'primary T cells'],
        guideRNAs: 50000,
        targetGenes: 18000
      }
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Scientific Dataset Explorer</h1>
        <p className="text-muted-foreground">
          AI-powered vector search through scientific datasets using MongoDB Atlas
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Datasets</CardTitle>
          <CardDescription>
            Use vector search to find relevant scientific datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Query</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. CRISPR gene editing efficiency"
                onKeyPress={(e) => e.key === 'Enter' && searchDatasets()}
              />
            </div>
            <div>
              <Label htmlFor="search-type">Search Type</Label>
              <select
                id="search-type"
                title="Select search type: Vector Search uses AI embeddings for semantic search, Text Search uses traditional keyword matching"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'vector' | 'text')}
                className="w-full p-2 border rounded"
              >
                <option value="vector">Vector Search</option>
                <option value="text">Text Search</option>
              </select>
            </div>
          </div>
          <Button 
            onClick={searchDatasets} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Searching...' : 'Search Datasets'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset List */}
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({datasets.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`p-4 border rounded cursor-pointer transition-colors ${
                  selectedDataset?.id === dataset.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDataset(dataset)}
              >
                <h3 className="font-semibold text-sm">{dataset.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {dataset.description.substring(0, 150)}...
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                    {dataset.dataType}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                    {dataset.source}
                  </span>
                  {dataset.score && (
                    <span className="px-2 py-1 bg-green-100 text-xs rounded">
                      Score: {dataset.score.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Dataset Details & Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Dataset Details & AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDataset ? (
              <>
                <div>
                  <h3 className="font-semibold">{selectedDataset.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDataset.description}
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p><strong>Source:</strong> {selectedDataset.source}</p>
                    <p><strong>Published:</strong> {selectedDataset.publishedDate}</p>
                    <p><strong>Authors:</strong> {selectedDataset.authors.join(', ')}</p>
                    {selectedDataset.doi && (
                      <p><strong>DOI:</strong> {selectedDataset.doi}</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <strong className="text-xs">Tags:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDataset.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Insight Generation */}
                <div className="border-t pt-4">
                  <Label htmlFor="insight-context">Generate AI Insight</Label>
                  <Input
                    id="insight-context"
                    value={insightContext}
                    onChange={(e) => setInsightContext(e.target.value)}
                    placeholder="e.g. How can this dataset help with drug discovery?"
                    className="mt-2"
                  />
                  <Button 
                    onClick={generateInsight}
                    disabled={generatingInsight || !insightContext.trim()}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {generatingInsight ? 'Generating...' : 'Generate Insight'}
                  </Button>
                </div>

                {/* Generated Insights */}
                {insights.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">AI-Generated Insights</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {insights.map((insight) => (
                        <div key={insight.id} className="p-3 bg-green-50 rounded text-sm">
                          <p>{insight.insight}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {(insight.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a dataset to view details and generate AI insights
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 