# Adyn MCP Tools Reference

## Adyn Marketing Agent Tools

### 1. fetch_url

**Purpose**: Fetches HTML content from a given URL

**Input Schema**:
```json
{
  "url": "string"
}
```

**Output Schema**:
```json
{
  "html": "string"
}
```

**Example**:
```javascript
Input: { url: "https://www.apple.com/iphone" }
Output: { html: "<!DOCTYPE html><html>..." }
```

**Implementation**: Uses axios with 10-second timeout and browser-like User-Agent

---

### 2. extract_content

**Purpose**: Extracts readable content, images, and metadata from HTML

**Input Schema**:
```json
{
  "html": "string"
}
```

**Output Schema**:
```json
{
  "title": "string",
  "text_blocks": ["string"],
  "images": ["string"],
  "metadata": {
    "description": "string",
    "keywords": "string",
    "og_title": "string",
    "og_description": "string",
    "og_image": "string"
  }
}
```

**Example**:
```javascript
Input: { html: "<!DOCTYPE html>..." }
Output: {
  title: "iPhone - Apple",
  text_blocks: ["The most powerful iPhone ever...", "..."],
  images: ["https://apple.com/image1.jpg", "..."],
  metadata: { description: "...", ... }
}
```

**Implementation**: Uses Cheerio for HTML parsing, extracts paragraphs and headings (min 20 chars), limits to 50 text blocks and 20 images

---

### 3. semantic_analyze

**Purpose**: Analyzes text content to extract marketing insights

**Input Schema**:
```json
{
  "text": "string"
}
```

**Output Schema**:
```json
{
  "summary": "string",
  "keywords": ["string"],
  "value_proposition": "string",
  "brand_tone": "string",
  "audience_persona": "string",
  "category": "string"
}
```

**Example**:
```javascript
Input: { text: "Introducing the new iPhone with advanced camera..." }
Output: {
  summary: "Introducing the new iPhone with advanced camera...",
  keywords: ["iphone", "camera", "advanced", "technology", ...],
  value_proposition: "High-quality technology solution...",
  brand_tone: "innovative",
  audience_persona: "tech-savvy professionals aged 25-45",
  category: "technology"
}
```

**Implementation**: 
- Frequency-based keyword extraction (top 10)
- Pattern matching for brand tone detection
- Category classification based on content
- Persona generation based on category and tone

**Brand Tones Detected**:
- innovative (cutting-edge, innovative)
- luxury (luxury, premium)
- playful (fun, exciting)
- eco-conscious (eco, sustainable)
- professional (default)

**Categories Detected**:
- technology
- fashion
- food & beverage
- health & wellness
- beauty
- general (default)

---

### 4. generate_ads

**Purpose**: Generates platform-specific ad creatives

**Input Schema**:
```json
{
  "summary": "string",
  "brand_tone": "string",
  "persona": "string",
  "keywords": ["string"],
  "platforms": ["facebook", "instagram", "tiktok", "google"]
}
```

**Output Schema**:
```json
{
  "ads": [
    {
      "platform": "string",
      "headline": "string",
      "primary_text": "string",
      "cta": "string",
      "creative_description": "string",
      "hashtags": ["string"]
    }
  ]
}
```

**Example**:
```javascript
Input: {
  summary: "New iPhone with advanced camera...",
  brand_tone: "innovative",
  persona: "tech-savvy professionals aged 25-45",
  keywords: ["iphone", "camera", "technology"],
  platforms: ["facebook", "instagram"]
}
Output: {
  ads: [
    {
      platform: "Facebook",
      headline: "Discover iphone Solutions",
      primary_text: "Looking for iphone? We've got exactly what tech-savvy professionals aged 25-45 need...",
      cta: "Learn More",
      creative_description: "Eye-catching image featuring iphone with innovative aesthetic...",
      hashtags: ["#iphone", "#camera", "#technology"]
    },
    {
      platform: "Instagram",
      headline: "✨ IPHONE ✨",
      primary_text: "Transform your experience with our innovative approach to iphone...",
      cta: "Shop Now",
      creative_description: "High-quality square image (1080x1080) with vibrant colors...",
      hashtags: ["#iphone", "#camera", "#technology", "#fyp", "#viral"]
    }
  ]
}
```

**Platform-Specific Features**:

**Facebook**:
- Professional headlines
- Detailed primary text
- "Learn More" CTA
- Lifestyle imagery descriptions

**Instagram**:
- Emoji-enhanced headlines
- Shorter, punchier text
- "Shop Now" CTA
- Square format (1080x1080)
- 5 hashtags including trending ones

**TikTok**:
- Attention-grabbing headlines
- POV-style text
- "Watch Now" CTA
- Vertical video (9:16) descriptions
- Hook in first 3 seconds
- Trending hashtags (#fyp, #viral)

**Google Ads**:
- Concise, benefit-focused headlines
- Trust signals in text
- "Get Started" CTA
- Clean product imagery
- No hashtags

---

### 5. audience_builder

**Purpose**: Builds detailed audience targeting parameters

**Input Schema**:
```json
{
  "persona": "string",
  "keywords": ["string"],
  "category": "string"
}
```

**Output Schema**:
```json
{
  "age_range": "string",
  "interest_groups": ["string"],
  "geos": ["string"],
  "behaviors": ["string"]
}
```

**Example**:
```javascript
Input: {
  persona: "tech-savvy professionals aged 25-45",
  keywords: ["iphone", "camera", "technology"],
  category: "technology"
}
Output: {
  age_range: "25-45",
  interest_groups: [
    "Technology",
    "Gadgets",
    "Innovation",
    "Software",
    "Mobile Apps",
    "Iphone",
    "Camera"
  ],
  geos: [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany"
  ],
  behaviors: [
    "Online shoppers",
    "Frequent buyers",
    "Deal seekers",
    "Early technology adopters",
    "Tech enthusiasts",
    "Mobile device users",
    "Engaged shoppers",
    "Social media users"
  ]
}
```

**Age Range Logic**:
- Extracted from persona text
- Category-based defaults:
  - Fashion: 18-35
  - Technology: 25-45
  - Luxury: 30-55
  - Health & Wellness: 25-50
  - Default: 25-54

**Interest Groups**:
- Category-based core interests
- Top 3 keywords added
- Limited to 10 total

**Geographic Targeting**:
- Default: US, UK, Canada, Australia, Germany
- Major English-speaking markets

**Behaviors**:
- Affluent/luxury: High-income, luxury shoppers
- Default: Online shoppers, frequent buyers
- Category-specific: Tech adopters, fashion enthusiasts, etc.

---

### 6. campaign_builder

**Purpose**: Creates complete campaign strategy

**Input Schema**:
```json
{
  "ads": [AdCreative],
  "audience": AudienceBuilderOutput,
  "objective": "string"
}
```

**Output Schema**:
```json
{
  "campaign_name": "string",
  "objective": "string",
  "budget_suggestion": "string",
  "duration_days": number,
  "platform_mix": ["string"],
  "formats": ["string"]
}
```

**Example**:
```javascript
Input: {
  ads: [{ platform: "Facebook", ... }, { platform: "Instagram", ... }],
  audience: { age_range: "25-45", ... },
  objective: "Conversions"
}
Output: {
  campaign_name: "Discover Campaign - 2024-11-16",
  objective: "Conversions",
  budget_suggestion: "$90/day (Total: $2700/month)",
  duration_days: 30,
  platform_mix: ["Facebook", "Instagram"],
  formats: ["Single Image", "Carousel", "Video"]
}
```

**Budget Calculation**:
- Base: $50/day
- Google Ads: +$30/day
- Facebook: +$20/day
- Instagram: +$20/day
- TikTok: +$25/day

**Duration**: Fixed at 30 days (1 month campaign)

**Formats by Platform**:
- Facebook/Instagram: Single Image, Carousel, Video
- TikTok: Vertical Video, In-Feed Ad
- Google: Search Ad, Display Ad, Shopping Ad

---

## Adyn Support Agent

**No Tools**: Pure conversational agent

**System Prompt**: Provides platform guidance, explains features, troubleshoots issues

**Constraints**:
- Never performs marketing analysis
- Never calls marketing tools
- Never generates ads or campaigns
- Redirects marketing requests: "This action is done by Adyn. Please use the main workspace."

**Capabilities**:
- Explains how features work
- Guides users through workflows
- Interprets system outputs
- Provides troubleshooting help

---

## Tool Chain Workflow

The complete Adyn generation workflow executes tools in sequence:

```
1. fetch_url(url)
   ↓
2. extract_content(html)
   ↓
3. semantic_analyze(text_blocks.join(' '))
   ↓
4. generate_ads(analysis + platforms)
   ↓
5. audience_builder(analysis)
   ↓
6. campaign_builder(ads + audience + objective)
   ↓
7. Return unified AdynOutput
```

**Total Execution Time**: Typically 10-30 seconds

**Error Handling**: Each tool has try-catch with structured error responses

---

## Unified Output Structure

All tools combine into this final structure:

```typescript
{
  product_summary: SemanticAnalyzeOutput,
  marketing_insights: {
    keywords: string[],
    value_proposition: string,
    brand_tone: string,
    category: string
  },
  ad_creatives: AdCreative[],
  audience_targeting: AudienceBuilderOutput,
  campaign_strategy: CampaignBuilderOutput
}
```

This structure is saved to the database and displayed in the campaign detail page.

---

## Extending the Tools

### Adding New Platforms

Edit `mcp-servers/adyn-marketing/src/tools/generate-ads.ts`:

```typescript
case 'linkedin':
  ad = {
    platform: 'LinkedIn',
    headline: 'Professional headline...',
    primary_text: 'B2B focused text...',
    cta: 'Learn More',
    creative_description: 'Professional imagery...',
    hashtags: []
  };
  break;
```

### Enhancing Semantic Analysis

Integrate OpenAI API in `semantic-analyze.ts`:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: `Analyze this for marketing: ${text}` }]
});
```

### Adding New Tool

1. Create tool file in `mcp-servers/adyn-marketing/src/tools/`
2. Define input/output interfaces
3. Implement tool function
4. Register in `src/index.ts`:

```typescript
{
  name: 'new_tool',
  description: 'Tool description',
  inputSchema: { ... }
}
```

5. Add case in CallToolRequestSchema handler
6. Rebuild: `npm run build`

---

## Testing Tools Individually

You can test MCP tools directly using the MCP SDK:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./mcp-servers/adyn-marketing/dist/index.js']
});

const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const result = await client.callTool({
  name: 'fetch_url',
  arguments: { url: 'https://example.com' }
});

console.log(result);
```

---

## Performance Considerations

- **fetch_url**: 10s timeout, may fail on slow sites
- **extract_content**: Fast, limited to 50 text blocks
- **semantic_analyze**: Fast, rule-based (no API calls)
- **generate_ads**: Fast, template-based
- **audience_builder**: Fast, rule-based
- **campaign_builder**: Fast, calculation-based

**Total typical execution**: 10-30 seconds (mostly fetch_url)

---

## Error Handling

All tools return structured errors:

```json
{
  "error": "Error message",
  "details": { ... }
}
```

Common errors:
- `FETCH_FAILED`: Network issues, 404, timeout
- `PARSE_ERROR`: Invalid HTML structure
- `ANALYSIS_ERROR`: Content analysis failure
- `VALIDATION_ERROR`: Invalid input parameters
