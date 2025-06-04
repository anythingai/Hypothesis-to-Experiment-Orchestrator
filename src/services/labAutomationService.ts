import type { ElizaOSContext } from '../elizaos/types';

export class LabAutomationService {
  // Fallback to mock if no ECL credentials provided
  private useMock: boolean = !process.env.ECL_API_KEY || !process.env.ECL_API_URL;
  private apiKey = process.env.ECL_API_KEY!;
  private baseUrl = process.env.ECL_API_URL!;

  initialize(context: ElizaOSContext): void {
    // No initialization needed for labAutomationService
    context.logger?.info('LabAutomationService: initialized');
  }

  /**
   * Submit a validated protocol payload to the cloud-lab API and return a runId
   */
  async submitRun(protocolPayload: unknown): Promise<string> {
    if (this.useMock) {
      console.warn('LabAutomationService: Missing ECL credentials, returning mock runId');
      return Promise.resolve('mock-run-id');
    }
    const res = await fetch(`${this.baseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(protocolPayload),
    });
    if (!res.ok) throw new Error(`ECL submit failed: ${res.status}`);
    const json = await res.json();
    return json.runId;
  }

  /**
   * Poll run status until completion (status "completed" or "failed")
   */
  async pollRunStatus(runId: string, intervalMs = 5000): Promise<unknown> {
    if (this.useMock) {
      console.warn('LabAutomationService: Missing ECL credentials, returning mock status');
      return Promise.resolve({ runId, status: 'completed' });
    }
    while (true) {
      const res = await fetch(`${this.baseUrl}/runs/${runId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error(`ECL status failed: ${res.status}`);
      const statusJson = await res.json();
      if (statusJson.status !== 'running') return statusJson;
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  /**
   * Fetch raw experimental results (CSV, images, logs)
   */
  async fetchResults(runId: string): Promise<unknown> {
    if (this.useMock) {
      console.warn('LabAutomationService: Missing ECL credentials, returning mock results');
      // Provide example mock results for demonstration
      return Promise.resolve({ runId, data: { result: 'mock experimental data' } });
    }
    const res = await fetch(`${this.baseUrl}/runs/${runId}/results`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`ECL fetchResults failed: ${res.status}`);
    return res.json();
  }
}

export const labAutomationService = new LabAutomationService(); 