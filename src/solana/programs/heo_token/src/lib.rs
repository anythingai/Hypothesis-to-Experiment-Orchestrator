use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("HEOTokenProgramID");

#[program]
pub mod heo_token {
    use super::*;

    pub fn initialize_reward_pool(
        ctx: Context<InitializeRewardPool>,
        total_supply: u64,
    ) -> Result<()> {
        let reward_pool = &mut ctx.accounts.reward_pool;
        reward_pool.total_supply = total_supply;
        reward_pool.distributed = 0;
        reward_pool.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn reward_validator(
        ctx: Context<RewardValidator>,
        proof_hash: String,
        reward_amount: u64,
    ) -> Result<()> {
        let reward_pool = &mut ctx.accounts.reward_pool;
        
        // Verify proof exists and is valid
        require!(proof_hash.len() > 0, HeoError::InvalidProofHash);
        
        // Check if reward pool has enough tokens
        require!(
            reward_pool.distributed + reward_amount <= reward_pool.total_supply,
            HeoError::InsufficientRewardPool
        );

        // Transfer tokens to validator
        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_pool_token.to_account_info(),
            to: ctx.accounts.validator_token.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, reward_amount)?;
        
        // Update reward pool state
        reward_pool.distributed += reward_amount;
        
        emit!(ValidatorRewarded {
            validator: ctx.accounts.validator.key(),
            proof_hash,
            amount: reward_amount,
        });

        Ok(())
    }

    pub fn reward_reuser(
        ctx: Context<RewardReuser>,
        experiment_ual: String,
        reuse_type: String,
        reward_amount: u64,
    ) -> Result<()> {
        let reward_pool = &mut ctx.accounts.reward_pool;
        
        // Verify experiment exists
        require!(experiment_ual.len() > 0, HeoError::InvalidExperimentUal);
        
        // Check reward pool
        require!(
            reward_pool.distributed + reward_amount <= reward_pool.total_supply,
            HeoError::InsufficientRewardPool
        );

        // Transfer tokens to reuser
        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_pool_token.to_account_info(),
            to: ctx.accounts.reuser_token.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, reward_amount)?;
        
        // Update state
        reward_pool.distributed += reward_amount;
        
        emit!(ExperimentReused {
            reuser: ctx.accounts.reuser.key(),
            experiment_ual,
            reuse_type,
            amount: reward_amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeRewardPool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8
    )]
    pub reward_pool: Account<'info, RewardPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RewardValidator<'info> {
    #[account(mut)]
    pub reward_pool: Account<'info, RewardPool>,
    #[account(mut)]
    pub reward_pool_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub validator_token: Account<'info, TokenAccount>,
    /// CHECK: This is the validator being rewarded
    pub validator: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RewardReuser<'info> {
    #[account(mut)]
    pub reward_pool: Account<'info, RewardPool>,
    #[account(mut)]
    pub reward_pool_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub reuser_token: Account<'info, TokenAccount>,
    /// CHECK: This is the experiment reuser being rewarded
    pub reuser: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct RewardPool {
    pub authority: Pubkey,
    pub total_supply: u64,
    pub distributed: u64,
}

#[event]
pub struct ValidatorRewarded {
    pub validator: Pubkey,
    pub proof_hash: String,
    pub amount: u64,
}

#[event]
pub struct ExperimentReused {
    pub reuser: Pubkey,
    pub experiment_ual: String,
    pub reuse_type: String,
    pub amount: u64,
}

#[error_code]
pub enum HeoError {
    #[msg("Invalid proof hash provided.")]
    InvalidProofHash,
    #[msg("Invalid experiment UAL provided.")]
    InvalidExperimentUal,
    #[msg("Insufficient tokens in reward pool.")]
    InsufficientRewardPool,
} 