# Hypothesis-to-Experiment Orchestrator (HEO) 🤖

## 🚀 Elevating Scientific Discovery with AI and Web3

The Hypothesis-to-Experiment Orchestrator (HEO) is an open-source ElizaOS plugin designed to dramatically accelerate scientific research workflows, particularly in fields like CRISPR and protein engineering. HEO aims to bridge the gap between AI-driven hypothesis generation and verifiable, reproducible experimental execution using decentralized technologies.

This project is being developed with the goal of competing in the Bio x AI Hackathon.

## ✨ Core Features

*   **AI-Powered Hypothesis Generation**: Leverages Large Language Models (e.g., Google Gemini Pro) integrated with Retrieval Augmented Generation (RAG) against scientific knowledge bases (e.g., OpenAlex/MEDLINE cached in OxiGraph) to produce novel research hypotheses.
*   **FAIR Data & Decentralized Knowledge**: Generates FAIR-compliant RDF triples for hypotheses, anchored on IPFS, and integrates with Decentralized Knowledge Graphs like OriginTrail DKG.
*   **Automated Protocol Design**: Facilitates the design and execution of experimental protocols, with future integration for BioDAO resource pooling and on-chain reagent tracking.
*   **Zero-Knowledge Proof Validation**: Implements zkSNARKs (Groth16 using `snarkjs` and ZoKrates-designed circuits) to cryptographically verify experimental computations and results, ensuring integrity and enabling privacy-preserving validation.
*   **Solana Integration**: Utilizes the Solana blockchain for anchoring proofs of experimental validity and potentially for minting IP-NFTs representing validated research outputs.
*   **ElizaOS Plugin Architecture**: Built as a modular plugin for the ElizaOS agent framework, enabling extensibility and integration with other ElizaOS services.

## 🛠️ Key Technologies

*   **Backend Framework**: Node.js, TypeScript
*   **AI Agent Framework**: ElizaOS
*   **Large Language Models**: Google Gemini Pro
*   **Knowledge Graph & RAG**: OxiGraph, OriginTrail DKG (conceptual)
*   **Zero-Knowledge Proofs**: `snarkjs`, ZoKrates (for circuit design)
*   **Blockchain**: Solana
*   **Decentralized Storage**: IPFS
*   **Frontend (Conceptual/Admin)**: Next.js, Tailwind CSS

## 🏗️ Architecture Overview

HEO follows a modular architecture:

1.  **User Query/Input**: A research question or area of interest.
2.  **Hypothesis Generation**:
    *   Relevant literature and data are retrieved from an OxiGraph cache (populated from sources like OpenAlex/MEDLINE).
    *   Google Gemini Pro, augmented with this retrieved context (RAG), generates hypotheses.
    *   Generated hypotheses are formatted as FAIR RDF triples and stored on IPFS.
3.  **Protocol Design & Execution (Future Scope)**:
    *   Based on the hypothesis, an experimental protocol is designed.
    *   Integration with BioDAOs for resource allocation (e.g., reagents).
4.  **Experimental Validation (zkSNARKs)**:
    *   Experimental data/computations are processed through a zkSNARK circuit (e.g., `experiment_validation.zok`).
    *   A proof of valid computation is generated using `snarkjs`.
5.  **On-Chain Anchoring**:
    *   The zkSNARK proof and relevant metadata (like IPFS CID of data) are anchored on the Solana blockchain.
    *   Validated results could trigger IP-NFT minting.

*(Refer to `prd.md` for a more detailed data flow diagram and technical specifications.)*

##  MCurrent Status

This project is currently under active development. Core functionalities for hypothesis generation with RAG, zkSNARK proof generation (`snarkjs` integration for a sample circuit), and basic Solana integration are being implemented and refined.

## ⚙️ Setup & Installation

1.  **Prerequisites**:
    *   Node.js (refer to project's `package.json` for version)
    *   `npm` (or `pnpm` if preferred, though `npm` is used for some installations in dev history)
    *   Docker (for OxiGraph and potentially other services)
    *   Git
2.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Environment Variables**:
    *   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Fill in the required API keys and configuration in `.env` (e.g., `GEMINI_API_KEY`, `SOLANA_RPC_URL`, `OXIGRAPH_ENDPOINT_URL`).
5.  **Run OxiGraph (if using locally for RAG)**:
    Refer to the project documentation or OriginTrail/OxiGraph documentation for instructions on setting up and populating OxiGraph. A typical Docker command might look like:
    ```bash
    docker run --rm -v /path/to/your/oxigraph-data:/data -p 7878:7878 ghcr.io/oxigraph/oxigraph serve --location /data --bind 0.0.0.0:7878
    ```
6.  **Circuit Artifacts**:
    *   Ensure that compiled zkSNARK circuit artifacts (`.wasm`, `.zkey`, `verification_key.json`) for `experiment_validation` are placed in the `circuits/experiment_validation/experiment_validation_simple_js/` directory. These are generated from `.zok` files using tools like ZoKrates and `snarkjs` trusted setup.

## ▶️ Running the Project

*   **Development Server (Next.js frontend, if applicable, and backend services via ElizaOS plugin):**
    ```bash
    npm run dev 
    ```
    (This command might vary based on how the ElizaOS plugin is typically run or tested. Check `package.json` scripts.)

*   **Specific Services/Tests**: Refer to individual service documentation or test scripts.

## 🤝 Contributing

Contributions are welcome! If you're interested in improving HEO or adding new features:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bug-fix`.
3.  **Make your changes.** Ensure you follow the coding style and conventions used in the project.
4.  **Write tests** for your changes, if applicable.
5.  **Commit your changes**: `git commit -m "feat: Describe your feature"` or `git commit -m "fix: Describe your fix"`.
6.  **Push to your branch**: `git push origin feature/your-feature-name`.
7.  **Open a Pull Request** against the `main` (or `develop`) branch of the original repository.

Please open an issue first to discuss any significant changes or new features you'd like to implement.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (assuming one will be added).

---

*This README is a work in progress and will be updated as the project evolves.* 
