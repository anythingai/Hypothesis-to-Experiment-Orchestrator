#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compileCircuit() {
  console.log('🔧 Compiling protocol_check circuit...');
  
  const circuitPath = path.resolve(__dirname, '../circuits/protocol_check.circom');
  const outputDir = path.resolve(__dirname, '../circuits/protocol_check_js');
  const ptauPath = path.resolve(__dirname, '../pot12_final.ptau');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Step 1: Compile circuit
    console.log('📦 Compiling Circom circuit...');
    execSync(`circom ${circuitPath} --r1cs --wasm --sym -o ${outputDir}`, { 
      stdio: 'inherit' 
    });
    
    // Step 2: Generate proving key
    console.log('🔑 Generating proving key...');
    execSync(`snarkjs groth16 setup ${outputDir}/protocol_check.r1cs ${ptauPath} ${outputDir}/protocol_check_0000.zkey`, { 
      stdio: 'inherit' 
    });
    
    // Step 3: Contribute to ceremony (for production, this would be a real ceremony)
    console.log('🎲 Contributing to trusted setup...');
    execSync(`snarkjs zkey contribute ${outputDir}/protocol_check_0000.zkey ${outputDir}/protocol_check_0001.zkey --name="Initial contribution" -v`, { 
      stdio: 'inherit',
      input: 'random entropy for ceremony\\n' 
    });
    
    // Step 4: Export verification key
    console.log('📤 Exporting verification key...');
    execSync(`snarkjs zkey export verificationkey ${outputDir}/protocol_check_0001.zkey ${outputDir}/verification_key.json`, { 
      stdio: 'inherit' 
    });
    
    // Step 5: Generate Solidity verifier
    console.log('⛓️ Generating Solidity verifier...');
    execSync(`snarkjs zkey export solidityverifier ${outputDir}/protocol_check_0001.zkey ${outputDir}/verifier.sol`, { 
      stdio: 'inherit' 
    });
    
    console.log('✅ Circuit compilation complete!');
    console.log(`📁 Files generated in: ${outputDir}`);
    console.log('📄 Key files:');
    console.log('  - protocol_check.wasm (circuit binary)');
    console.log('  - protocol_check_0001.zkey (proving key)');
    console.log('  - verification_key.json (verification key)');
    console.log('  - verifier.sol (Solidity verifier)');
    
  } catch (error) {
    console.error('❌ Circuit compilation failed:', error);
    process.exit(1);
  }
}

// Execute compileCircuit when running the script
  compileCircuit().catch(console.error);

export { compileCircuit }; 