import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('foresight_user_stats').del();
  await knex('foresight_user_reads').del();
  await knex('foresight_drops').del();

  // Get today's date and yesterday's date for testing
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Insert sample foresight drops
  await knex('foresight_drops').insert([
    {
      drop_date: today,
      narratives: JSON.stringify([
        {
          name: 'AI Agent Renaissance',
          probability: 85,
          trend: 'rising',
          description: 'CT discourse shifting from AI memecoins to actual autonomous agents. Virtuals, ai16z, and Eliza ecosystem gaining serious dev attention.'
        },
        {
          name: 'L2 Consolidation',
          probability: 72,
          trend: 'stable',
          description: 'Base and Arbitrum solidifying dominance. Smaller L2s bleeding users. "L2 season" narrative cooling off.'
        },
        {
          name: 'DePIN Revival',
          probability: 58,
          trend: 'emerging',
          description: 'Render, Helium, Akash seeing renewed interest. Real-world utility narrative picking up steam.'
        }
      ]),
      token_signals: JSON.stringify([
        {
          symbol: 'VIRTUAL',
          rotation_probability: 78,
          momentum: 'strong',
          reason: 'AI agent narrative leader, high dev activity, partnerships with major projects'
        },
        {
          symbol: 'RNDR',
          rotation_probability: 65,
          momentum: 'building',
          reason: 'DePIN narrative gaining traction, GPU demand increasing with AI boom'
        },
        {
          symbol: 'ARB',
          rotation_probability: 54,
          momentum: 'neutral',
          reason: 'Solid fundamentals but overshadowed by Base growth'
        }
      ]),
      influencer_shifts: JSON.stringify([
        {
          handle: '@ai16zdao',
          impact_change: '+42',
          velocity: 'surging',
          topics: ['AI agents', 'Eliza framework', 'autonomous trading']
        },
        {
          handle: '@VitalikButerin',
          impact_change: '+18',
          velocity: 'steady',
          topics: ['Ethereum roadmap', 'ZK proofs', 'account abstraction']
        },
        {
          handle: '@cobie',
          impact_change: '-8',
          velocity: 'declining',
          topics: ['Market commentary', 'NFT analysis']
        }
      ]),
      sentiment_temperature: 'warm',
      sentiment_score: 68,
      one_thing_matters: 'The AI agent narrative is transitioning from speculation to actual product-market fit. Watch projects with real autonomous capabilities, not just GPT wrappers.',
      summary: 'CT is sobering up on AI. Pure memecoins are out, functional agents are in. L2s consolidating around Base/Arbitrum. DePIN making a quiet comeback as infrastructure thesis gains credibility.',
      is_published: true
    },
    {
      drop_date: yesterday,
      narratives: JSON.stringify([
        {
          name: 'Bitcoin ETF Flows',
          probability: 79,
          trend: 'stable',
          description: 'Institutional inflows remain strong. Tradfi adoption accelerating but retail participation still muted.'
        },
        {
          name: 'Meme Rotation Fatigue',
          probability: 68,
          trend: 'cooling',
          description: 'New memecoin launches getting less attention. Market demanding more substance.'
        },
        {
          name: 'DeFi 2.0 Whispers',
          probability: 45,
          trend: 'emerging',
          description: 'Early signals of DeFi innovation renaissance. Real yield narrative evolving.'
        }
      ]),
      token_signals: JSON.stringify([
        {
          symbol: 'ETH',
          rotation_probability: 71,
          momentum: 'steady',
          reason: 'Dencun upgrade hype building, L2 growth driving narrative'
        },
        {
          symbol: 'SOL',
          rotation_probability: 63,
          momentum: 'consolidating',
          reason: 'Post-memecoin mania cooldown, but fundamentals remain strong'
        },
        {
          symbol: 'AVAX',
          rotation_probability: 48,
          momentum: 'weak',
          reason: 'Struggling to maintain narrative momentum vs competitors'
        }
      ]),
      influencer_shifts: JSON.stringify([
        {
          handle: '@pmarca',
          impact_change: '+25',
          velocity: 'rising',
          topics: ['Tech acceleration', 'AI regulation', 'Startup funding']
        },
        {
          handle: '@CryptoCobain',
          impact_change: '+12',
          velocity: 'steady',
          topics: ['Altcoin analysis', 'Trading strategies']
        },
        {
          handle: '@SBF_FTX',
          impact_change: '-95',
          velocity: 'dead',
          topics: ['None - reputation destroyed']
        }
      ]),
      sentiment_temperature: 'neutral',
      sentiment_score: 52,
      one_thing_matters: 'Institutional Bitcoin adoption is the only narrative with real staying power right now. Everything else is noise.',
      summary: 'Market in wait-and-see mode. ETF flows solid but not explosive. Retail chasing memecoins with diminishing returns. Smart money accumulating quality L1s/L2s quietly.',
      is_published: true
    }
  ]);

  console.log('✅ Seeded 2 sample foresight drops (today + yesterday)');
}
