// Test script for Adyn Marketing MCP Server
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

async function testMCPServer() {
  console.log('🚀 Testing Adyn Marketing MCP Server...\n');

  try {
    // Connect to MCP server
    const serverPath = path.join(__dirname, 'mcp-servers', 'adyn-marketing', 'dist', 'index.js');
    
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });

    const client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    console.log('📡 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // Test 1: List available tools
    console.log('📋 Listing available tools...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`);
    tools.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 2: Fetch URL
    console.log('🌐 Test 1: Fetching URL...');
    const fetchResult = await client.callTool({
      name: 'fetch_url',
      arguments: { url: 'https://example.com' }
    });
    const fetchData = JSON.parse(fetchResult.content[0].text);
    console.log(`✅ Fetched ${fetchData.html.length} characters of HTML\n`);

    // Test 3: Extract Content
    console.log('📄 Test 2: Extracting content...');
    const extractResult = await client.callTool({
      name: 'extract_content',
      arguments: { html: fetchData.html }
    });
    const extractData = JSON.parse(extractResult.content[0].text);
    console.log(`✅ Extracted:`);
    console.log(`   - Title: ${extractData.title}`);
    console.log(`   - Text blocks: ${extractData.text_blocks.length}`);
    console.log(`   - Images: ${extractData.images.length}\n`);

    // Test 4: Semantic Analysis
    console.log('🧠 Test 3: Semantic analysis...');
    const analyzeResult = await client.callTool({
      name: 'semantic_analyze',
      arguments: { text: extractData.text_blocks.join(' ') }
    });
    const analyzeData = JSON.parse(analyzeResult.content[0].text);
    console.log(`✅ Analysis:`);
    console.log(`   - Brand tone: ${analyzeData.brand_tone}`);
    console.log(`   - Category: ${analyzeData.category}`);
    console.log(`   - Keywords: ${analyzeData.keywords.slice(0, 5).join(', ')}...\n`);

    // Test 5: Generate Ads
    console.log('📢 Test 4: Generating ads...');
    const adsResult = await client.callTool({
      name: 'generate_ads',
      arguments: {
        summary: analyzeData.summary,
        brand_tone: analyzeData.brand_tone,
        persona: analyzeData.audience_persona,
        keywords: analyzeData.keywords,
        platforms: ['facebook', 'instagram', 'tiktok', 'google']
      }
    });
    const adsData = JSON.parse(adsResult.content[0].text);
    console.log(`✅ Generated ${adsData.ads.length} ads:`);
    adsData.ads.forEach(ad => {
      console.log(`   - ${ad.platform}: "${ad.headline}"`);
    });
    console.log('');

    // Test 6: Build Audience
    console.log('🎯 Test 5: Building audience...');
    const audienceResult = await client.callTool({
      name: 'audience_builder',
      arguments: {
        persona: analyzeData.audience_persona,
        keywords: analyzeData.keywords,
        category: analyzeData.category
      }
    });
    const audienceData = JSON.parse(audienceResult.content[0].text);
    console.log(`✅ Audience:`);
    console.log(`   - Age range: ${audienceData.age_range}`);
    console.log(`   - Interest groups: ${audienceData.interest_groups.length}`);
    console.log(`   - Geos: ${audienceData.geos.join(', ')}\n`);

    // Test 7: Build Campaign
    console.log('🎪 Test 6: Building campaign...');
    const campaignResult = await client.callTool({
      name: 'campaign_builder',
      arguments: {
        ads: adsData.ads,
        audience: audienceData,
        objective: 'Conversions'
      }
    });
    const campaignData = JSON.parse(campaignResult.content[0].text);
    console.log(`✅ Campaign:`);
    console.log(`   - Name: ${campaignData.campaign_name}`);
    console.log(`   - Budget: ${campaignData.budget_suggestion}`);
    console.log(`   - Duration: ${campaignData.duration_days} days`);
    console.log(`   - Platforms: ${campaignData.platform_mix.join(', ')}\n`);

    // Close connection
    await client.close();
    
    console.log('🎉 All tests passed! MCP server is working perfectly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testMCPServer();
