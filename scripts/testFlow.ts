// Load environment variables
import * as dotenv from 'dotenv';
// Import services via CommonJS for ts-node
import { hypothesisService } from '../src/services/hypothesisService.ts';
import { labAutomationService } from '../src/services/labAutomationService.ts';
import { zkSnarkService } from '../src/services/zkSnarkService.ts';
import { ipfsService } from '../src/services/ipfsService.ts';
import type { ElizaOSContext } from '../src/elizaos/types.ts';
import type { ExperimentalData } from '../src/services/zkSnarkService.ts';

async function main() {
  dotenv.config();
  const context: ElizaOSContext = { config: process.env as Record<string, unknown>, logger: console };

  const userQuery = 'Test hypothesis generation';
  console.log('1. Generating hypotheses...');
  const hypotheses = await hypothesisService.generateAndScoreHypotheses(
    { query: userQuery },
    context
  );
  if (!hypotheses.length) throw new Error('No hypotheses generated');
  const hypothesis = hypotheses[0];
  console.log('Hypothesis:', hypothesis.text);

  console.log('2. Submitting lab protocol...');
  const protocolPayload = {
    templateId: 'pcr_protocol',
    steps: ['Step 1', 'Step 2', 'Step 3'],
  };
  const runId = await labAutomationService.submitRun(protocolPayload);
  console.log('Run ID:', runId);
  const status = await labAutomationService.pollRunStatus(runId);
  console.log('Run status:', status);
  const resultsUnknown = await labAutomationService.fetchResults(runId);
  const results = resultsUnknown as ExperimentalData;
  console.log('Experimental results received');

  console.log('3. Generating and anchoring zkSNARK proof...');
  const { proofResult, transactionId } = await zkSnarkService.generateAndAnchorProof({
    protocolInstanceId: runId,
    rawData: results,
  });
  console.log('Proof IPFS CID:', proofResult.ipfsCid);
  console.log('Solana transaction signature:', transactionId);

  console.log('4. Storing full metadata on IPFS...');
  const metadata = {
    hypothesis: hypothesis.text,
    runId,
    proofCid: proofResult.ipfsCid,
    solanaTx: transactionId,
    timestamp: new Date().toISOString(),
  };
  const metadataCid = await ipfsService.store(JSON.stringify(metadata));
  console.log('Metadata IPFS CID:', metadataCid);

  console.log('Full user flow test complete.');
}

main().catch(err => {
  console.error('Error during test flow:', err);
  process.exit(1);
}); 