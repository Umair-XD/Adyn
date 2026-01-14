/**
 * STEP 4 — PLACEMENT INTELLIGENCE (MCP)
 * 
 * Determines optimal placements per Ad Set based on creative formats
 * Placements are NOT global - they are PER Ad Set
 */

export interface CreativeAsset {
  type: 'image' | 'video' | 'carousel';
  asset_url: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for videos
  format_variants?: Array<{
    aspect_ratio: string;
    dimensions: { width: number; height: number };
  }>;
}

export interface AdSetWithAudience {
  adset_id: string;
  name: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targeting: any;
  audience_size_estimate: { min: number; max: number };
}

export interface PlacementResult {
  adset_id: string;
  name: string;
  placements: {
    facebook_positions: string[];
    instagram_positions: string[];
    audience_network_positions: string[];
    messenger_positions: string[];
  };
  placement_rationale: string[];
  creative_requirements: Array<{
    placement: string;
    required_formats: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recommended_specs: any;
  }>;
  performance_expectations: {
    [placement: string]: {
      expected_ctr_range: { min: number; max: number };
      expected_cpm_range: { min: number; max: number };
      volume_potential: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  };
  warnings: string[];
}

export async function placementIntelligence(input: {
  adsets: AdSetWithAudience[];
  creative_assets: CreativeAsset[];
}): Promise<{ placement_strategies: PlacementResult[] }> {

  const { adsets, creative_assets } = input;
  const placementStrategies: PlacementResult[] = [];

  // Analyze available creative formats
  const formatAnalysis = analyzeCreativeFormats(creative_assets);

  for (const adset of adsets) {
    const placementStrategy = await determinePlacementsForAdSet(adset, formatAnalysis);
    placementStrategies.push(placementStrategy);
  }

  return { placement_strategies: placementStrategies };
}

interface FormatAnalysis {
  has_square_image: boolean;
  has_landscape_image: boolean;
  has_portrait_image: boolean;
  has_square_video: boolean;
  has_landscape_video: boolean;
  has_vertical_video: boolean;
  has_carousel: boolean;
  video_durations: number[];
  total_creative_count: number;
}

function analyzeCreativeFormats(assets: CreativeAsset[]): FormatAnalysis {
  const analysis: FormatAnalysis = {
    has_square_image: false,
    has_landscape_image: false,
    has_portrait_image: false,
    has_square_video: false,
    has_landscape_video: false,
    has_vertical_video: false,
    has_carousel: false,
    video_durations: [],
    total_creative_count: assets.length
  };

  for (const asset of assets) {
    if (asset.type === 'carousel') {
      analysis.has_carousel = true;
    } else if (asset.type === 'video') {
      if (asset.duration) {
        analysis.video_durations.push(asset.duration);
      }

      if (asset.dimensions) {
        const aspectRatio = asset.dimensions.width / asset.dimensions.height;
        if (aspectRatio === 1) {
          analysis.has_square_video = true;
        } else if (aspectRatio > 1) {
          analysis.has_landscape_video = true;
        } else {
          analysis.has_vertical_video = true;
        }
      } else {
        // Assume we have multiple formats if dimensions not specified
        analysis.has_square_video = true;
        analysis.has_vertical_video = true;
      }
    } else if (asset.type === 'image') {
      if (asset.dimensions) {
        const aspectRatio = asset.dimensions.width / asset.dimensions.height;
        if (aspectRatio === 1) {
          analysis.has_square_image = true;
        } else if (aspectRatio > 1) {
          analysis.has_landscape_image = true;
        } else {
          analysis.has_portrait_image = true;
        }
      } else {
        // Assume we have multiple formats if dimensions not specified
        analysis.has_square_image = true;
        analysis.has_landscape_image = true;
      }
    }
  }

  return analysis;
}

async function determinePlacementsForAdSet(
  adset: AdSetWithAudience,
  formatAnalysis: FormatAnalysis
): Promise<PlacementResult> {

  const result: PlacementResult = {
    adset_id: adset.adset_id,
    name: adset.name,
    placements: {
      facebook_positions: [],
      instagram_positions: [],
      audience_network_positions: [],
      messenger_positions: []
    },
    placement_rationale: [],
    creative_requirements: [],
    performance_expectations: {},
    warnings: []
  };

  // Determine placements based on creative availability and audience type

  // Facebook Feed - requires square or landscape images/videos
  if (formatAnalysis.has_square_image || formatAnalysis.has_landscape_image ||
    formatAnalysis.has_square_video || formatAnalysis.has_landscape_video) {
    result.placements.facebook_positions.push('feed');
    result.placement_rationale.push('Facebook Feed: High-quality images/videos available');
    result.performance_expectations['facebook_feed'] = {
      expected_ctr_range: { min: 1.2, max: 2.5 },
      expected_cpm_range: { min: 15, max: 35 },
      volume_potential: 'HIGH'
    };
  }

  // Instagram Feed - similar requirements to Facebook Feed
  if (formatAnalysis.has_square_image || formatAnalysis.has_square_video) {
    result.placements.instagram_positions.push('stream');
    result.placement_rationale.push('Instagram Feed: Square format creatives available');
    result.performance_expectations['instagram_feed'] = {
      expected_ctr_range: { min: 1.5, max: 3.0 },
      expected_cpm_range: { min: 20, max: 40 },
      volume_potential: 'HIGH'
    };
  }

  // Instagram Reels - requires vertical video
  if (formatAnalysis.has_vertical_video) {
    result.placements.instagram_positions.push('reels');
    result.placement_rationale.push('Instagram Reels: Vertical video content available');
    result.performance_expectations['instagram_reels'] = {
      expected_ctr_range: { min: 2.0, max: 4.0 },
      expected_cpm_range: { min: 25, max: 45 },
      volume_potential: 'MEDIUM'
    };

    // Add creative requirements
    result.creative_requirements.push({
      placement: 'instagram_reels',
      required_formats: ['vertical_video'],
      recommended_specs: {
        aspect_ratio: '9:16',
        duration: '15-30 seconds',
        resolution: '1080x1920'
      }
    });
  } else {
    result.warnings.push('Missing vertical video - cannot use Instagram Reels (high-performing placement)');
  }

  // Facebook/Instagram Stories - requires vertical format
  if (formatAnalysis.has_vertical_video || formatAnalysis.has_portrait_image) {
    result.placements.facebook_positions.push('story');
    result.placements.instagram_positions.push('story');
    result.placement_rationale.push('Stories: Vertical format creatives available');
    result.performance_expectations['stories'] = {
      expected_ctr_range: { min: 1.8, max: 3.5 },
      expected_cpm_range: { min: 20, max: 40 },
      volume_potential: 'MEDIUM'
    };
  }

  // Right Column (Facebook only) - works with most image formats
  if (formatAnalysis.has_square_image || formatAnalysis.has_landscape_image) {
    result.placements.facebook_positions.push('right_hand_column');
    result.placement_rationale.push('Right Column: Lower cost, good for retargeting');
    result.performance_expectations['right_column'] = {
      expected_ctr_range: { min: 0.8, max: 1.5 },
      expected_cpm_range: { min: 8, max: 20 },
      volume_potential: 'MEDIUM'
    };
  }

  // Audience Network - only if we have good creative coverage
  if (formatAnalysis.total_creative_count >= 3 &&
    (formatAnalysis.has_square_image || formatAnalysis.has_landscape_image)) {
    result.placements.audience_network_positions.push('native');
    result.placements.audience_network_positions.push('banner');
    result.placement_rationale.push('Audience Network: Sufficient creative variety for external placements');
    result.performance_expectations['audience_network'] = {
      expected_ctr_range: { min: 0.5, max: 1.2 },
      expected_cpm_range: { min: 5, max: 15 },
      volume_potential: 'HIGH'
    };
  }

  // Messenger - conservative approach, only for retargeting
  if (adset.type === 'retargeting' && formatAnalysis.has_square_image) {
    result.placements.messenger_positions.push('messenger_home');
    result.placement_rationale.push('Messenger: Retargeting audience with square images');
    result.performance_expectations['messenger'] = {
      expected_ctr_range: { min: 1.0, max: 2.0 },
      expected_cpm_range: { min: 15, max: 30 },
      volume_potential: 'LOW'
    };
  }

  // Audience-specific placement optimization
  optimizePlacementsForAudience(result, adset);

  // Validate placement selection
  validatePlacementSelection(result);

  return result;
}

function optimizePlacementsForAudience(
  result: PlacementResult,
  adset: AdSetWithAudience
): void {

  // Retargeting audiences - focus on high-intent placements
  if (adset.type === 'retargeting') {
    result.placement_rationale.push('Retargeting: Prioritizing high-intent placements (Feed, Stories)');

    // Remove lower-intent placements for retargeting
    result.placements.audience_network_positions = [];

    // Boost performance expectations for retargeting
    Object.keys(result.performance_expectations).forEach(placement => {
      const expectations = result.performance_expectations[placement];
      expectations.expected_ctr_range = {
        min: expectations.expected_ctr_range.min * 1.5,
        max: expectations.expected_ctr_range.max * 1.5
      };
    });
  }

  // Broad audiences - use all available placements for maximum reach
  if (adset.type === 'broad') {
    result.placement_rationale.push('Broad audience: Using all compatible placements for maximum reach');
  }

  // Lookalike audiences - balanced approach
  if (adset.type === 'lookalike') {
    result.placement_rationale.push('Lookalike: Balanced placement mix for optimal learning');
  }

  // Interest audiences - focus on engagement placements
  if (adset.type === 'interest') {
    result.placement_rationale.push('Interest targeting: Emphasizing engagement-focused placements');

    // Prioritize Stories and Reels for interest audiences
    if (result.placements.instagram_positions.includes('reels')) {
      result.performance_expectations['instagram_reels'].volume_potential = 'HIGH';
    }
  }

  // Small audiences - avoid audience network to prevent quick saturation
  if (adset.audience_size_estimate.max < 100000) {
    result.placements.audience_network_positions = [];
    result.placement_rationale.push('Small audience: Avoiding Audience Network to prevent saturation');
  }
}

function validatePlacementSelection(result: PlacementResult): void {
  const totalPlacements =
    result.placements.facebook_positions.length +
    result.placements.instagram_positions.length +
    result.placements.audience_network_positions.length +
    result.placements.messenger_positions.length;

  if (totalPlacements === 0) {
    result.warnings.push('CRITICAL: No placements selected - check creative format compatibility');
  }

  if (totalPlacements === 1) {
    result.warnings.push('Limited placement diversity - may restrict reach and learning');
  }

  // Check for Reels availability
  if (!result.placements.instagram_positions.includes('reels')) {
    result.warnings.push('Missing Instagram Reels - consider adding vertical video for better performance');
  }

  // Check for Stories availability
  if (!result.placements.facebook_positions.includes('story') &&
    !result.placements.instagram_positions.includes('story')) {
    result.warnings.push('Missing Stories placements - consider adding vertical format creatives');
  }

  // Validate creative requirements are met
  for (const requirement of result.creative_requirements) {
    if (requirement.placement === 'instagram_reels' &&
      !result.placements.instagram_positions.includes('reels')) {
      result.warnings.push('Creative requirements not met for selected placements');
    }
  }
}
