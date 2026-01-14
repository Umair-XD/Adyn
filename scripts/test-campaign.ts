import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';

// Load environment variables FIRST
dotenv.config({ path: '.env.local' });

const TEST_URL = 'https://halalveda.uk/products/halal-veda-oil';

let mdContent = `# Halal Veda Oil - Campaign Audit Results\n\n`;
mdContent += `**Test Date:** ${new Date().toISOString()}\n`;
mdContent += `**Product URL:** ${TEST_URL}\n\n`;
mdContent += `---\n\n`;

function log(section: string, content: string) {
  console.log(`\n${section}`);
  console.log(content);
  mdContent += `## ${section}\n\n${content}\n\n`;
}

function logJSON(title: string, data: any) {
  const json = JSON.stringify(data, null, 2);
  console.log(`\n${title}:`);
  console.log(json);
  mdContent += `### ${title}\n\n\`\`\`json\n${json}\n\`\`\`\n\n`;
}

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.DATABASE_URL!);
    log('Database', '✅ Connected to MongoDB');
  }
}

async function getMetaAccountData() {
  try {
    // Import models
    const { default: MetaAccount } = await import('../models/MetaAccount');
    const { default: User } = await import('../models/User');

    // Find first active user with Meta account
    const user = await User.findOne({}).select('_id email');
    if (!user) {
      log('Meta Account', '⚠️ No users found in database');
      return { userId: null, accountId: null, accountData: {} };
    }

    log('User Found', `User ID: ${user._id}\nEmail: ${user.email || 'N/A'}`);

    // Find Meta account for this user
    const metaAccount = await MetaAccount.findOne({
      userId: user._id,
      isActive: true
    });

    if (!metaAccount) {
      log('Meta Account', '⚠️ No active Meta account found for user');
      return { userId: user._id.toString(), accountId: null, accountData: {} };
    }

    log('Meta Account Found', `Account ID: ${metaAccount.accountId}\nAccount Name: ${metaAccount.accountName || 'N/A'}`);

    // Get cached Meta data
    const { getCachedMetaData } = await import('../lib/meta-data-sync');
    const result = await getCachedMetaData(user._id.toString(), metaAccount.accountId);

    if (result.data) {
      log('Cached Meta Data', `✅ Loaded cached data\nData size: ${JSON.stringify(result.data).length} bytes`);

      // Log detailed breakdown of what data we have
      const dataBreakdown = {
        insights: Array.isArray(result.data.insights) ? result.data.insights.length : 0,
        pixels: Array.isArray(result.data.pixels) ? result.data.pixels.length : 0,
        custom_audiences: Array.isArray(result.data.custom_audiences) ? result.data.custom_audiences.length : 0,
        campaigns: Array.isArray(result.data.campaigns) ? result.data.campaigns.length : 0,
        placement_insights: Array.isArray(result.data.placement_insights) ? result.data.placement_insights.length : 0,
        demographic_insights: Array.isArray(result.data.demographic_insights) ? result.data.demographic_insights.length : 0,
        ads: Array.isArray(result.data.ads) ? result.data.ads.length : 0,
        accountData: result.data.accountData ? 'Present' : 'Missing'
      };

      logJSON('Meta Data Breakdown', dataBreakdown);
      logJSON('Complete Raw Meta Account Data', result.data);
    } else {
      log('Cached Meta Data', '⚠️ No cached data available');
    }

    return {
      userId: user._id.toString(),
      accountId: metaAccount.accountId,
      accountData: result.data || {}
    };

  } catch (error: any) {
    log('Meta Account Error', `❌ Failed to fetch Meta account: ${error.message}`);
    return { userId: null, accountId: null, accountData: {} };
  }
}

async function runTest() {
  try {
    // Only connect if needed for other things, but here we can just log
    // await connectDB();

    // Using placeholders as requested to avoid long fetching/sending
    const userId = "test_user_id";
    const accountId = "act_TEST_ACCOUNT";
    const accountData = {};

    // Dynamic import after env is loaded
    const { campaignBuilder } = await import('../lib/campaign-tools/campaign-builder');

    log('Test Started', `Testing campaign generation for: ${TEST_URL}`);

    const input: any = {
      product_url: TEST_URL,
      campaign_purpose: 'conversion',
      budget: 500,
      duration_days: 30,
      geo_targets: ['PK'],
      ad_account_id: accountId
    };

    logJSON('Input Sent to Campaign Builder', input);

    // Log what we're sending to AI
    log('AI Input Summary', `
- Product URL: ${input.product_url}
- Campaign Purpose: ${input.campaign_purpose}
- Budget: $${input.budget}
- Geo Targets: ${input.geo_targets.join(', ')}
- Ad Account ID: ${input.ad_account_id}
- Meta Account Data: ${accountData && Object.keys(accountData).length > 0 ? 'PRESENT' : 'EMPTY'}
    `);

    log('Status', '⏳ Calling campaign builder...');
    const startTime = Date.now();

    const result = await campaignBuilder(input);

    const duration = Date.now() - startTime;
    log('Status', `✅ Campaign generation completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

    // Log the complete result
    logJSON('Complete Campaign Builder Output', result);

    // Log AI token usage if available
    if (result.steps) {
      const aiUsage = {
        semantic_analysis: result.steps.semantic_analysis?.usage_tokens || null,
        strategy: result.steps.strategy?.usage_tokens || null,
        creatives: result.steps.creatives?.usage_summary || null
      };

      logJSON('AI Token Usage Summary', aiUsage);
    }

    // Extract and log specific sections
    if (result.steps) {
      log('Generation Steps', `Total steps completed: ${Object.keys(result.steps).length}`);

      if (result.steps.semantic_analysis) {
        logJSON('Step 1: Semantic Analysis', result.steps.semantic_analysis);
      }

      if (result.steps.account_audit) {
        logJSON('Step 2: Account Audit', result.steps.account_audit);
      }

      if (result.steps.strategy) {
        logJSON('Step 3: Strategy Engine', result.steps.strategy);
      }

      if (result.steps.audiences) {
        logJSON('Step 4: Audience Construction', result.steps.audiences);
      }

      if (result.steps.placements) {
        logJSON('Step 5: Placement Intelligence', result.steps.placements);
      }

      if (result.steps.creatives) {
        logJSON('Step 6: Creative Strategy', result.steps.creatives);
      }

      if (result.steps.budget) {
        logJSON('Step 7: Budget Optimization', result.steps.budget);
      }

      if (result.steps.assembly) {
        logJSON('Step 8: Campaign Assembly', result.steps.assembly);
      }
    }

    // Log final payload
    if (result.final_payload || (result as any).intelligent_campaign_data) {
      const finalPayload = result.final_payload || (result as any).intelligent_campaign_data;

      log('Final Meta API Payloads', '📤 These are the exact payloads that will be sent to Meta API');

      logJSON('Campaign Payload (POST to Meta)', finalPayload.campaign_payload);

      log('Ad Sets Generated', `Total: ${finalPayload.adset_payloads?.length || 0}`);
      finalPayload.adset_payloads?.forEach((adset: any, idx: number) => {
        logJSON(`Ad Set ${idx + 1} Payload (POST to Meta)`, adset);
      });

      log('Creatives Generated', `Total: ${finalPayload.creative_payloads?.length || 0}`);
      finalPayload.creative_payloads?.forEach((creative: any, idx: number) => {
        logJSON(`Creative ${idx + 1} Payload (POST to Meta)`, creative);
      });

      log('Ads Generated', `Total: ${finalPayload.ad_payloads?.length || 0}`);
      if (finalPayload.ad_payloads && finalPayload.ad_payloads.length > 0) {
        finalPayload.ad_payloads?.forEach((ad: any, idx: number) => {
          logJSON(`Ad ${idx + 1} Payload (POST to Meta)`, ad);
        });
      } else {
        log('Note', 'Ads will be created by linking Ad Sets to Creatives during execution');
      }

      if (finalPayload.api_execution_order) {
        logJSON('API Execution Order', finalPayload.api_execution_order);
      }

      if (finalPayload.validation_checklist) {
        logJSON('Validation Checklist', finalPayload.validation_checklist);
      }

      if (finalPayload.risk_flags) {
        logJSON('Risk Flags', finalPayload.risk_flags);
      }
    }

    // Log summary
    log('Summary', `
- Status: ${result.status}
- Total Steps: ${Object.keys(result.steps || {}).length}
- Campaign Name: ${result.summary?.campaign_name || 'N/A'}
- Ad Sets: ${result.final_payload?.adset_payloads?.length || 0}
- Creatives: ${result.final_payload?.creative_payloads?.length || 0}
- Ads: ${result.final_payload?.ad_payloads?.length || 0}
- Warnings: ${result.warnings?.length || 0}
- Errors: ${result.errors?.length || 0}
    `);

    if (result.warnings?.length > 0) {
      log('Warnings', result.warnings.join('\n'));
    }

    if (result.errors?.length > 0) {
      log('Errors', result.errors.join('\n'));
    }

    // Save to file
    fs.writeFileSync('test-results.md', mdContent);
    console.log('\n✅ Test completed! Results saved to test-results.md');

    // Close database connection
    await mongoose.connection.close();

  } catch (error: any) {
    log('ERROR', `Test failed: ${error.message}`);
    log('Stack Trace', error.stack);
    fs.writeFileSync('test-results.md', mdContent);
    console.log('\n❌ Test failed! Partial results saved to test-results.md');

    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

runTest();
