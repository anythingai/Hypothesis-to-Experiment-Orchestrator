import type { NextRequest } from 'next/server';

// Mock token economics for demonstration
interface TokenBalance {
  address: string;
  balance: number;
  earned_from_validation: number;
  earned_from_reuse: number;
}

interface RewardTransaction {
  id: string;
  type: 'validation' | 'reuse';
  recipient: string;
  amount: number;
  proof_hash?: string;
  experiment_ual?: string;
  timestamp: string;
}

// Mock data - in production this would come from Solana program
const mockBalances: Record<string, TokenBalance> = {
  'demo_user': {
    address: 'demo_user',
    balance: 250,
    earned_from_validation: 150,
    earned_from_reuse: 100
  }
};

const mockTransactions: RewardTransaction[] = [
  {
    id: 'tx_001',
    type: 'validation',
    recipient: 'demo_user',
    amount: 50,
    proof_hash: 'QmZkSNARK123...',
    timestamp: new Date().toISOString()
  },
  {
    id: 'tx_002',
    type: 'reuse',
    recipient: 'demo_user',
    amount: 25,
    experiment_ual: 'did:dkg:gnosis_testnet/0x123.../0',
    timestamp: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') || 'demo_user';
  
  const balance = mockBalances[address] || {
    address,
    balance: 0,
    earned_from_validation: 0,
    earned_from_reuse: 0
  };

  return Response.json({
    success: true,
    data: {
      balance,
      recent_transactions: mockTransactions.filter(tx => tx.recipient === address).slice(0, 10),
      total_pool: 1000000,
      distributed: 25000,
      active_validators: 42,
      experiments_reused: 156
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, proof_hash, experiment_ual, recipient = 'demo_user' } = body;
  
  // Mock reward calculation
  let reward_amount = 0;
  if (type === 'validation') {
    reward_amount = 50; // Base validation reward
  } else if (type === 'reuse') {
    reward_amount = 25; // Base reuse reward
  }

  const transaction: RewardTransaction = {
    id: `tx_${Date.now()}`,
    type,
    recipient,
    amount: reward_amount,
    proof_hash,
    experiment_ual,
    timestamp: new Date().toISOString()
  };

  // Update mock balance
  if (mockBalances[recipient]) {
    mockBalances[recipient].balance += reward_amount;
    if (type === 'validation') {
      mockBalances[recipient].earned_from_validation += reward_amount;
    } else {
      mockBalances[recipient].earned_from_reuse += reward_amount;
    }
  }

  return Response.json({
    success: true,
    data: {
      transaction,
      new_balance: mockBalances[recipient]?.balance || reward_amount
    }
  });
} 