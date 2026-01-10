# MCP-Driven Meta Ads Architecture

## Overview

This system implements a **strict separation of concerns** between the main project and MCP (Model Context Protocol) servers for Meta advertising campaign creation and management.

## Architecture Principles

### 🚫 STRICT RULES (NON-NEGOTIABLE)

**Main Project (Thin Layer) - ONLY:**
- Handles Meta OAuth / access tokens
- Handles Ad Account connection  
- Handles Pixel + Conversions API wiring
- Executes API calls with payloads returned by MCP
- Stores raw insights + execution logs
- **NEVER interprets Meta data**

**MCP Servers - ALL Intelligence:**
- Owns ALL Meta data interpretation
- Owns campaign strategy logic
- Owns audience design decisions
- Owns placement decisions
- Owns creative strategy + variants
- Owns learning-phase and scaling logic
- Outputs API-ready payloads

## System Components

### 1. Main Project (`lib/meta-campaign-orchestrator.ts`)

**Responsibilities:**
- Fetch raw account data (no interpretation)
- Send data to MCP servers for processing
- Execute API calls with MCP-provided payloads
- Log execution results
- Handle errors via Support MCP

**Key Methods:**
- `createCampaign()` - Main orchestration method
- `fetchRawAccountData()` - Gets raw Meta data
- `executeAPISequence()` - Executes MCP payloads

### 2. Adyn Marketing MCP (`mcp-servers/adyn-marketing/`)

**Primary Intelligence Server** - Handles all Meta strategy and decision-making:

#### Tools:
1. **`account_audit`** - Analyzes account data quality (ZERO/LOW/RICH)
2. **`strategy_engine`** - Determines campaign approach and objectives
3. **`audience_constructor`** - Builds Meta-compliant audiences
4. **`placement_intelligence`** - Optimizes ad placements per creative format
5. **`creative_strategy`** - Creates angle-based creative variants
6. **`budget_optimizer`** - Optimizes budgets and bidding strategies
7. **`campaign_orchestrator`** - Outputs final API payloads

### 3. Adyn Support MCP (`mcp-servers/adyn-support/`)

**Diagnostics & Error Handling Server:**

#### Tools:
1. **`error_decoder`** - Converts Meta API errors to human-readable fixes
2. **`policy_analyzer`** - Analyzes ad rejections and policy violations
3. **`learning_diagnostics`** - Diagnoses learning limited issues
4. **`delivery_optimizer`** - Analyzes high CPM and delivery issues
5. **`performance_analyzer`** - Suggests creative and targeting improvements
6. **`audience_optimizer`** - Detects overlap and suggests consolidation

## Meta Object Model (Enforced)

```
Campaign
└── Ad Set (ONE audience + ONE placement strategy)
    └── Ads (multiple creatives for SAME audience)
```

**Rules:**
- Each Ad Set = exactly ONE audience definition
- Each Ad Set = its OWN placements
- Creatives vary ONLY inside an Ad Set
- Different audiences → different Ad Sets
- NEVER mix audiences inside a single Ad Set

## Task Flow

### Step 1: Account Audit (MCP)
- Classifies account as ZERO_DATA, LOW_DATA, or RICH_DATA
- Analyzes last 90 days performance
- Evaluates pixel health and audience availability
- Returns structured audit with recommendations

### Step 2: Strategy Decision Engine (MCP)
**IF ZERO DATA:**
- Strategy = Discovery First
- Objective = Traffic or Engagement
- Audience = Broad + light interests

**IF LOW DATA:**
- Strategy = Hybrid
- Objective = Conversions
- Audiences = Broad + Interest-stacked

**IF RICH DATA:**
- Strategy = Performance Scaling
- Audiences = Retargeting + Lookalike + Broad
- Budget weighted by historical CPA

### Step 3: Audience Construction (MCP)
- Validates interests via Targeting Search
- Creates retargeting, lookalike, interest, and broad audiences
- Excludes converters from prospecting Ad Sets
- Detects and warns about audience overlap

### Step 4: Placement Intelligence (MCP)
- Matches creative formats to optimal placements
- Reels/Stories → vertical video only
- Feed → image + square/landscape video
- Advantage+ placements only if creative coverage exists

### Step 5: Creative Strategy (MCP)
For EACH Ad Set, creates 3-6 creatives with different angles:
- Pain-focused
- Benefit-focused  
- Social proof
- Offer-driven
- Urgency
- Curiosity

### Step 6: Budget & Bidding Optimization (MCP)
- Determines daily vs lifetime budget
- Selects bid strategy (lowest cost, cost cap, ROAS)
- Ensures learning phase viability (≈50 events/week)
- Sets realistic budgets for audience size

### Step 7: API Payload Generation (MCP)
Returns structured outputs:
```json
{
  "campaign_payload": {...},
  "adset_payloads": [...],
  "creative_payloads": [...], 
  "ad_payloads": [...],
  "api_execution_order": [...],
  "validation_checklist": [...],
  "risk_flags": [...],
  "support_hooks": [...]
}
```

## Error Handling & Support Integration

When Meta returns errors:
1. Main project forwards error → Support MCP
2. Support MCP decodes error and maps to root cause
3. Support MCP suggests corrective actions:
   - New audience recommendations
   - Creative modifications
   - Budget adjustments
   - Policy-safe rewrites

## Advanced Features

### 1. Audience Versioning
- Every audience has v1, v2, v3 tracking
- Performance deltas monitored
- Automatic optimization suggestions

### 2. Creative-Audience Matrix
- Detects which creatives work for which audiences
- Recommends cloning winners into new Ad Sets
- Cross-pollination of successful combinations

### 3. Learning-Phase Guardian
- MCP blocks scaling if learning not stable
- Suggests consolidation automatically
- Monitors 50+ events/week threshold

### 4. Privacy-Safe Future-Proofing
- Prefers Broad + Creative signals over interests
- Reduces dependency on detailed targeting
- Pushes server-side events (Pixel + CAPI hybrid)

## Usage Example

```typescript
import { MetaCampaignOrchestrator } from '@/lib/meta-campaign-orchestrator';

const orchestrator = new MetaCampaignOrchestrator(accessToken);

const result = await orchestrator.createCampaign({
  ad_account_id: 'act_1234567890',
  business_goal: 'PURCHASE',
  campaign_name: 'Q1 Product Launch',
  budget_total: 5000,
  creative_assets: [...],
  desired_geos: ['US', 'CA'],
  constraints: { max_cpa: 50 }
});
```

## Testing

Visit `/test-mcp` to test the complete MCP-driven campaign creation flow with a simple UI.

## Key Benefits

1. **Separation of Concerns**: Main project never interprets Meta data
2. **Intelligent Decision Making**: All strategy lives in specialized MCP servers
3. **Error Recovery**: Automatic error analysis and corrective suggestions
4. **Scalability**: MCP servers can be enhanced independently
5. **Maintainability**: Clear boundaries between execution and intelligence
6. **Future-Proof**: Easy to adapt to Meta API changes via MCP updates

## File Structure

```
lib/
├── meta-campaign-orchestrator.ts    # Main orchestration (thin layer)
├── mcp-client.ts                    # MCP connection management
└── meta-api.ts                      # Meta API client

mcp-servers/
├── adyn-marketing/                  # Primary intelligence server
│   └── src/tools/
│       ├── account-audit.ts
│       ├── strategy-engine.ts
│       ├── audience-constructor.ts
│       ├── placement-intelligence.ts
│       ├── creative-strategy.ts
│       ├── budget-optimizer.ts
│       └── campaign-orchestrator.ts
└── adyn-support/                    # Support & diagnostics server
    └── src/tools/
        ├── error-decoder.ts
        ├── policy-analyzer.ts
        ├── learning-diagnostics.ts
        └── performance-analyzer.ts
```

This architecture ensures that the main project remains a thin execution layer while all Meta advertising intelligence and decision-making is handled by specialized MCP servers.