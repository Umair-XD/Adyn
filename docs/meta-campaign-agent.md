# MCP-Driven Meta Campaign System Documentation

## Overview

This system implements a **strict MCP-driven architecture** for Meta advertising campaign creation. The main project serves as a thin execution layer while all intelligence, strategy, and decision-making lives in specialized MCP (Model Context Protocol) servers.

## 🚫 CRITICAL ARCHITECTURE RULES

**Main Project (Thin Layer) - ONLY:**
- Handles Meta OAuth / access tokens
- Executes API calls with MCP-provided payloads
- Stores raw insights + execution logs
- **NEVER interprets Meta data or makes strategic decisions**

**MCP Servers - ALL Intelligence:**
- Owns ALL Meta data interpretation
- Owns campaign strategy logic
- Owns audience design decisions
- Owns creative strategy + variants
- Outputs API-ready payloads

## System Components

### 1. Main Orchestrator (`lib/meta-campaign-orchestrator.ts`)

The **ONLY** public interface for campaign creation:

```typescript
import { MetaCampaignOrchestrator } from '@/lib/meta-campaign-orchestrator';

const orchestrator = new MetaCampaignOrchestrator(accessToken);

const result = await orchestrator.createCampaign({
  ad_account_id: 'act_1234567890',
  business_goal: 'PURCHASE',
  campaign_name: 'Q1 Product Launch',
  budget_total: 5000,
  product_url: 'https://yoursite.com/product', // ESSENTIAL for intelligent campaigns
  creative_assets: [...],
  desired_geos: ['US', 'CA'],
  constraints: { max_cpa: 50 }
});
```

### 2. Adyn Marketing MCP Server

**Primary Intelligence Server** with 10 specialized tools:

#### Essential Product Analysis Tools:
- **`fetch_url`** - Fetches product/catalog page content
- **`extract_content`** - Extracts product info, features, pricing
- **`semantic_analyze`** - AI-powered product analysis for targeting insights

#### Campaign Intelligence Tools:
- **`account_audit`** - Analyzes account data quality (ZERO/LOW/RICH)
- **`strategy_engine`** - AI-powered strategic decisions
- **`audience_constructor`** - Builds Meta-compliant audiences
- **`placement_intelligence`** - Optimizes ad placements
- **`creative_strategy`** - AI-generated creative variants
- **`budget_optimizer`** - Optimizes budgets and bidding
- **`campaign_orchestrator`** - Outputs final API payloads

### 3. Adyn Support MCP Server

**Diagnostics & Error Handling Server** with 6 tools:
- **`error_decoder`** - Converts Meta API errors to human fixes
- **`policy_analyzer`** - Analyzes ad rejections
- **`learning_diagnostics`** - Diagnoses learning limited issues
- **`delivery_optimizer`** - Analyzes high CPM issues
- **`performance_analyzer`** - Suggests optimizations
- **`audience_optimizer`** - Detects audience overlap

## Product URL Analysis Flow (ESSENTIAL)

The system's intelligence comes from analyzing the product/catalog URL:

```typescript
// 1. Fetch product page content
const content = await mcpManager.callTool('adyn', 'fetch_url', {
  url: 'https://yoursite.com/product'
});

// 2. Extract structured product information
const productInfo = await mcpManager.callTool('adyn', 'extract_content', {
  html: content.html
});

// 3. AI-powered semantic analysis for marketing insights
const insights = await mcpManager.callTool('adyn', 'semantic_analyze', {
  text: productInfo.combined_text
});

// Results in intelligent targeting, messaging, and creative strategy
```

## Campaign Creation Workflow

### Step 1: Product Analysis (If URL Provided)
- Fetches and analyzes product page content
- Identifies target audiences, competitors, market sizing
- Extracts value propositions and key messaging
- Determines brand tone and positioning

### Step 2: Account Audit (MCP Intelligence)
- Classifies account as ZERO_DATA, LOW_DATA, or RICH_DATA
- Analyzes last 90 days performance
- Evaluates pixel health and audience availability

### Step 3: AI Strategy Engine (MCP Intelligence)
Based on data quality and product analysis:

**ZERO DATA:**
- Strategy = Discovery First
- Objective = Traffic/Engagement
- Focus on broad audiences + pixel building

**LOW DATA:**
- Strategy = Hybrid
- Mix of broad and interest targeting
- Conversion optimization with fallbacks

**RICH DATA:**
- Strategy = Performance Scaling
- Retargeting + Lookalike + Broad mix
- Value-based optimization

### Step 4: Intelligent Audience Construction (MCP)
- Uses product insights for precise targeting
- Creates retargeting, lookalike, interest, and broad audiences
- Validates interests and detects overlaps
- Applies proper exclusions

### Step 5: Creative Strategy (MCP + AI)
- Generates 3-6 creative variants per Ad Set
- Uses product analysis for messaging optimization
- Tests different angles: pain, benefit, social proof, offer
- Optimizes for specific audience types

### Step 6: Budget & Placement Optimization (MCP)
- Allocates budgets based on audience quality
- Selects optimal placements per creative format
- Ensures learning phase viability

### Step 7: API Execution (Main Project Only)
- Executes MCP-provided payloads in correct order
- Handles ID replacement and error recovery
- Logs all execution steps

## AI Usage Tracking

The system tracks AI Gateway usage across all MCP tools:

```json
{
  "ai_usage_summary": {
    "total_tokens": 15420,
    "total_cost": 0.0847,
    "by_tool": [
      {
        "tool": "semantic_analyze",
        "tokens": 8500,
        "cost": 0.0425
      },
      {
        "tool": "strategy_engine", 
        "tokens": 4200,
        "cost": 0.0231
      },
      {
        "tool": "creative_strategy",
        "tokens": 2720,
        "cost": 0.0191
      }
    ]
  }
}
```

## API Endpoint

### Create Campaign
```
POST /api/campaigns/create
```

**Request:**
```json
{
  "access_token": "your_meta_access_token",
  "ad_account_id": "act_1234567890",
  "business_goal": "PURCHASE",
  "campaign_name": "Q1 Product Launch",
  "budget_total": 5000,
  "product_url": "https://yoursite.com/product",
  "creative_assets": [
    {
      "type": "image",
      "asset_url": "https://example.com/image.jpg",
      "primary_texts": ["Discover amazing products"],
      "headlines": ["Best Products Ever"],
      "cta": "Shop Now",
      "landing_page_url": "https://example.com/products"
    }
  ],
  "desired_geos": ["US", "CA"],
  "age_range": { "min": 25, "max": 45 },
  "constraints": { "max_cpa": 50 }
}
```

**Response:**
```json
{
  "success": true,
  "campaign_id": "campaign_123",
  "adset_ids": ["adset_1", "adset_2"],
  "creative_ids": ["creative_1", "creative_2"],
  "product_insights": {
    "category": "Technology",
    "brand_tone": "innovative",
    "target_segments": [...],
    "competitive_advantages": [...]
  },
  "mcp_strategy": {
    "approach": "PERFORMANCE_SCALING",
    "adset_strategies": [...],
    "ai_reasoning": "..."
  },
  "ai_usage_summary": {
    "total_tokens": 15420,
    "total_cost": 0.0847,
    "by_tool": [...]
  },
  "execution_log": [...]
}
```

## Testing Interface

Visit `/test-mcp` for a complete testing interface that demonstrates:
- Product URL analysis
- MCP-driven campaign creation
- AI usage tracking
- Execution logging
- Error handling via Support MCP

## Key Benefits

### 1. Intelligent Product-Based Campaigns
- Analyzes your product pages to create targeted campaigns
- Uses AI to identify optimal audiences and messaging
- Creates campaigns that understand what you're selling

### 2. Strict Separation of Concerns
- Main project never makes strategic decisions
- All intelligence lives in specialized MCP servers
- Clear boundaries between execution and strategy

### 3. AI-Powered Decision Making
- Uses GPT-4o for strategic analysis and creative generation
- Tracks token usage and costs for transparency
- Provides detailed reasoning for all decisions

### 4. Comprehensive Error Handling
- Support MCP analyzes and explains Meta API errors
- Provides actionable fixes and suggestions
- Handles policy violations and delivery issues

### 5. Future-Proof Architecture
- MCP servers can be enhanced independently
- Easy to adapt to Meta API changes
- Scalable intelligence without touching main project

## File Structure

```
lib/
├── meta-campaign-orchestrator.ts    # Main orchestration (thin layer)
├── mcp-client.ts                    # MCP connection management
├── meta-api.ts                      # Meta API client
└── token-estimator.ts               # AI usage tracking

mcp-servers/
├── adyn-marketing/                  # Primary intelligence server
│   └── src/tools/
│       ├── fetch-url.ts            # ESSENTIAL: Product URL fetching
│       ├── extract-content.ts      # ESSENTIAL: Product info extraction
│       ├── semantic-analyze.ts     # ESSENTIAL: AI product analysis
│       ├── account-audit.ts
│       ├── strategy-engine.ts      # AI-powered strategy
│       ├── audience-constructor.ts
│       ├── placement-intelligence.ts
│       ├── creative-strategy.ts    # AI-powered creatives
│       ├── budget-optimizer.ts
│       └── campaign-orchestrator.ts
└── adyn-support/                   # Support & diagnostics server
    └── src/tools/
        ├── error-decoder.ts
        ├── policy-analyzer.ts
        └── [other support tools]

app/
├── api/campaigns/create/route.ts   # API endpoint
└── test-mcp/page.tsx              # Testing interface
```

## Best Practices

### 1. Always Provide Product URLs
- Essential for intelligent campaign creation
- Enables AI-powered audience targeting
- Creates campaigns that understand your product

### 2. Trust MCP Intelligence
- Don't override MCP decisions in main project
- All strategy should come from MCP servers
- Main project only executes, never interprets

### 3. Monitor AI Usage
- Track token consumption and costs
- Optimize prompts in MCP tools if needed
- Use AI insights to improve campaign performance

### 4. Leverage Product Analysis
- Use semantic analysis results for manual optimizations
- Apply insights to other marketing channels
- Build audience personas from AI analysis

This MCP-driven architecture ensures intelligent, product-aware campaign creation while maintaining strict separation between execution and strategy.