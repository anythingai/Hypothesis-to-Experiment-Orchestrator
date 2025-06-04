# HEO 2.0 — Hypothesis-to-Experiment Orchestrator

Automate AI-driven scientific research workflows with an ElizaOS plugin that handles:

- Hypothesis generation (Google Gemini + OxiGraph RAG)
- Cloud-Lab protocol execution (Strateos/ECL)
- zkSNARK proof generation & on-chain anchoring (Solana)
- FAIR JSON-LD packaging & IPFS storage

---

## Quickstart

### Prerequisites

- Node.js v18+ and pnpm (or npm)
- Circom/ZK-circuit artifacts built under `circuits/`
- A valid Solana keypair at `SOLANA_KEYPAIR_PATH`

### Setup

1. Clone the repository:

```bash
   git clone https://github.com/bio-xyz/HEO2.0.git
   cd HEO2.0
   ```

2. Install dependencies:

```bash
pnpm install
   ```

3. Configure environment variables:

```bash
   cp .env.example .env
   # Edit .env and fill in API keys, endpoints, and paths
   ```

4. Start the development server:

```bash
   pnpm run dev
   ```

5. Open your browser at [http://localhost:3000](http://localhost:3000) to explore the demo.

---

## Environment Variables

See `.env.example` for all required variables.

---

## API Endpoints

All endpoints are under the Next.js App Router (server routes):

- **POST** `/api/heo/generate` — Generate and score hypotheses via Google Gemini + OxiGraph RAG
- **POST** `/api/dkg/query` — Execute a SPARQL query against the OriginTrail DKG
- **POST** `/api/dkg/publish` — Publish a JSON asset to the OriginTrail DKG
- **POST** `/api/validation` — Validate experiment results with zkSNARK proof generation & Solana anchoring
- **POST** `/api/publish/fair` — Assemble and store FAIR JSON-LD package on IPFS
- **POST** `/api/lab/run` — Submit a protocol payload for cloud-lab execution (Strateos/ECL)
- **GET**  `/api/lab/run/[runId]` — Poll the status of a cloud-lab run
- **GET**  `/api/lab/run/[runId]/results` — Fetch execution results from a cloud-lab run
- **GET**  `/api/protocol/templates` — List all available protocol templates
- **GET**  `/api/protocol/templates/[id]` — Get details for a specific protocol template
- **POST** `/api/protocol/execute` — Initialize a protocol instance on Solana blockchain

---

## Project Structure

```
src/
├── app/              # Next.js pages and React demo components
├── elizaos/          # ElizaOS plugin types & adapter code
├── services/         # Core service implementations (hypothesis, lab, zkSNARK, IPFS, Solana)
├── circuits/         # zkSNARK circuit WASM, zkey, and verification key
└── utils/            # Shared utilities (logging, error handling)
```

---

## Running Tests & Lint

```bash
pnpm run lint    # ESLint
pnpm test        # Jest tests
pnpm build       # Next.js production build
```

---

## End-to-End Integration Test

To verify the complete HEO workflow (Hypothesis → Protocol Execution → Proof Generation & Anchoring → IPFS Storage), run the following:

1. Install development dependencies for TS-node ESM:

```bash
npm install --save-dev ts-node @types/node @types/dotenv
```

2. Ensure you have valid services running (or testnet endpoints configured) for:
   - OriginTrail DKG (OT_NODE_HOSTNAME, OT_NODE_PORT, BLOCKCHAIN_ID, PUBLIC_KEY, PRIVATE_KEY)
   - Strateos/ECL (`ECL_API_URL`, `ECL_API_KEY`)
   - Solana RPC (`SOLANA_RPC_URL`, `SOLANA_KEYPAIR_PATH`)
   - IPFS (local or Pinata via `IPFS_ENDPOINT`, `PINATA_JWT` or API key/secret)

3. Run the integration script:

```bash
npm run testFlow
```

This script will produce console logs for each step. You should see:

- Generated hypothesis text
- Cloud-lab run ID and status
- zkSNARK proof IPFS CID and Solana transaction signature
- Metadata CID for the combined JSON-LD on IPFS

If any step fails, verify your `.env` settings and that the respective service endpoints are accessible.

---

## License

This project is licensed under MIT. Please see [LICENSE](LICENSE) for details.
