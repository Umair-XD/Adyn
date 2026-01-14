
import { generateObject } from 'ai';
import { z } from 'zod';
import { fetchUrl } from './fetch-url';
import { extractContent } from './extract-content';
import { semanticAnalyze } from './semantic-analyze';
import { strategyEngine } from './strategy-engine';
import { audienceConstructor } from './audience-constructor';
import { placementIntelligence } from './placement-intelligence';
import { creativeStrategy } from './creative-strategy';
import { budgetOptimizer } from './budget-optimizer';
import { campaignOrchestrator } from './campaign-orchestrator';
import { accountAudit } from './account-audit';

export interface CampaignBuilderInput {
    product_url: string;
    campaign_purpose: 'conversion' | 'engagement' | 'traffic' | 'awareness';
    budget: number;
    geo_targets: string[];
    ad_account_id?: string;
    raw_meta_account_data?: any;
}

export async function campaignBuilder(input: CampaignBuilderInput) {
    console.log('🚀 Starting Campaign Builder...');

    // Initialize progressive results object
    const progressiveResults = {
        status: 'in_progress',
        current_step: 'fetching',
        steps: {} as Record<string, any>,
        final_payload: null as any,
        summary: {} as any,
        errors: [] as string[],
        warnings: [] as string[]
    };

    try {
        // 1. Fetch & Extract
        console.log('Step 1: Fetching and extracting content...');
        progressiveResults.current_step = 'fetching';
        const fetchResult = await fetchUrl({ url: input.product_url });
        const content = await extractContent({ html: fetchResult.html });

        progressiveResults.steps.content_extraction = {
            status: 'completed',
            title: content.title,
            description: content.metadata.description,
            images_found: content.images.length,
            features_found: content.structured_content.product_info.features.length,
            benefits_found: content.structured_content.product_info.benefits.length,
            price: content.structured_content.product_info.price,
            duration_ms: 0 // Can track if needed
        };

        // Prepare text for analysis (limit length to avoid token limits)
        const analysisText = [
            `Title: ${content.title}`,
            `Description: ${content.metadata.description}`,
            ...content.text_blocks.slice(0, 10),
            ...content.structured_content.headings.slice(0, 5),
            ...content.structured_content.product_info.features.slice(0, 5),
            ...content.structured_content.product_info.benefits.slice(0, 5)
        ].join('\n').substring(0, 15000);

        // 2. Semantic Analysis
        console.log('Step 2: Semantic Analysis...');
        progressiveResults.current_step = 'analyzing';
        const analysis = await semanticAnalyze({ text: analysisText });

        progressiveResults.steps.semantic_analysis = {
            status: 'completed',
            summary: analysis.summary,
            category: analysis.category,
            brand_tone: analysis.brand_tone,
            value_proposition: analysis.value_proposition,
            target_audience: analysis.audience_persona,
            keywords: analysis.keywords?.slice(0, 10),
            target_segments: analysis.target_segments?.map(s => s.segment),
            main_competitors: analysis.competitor_analysis?.main_competitors,
            usage_tokens: analysis.usage
        };

        // 3. Account Intelligence (AI-driven only)
        console.log('Step 3: Account Intelligence (AI-driven)...');
        progressiveResults.current_step = 'account_audit';

        // Skip raw account data, use purely AI intelligence for cold start/market trends
        const auditResult = {
            data_level: 'ZERO_DATA', // Default to clean slate for AI-driven trends
            account_summary: {
                last_90_days: { total_spend: 0, total_conversions: 0, avg_cpa: 0, avg_roas: 0 },
                audience_sizes: { custom: 0, lookalike: 0 }
            },
            pixel_health: 'UNKNOWN',
            risks: ['AI-driven strategy based on market trends and product analysis']
        };

        progressiveResults.steps.account_audit = {
            status: 'completed',
            data_level: auditResult.data_level,
            pixel_health: auditResult.pixel_health,
            risks: auditResult.risks
        };

        // Prepare Base Creative Assets (Cap at 5 for the whole campaign)
        const baseAssets = content.images.slice(0, 5).map(img => ({
            type: 'image' as const,
            asset_url: img,
            primary_texts: [analysis.value_proposition],
            headlines: [content.title],
            cta: 'LEARN_MORE',
            landing_page_url: input.product_url
        }));

        // If no images found, create a placeholder text asset
        if (baseAssets.length === 0) {
            baseAssets.push({
                type: 'image',
                asset_url: 'https://placehold.co/1080x1080?text=Product+Image',
                primary_texts: [analysis.value_proposition],
                headlines: [content.title],
                cta: 'LEARN_MORE',
                landing_page_url: input.product_url
            });
        }

        // 4. Strategy Engine
        console.log('Step 4: Strategic Planning...');
        progressiveResults.current_step = 'strategy';
        const businessGoalMap: Record<string, any> = {
            'conversion': 'PURCHASE',
            'traffic': 'TRAFFIC',
            'awareness': 'AWARENESS',
            'engagement': 'ENGAGEMENT'
        };

        const strategy = await strategyEngine({
            audit_result: auditResult as any,
            business_goal: businessGoalMap[input.campaign_purpose] || 'TRAFFIC',
            campaign_input: {
                campaign_name: `${analysis.category} - ${input.campaign_purpose.toUpperCase()} - ${new Date().toISOString().split('T')[0]}`,
                budget_total: input.budget,
                creative_assets: baseAssets,
                desired_geos: input.geo_targets
            }
        });

        // ENFORCE 5 CREATIVE LIMIT in strategy before proceeding
        let currentTotalPlanned = strategy.adset_strategies.reduce((acc, s) => acc + s.creative_count, 0);
        if (currentTotalPlanned > 5) {
            console.log(`⚠️ Scaling down creative count from ${currentTotalPlanned} to 5...`);
            // Simple logic: allocate 1 per adset, then distribute remaining to top adsets
            strategy.adset_strategies.forEach(s => s.creative_count = 1);
            let remaining = 5 - strategy.adset_strategies.length;
            for (let i = 0; i < remaining; i++) {
                strategy.adset_strategies[i % strategy.adset_strategies.length].creative_count += 1;
            }
        }

        progressiveResults.steps.strategy = {
            status: 'completed',
            approach: strategy.approach,
            campaign_objective: strategy.campaign_objective,
            campaign_name: strategy.adset_strategies[0]?.name,
            adsets_planned: strategy.adset_strategies.length,
            adset_types: strategy.adset_strategies.map(s => s.type),
            budget_allocation: strategy.budget_allocation,
            ai_reasoning: strategy.ai_reasoning,
            usage_tokens: strategy.usage
        };

        // 5. Audience Constructor
        console.log('Step 5: Building Audiences...');
        progressiveResults.current_step = 'audiences';
        const audienceReqs = strategy.adset_strategies.map(s => ({
            type: s.type,
            name: s.name,
            parameters: s.audience_parameters
        }));

        const { audiences } = await audienceConstructor({
            strategy: strategy,
            audience_requirements: audienceReqs as any,
            desired_geos: input.geo_targets
        });

        progressiveResults.steps.audiences = {
            status: 'completed',
            audiences_created: audiences.length,
            audience_details: audiences.map(a => ({
                name: a.name,
                type: a.type,
                estimated_reach: a.estimated_reach,
                validation_status: a.validation_status,
                warnings: a.validation_messages.length > 0 ? a.validation_messages : undefined
            }))
        };

        // Collect all warnings
        audiences.forEach(a => {
            if (a.validation_messages.length > 0) {
                progressiveResults.warnings.push(...a.validation_messages);
            }
        });

        // 6. Placement Intelligence
        console.log('Step 6: Optimizing Placements...');
        progressiveResults.current_step = 'placements';
        const adsetsForPlacement = audiences.map(a => ({
            adset_id: a.adset_id,
            name: a.name,
            type: a.type,
            targeting: a.targeting,
            audience_size_estimate: a.estimated_reach
        }));

        const { placement_strategies } = await placementIntelligence({
            adsets: adsetsForPlacement,
            creative_assets: baseAssets
        });

        progressiveResults.steps.placements = {
            status: 'completed',
            placements_optimized: placement_strategies.length,
            placement_summary: placement_strategies.map(p => ({
                adset: p.name,
                platforms: (p.placements.facebook_positions.length > 0 ? 'Facebook' : '') +
                    (p.placements.instagram_positions.length > 0 ? ' Instagram' : ''),
                total_positions: p.placements.facebook_positions.length + p.placements.instagram_positions.length,
                warnings: p.warnings
            }))
        };

        // 7. Creative Strategy
        console.log('Step 7: Generating Creatives (Enforcing 5 Variant Limit)...');
        progressiveResults.current_step = 'creatives';
        const adsetsForCreative = adsetsForPlacement.map(adset => {
            const placement = placement_strategies.find(p => p.adset_id === adset.adset_id);
            const strat = strategy.adset_strategies.find(s => s.name === adset.name);
            return {
                ...adset,
                creative_count: strat?.creative_count || 1, // Use our re-capped count
                placements: placement?.placements || { facebook_positions: ['feed'], instagram_positions: ['stream'], audience_network_positions: [], messenger_positions: [] }
            };
        });

        const { creative_strategies } = await creativeStrategy({
            adsets: adsetsForCreative,
            creative_assets: baseAssets,
            brand_guidelines: {
                tone: 'professional',
                voice: analysis.brand_tone,
                key_messages: [analysis.value_proposition, analysis.unique_selling_point],
                avoid_words: ['cheap', 'spam'],
            }
        });

        const totalCreatives = creative_strategies.reduce((acc, c) => acc + c.creative_variants.length, 0);
        progressiveResults.steps.creatives = {
            status: 'completed',
            total_creatives: totalCreatives,
            creative_breakdown: creative_strategies.map(cs => ({
                adset: cs.adset_id,
                variants: cs.creative_variants.length,
                angles: cs.creative_variants.map(v => v.angle),
                sample_headline: cs.creative_variants[0]?.payload.object_story_spec.link_data.name,
                sample_primary_text: cs.creative_variants[0]?.payload.object_story_spec.link_data.message.substring(0, 100) + '...'
            })),
            usage_summary: creative_strategies.map(cs => cs.usage).filter(Boolean)
        };

        // 8. Budget Optimization
        console.log('Step 8: Finalizing Budget...');
        progressiveResults.current_step = 'budget';
        const adsetsForBudget = adsetsForCreative.map(adset => {
            const creative = creative_strategies.find(c => c.adset_id === adset.adset_id);
            return {
                ...adset,
                creative_count: creative?.creative_variants.length || 0,
                expected_performance: {
                    ctr_range: { min: 1.0, max: 2.0 },
                    cpm_range: { min: 10, max: 20 }
                }
            };
        });

        const { budget_optimizations } = await budgetOptimizer({
            strategy: { approach: strategy.approach },
            adsets: adsetsForBudget,
            total_budget: input.budget
        });

        progressiveResults.steps.budget = {
            status: 'completed',
            total_budget: input.budget,
            budget_allocations: budget_optimizations.map(b => ({
                adset: b.name,
                daily_budget: b.budget_strategy.daily_budget,
                bid_strategy: b.bidding_strategy.bid_strategy,
                optimization_goal: b.bidding_strategy.optimization_goal
            }))
        };

        // 9. Final Assembly (Orchestration)
        console.log('Step 9: Assembling Campaign Payload...');
        progressiveResults.current_step = 'assembly';

        const campaignStructure = {
            audit: auditResult,
            strategy: strategy,
            audiences: audiences,
            placements: placement_strategies,
            creatives: creative_strategies,
            budgets: budget_optimizations
        };

        const finalPayload = await campaignOrchestrator({
            campaign_structure: campaignStructure,
            account_id: input.ad_account_id || 'act_PLACEHOLDER'
        });

        progressiveResults.steps.assembly = {
            status: 'completed',
            campaign_name: finalPayload.campaign_payload.payload.name,
            objective: finalPayload.campaign_payload.payload.objective,
            ad_sets: finalPayload.adset_payloads.length,
            creatives: finalPayload.creative_payloads.length,
            ads: finalPayload.ad_payloads.length,
            validation_checks: finalPayload.validation_checklist,
            risk_flags: finalPayload.risk_flags
        };

        // Mark as completed
        progressiveResults.status = 'completed';
        progressiveResults.current_step = 'done';
        progressiveResults.final_payload = finalPayload;

        // Build summary
        progressiveResults.summary = {
            product: analysis.summary,
            strategy: strategy.approach,
            campaign_name: strategy.campaign_objective,
            total_budget: input.budget,
            adsets_created: audiences.length,
            creatives_generated: totalCreatives,
            total_ads: finalPayload.ad_payloads.length
        };

        console.log('✅ Campaign Builder Complete!');

        // Return progressive results with intelligent_campaign_data for compatibility
        return {
            ...progressiveResults,
            intelligent_campaign_data: finalPayload, // For backward compatibility
            ...finalPayload // Also include top-level payload fields
        };

    } catch (error) {
        // Handle errors gracefully
        progressiveResults.status = 'failed';
        progressiveResults.errors.push(error instanceof Error ? error.message : 'Unknown error');

        console.error('❌ Campaign Builder Failed:', error);

        return {
            ...progressiveResults,
            error: error instanceof Error ? error.message : 'Campaign generation failed'
        };
    }
}
