# Meta Marketing API - Insights Fields Reference

**Source**: [Meta for Developers - Marketing API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights/)  
**API Version**: v24.0  
**Last Updated**: January 2026

This document provides a comprehensive reference of all available fields in the Meta Marketing API Insights endpoint.

## ⚠️ Recent Fixes (January 2026)

### Invalid Fields Removed from Codebase

The following fields were causing API validation errors and have been removed:

1. **`targeting`** - ❌ NOT valid for insights endpoint
   - Fixed in `lib/meta-api.ts`:
     - `getHistoricalCampaignInsights()` method (line 974)
     - `getTopPerformingAds()` method (line 1014)
   - ✅ Note: `targeting` IS valid for adset endpoints, just not insights

2. **`approximate_count`** - ❌ Deprecated for custom audiences
   - Replaced with: `approximate_count_lower_bound` and `approximate_count_upper_bound`
   - Fixed in `lib/meta-api.ts`:
     - `getCustomAudiences()` method (line 1410)
     - `getCustomAudienceDetails()` method (line 905)
     - `getLookalikeAudienceSource()` method (line 951)

### Testing
After these fixes, the enhanced sync should work without field validation errors. Test with:
```bash
npm run test:enhanced-sync
```

---

## Core Identification Fields

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | numeric string | The ID number of your ad account |
| `account_name` | string | The name of your ad account |
| `account_currency` | string | Currency used by your ad account |
| `ad_id` | numeric string | The unique ID of the ad |
| `ad_name` | string | The name of the ad |
| `adset_id` | numeric string | The unique ID of the ad set |
| `adset_name` | string | The name of the ad set |
| `campaign_id` | numeric string | The unique ID of the campaign |
| `campaign_name` | string | The name of the campaign |

## Date & Time Fields

| Field | Type | Description |
|-------|------|-------------|
| `date_start` | string | Start date for your data |
| `date_stop` | string | End date for your data |
| `created_time` | string | When the entity was created |
| `updated_time` | string | When the entity was last updated |

## Core Performance Metrics

| Field | Type | Description |
|-------|------|-------------|
| `impressions` | numeric string | Number of times ads were on screen |
| `clicks` | numeric string | Number of clicks on your ads |
| `spend` | numeric string | Total amount spent on campaign/ad set/ad |
| `reach` | numeric string | Number of unique accounts that saw your ads (estimated) |
| `frequency` | numeric string | Average number of times each person saw your ad (estimated) |

## Cost Metrics

| Field | Type | Description |
|-------|------|-------------|
| `cpc` | numeric string | Average cost for each click (all) |
| `cpm` | numeric string | Average cost for 1,000 impressions |
| `cpp` | numeric string | Average cost to reach 1,000 accounts (estimated) |
| `ctr` | numeric string | Percentage of times accounts saw ad and clicked |
| `cost_per_inline_link_click` | numeric string | Average cost of each inline link click |
| `cost_per_inline_post_engagement` | numeric string | Average cost of each inline post engagement |
| `cost_per_unique_click` | numeric string | Average cost for each unique click (estimated) |
| `cost_per_unique_inline_link_click` | numeric string | Average cost of each unique inline link click (estimated) |

## Engagement Metrics

| Field | Type | Description |
|-------|------|-------------|
| `inline_link_clicks` | numeric string | Clicks on links to destinations on/off Facebook (1-day click window) |
| `inline_link_click_ctr` | numeric string | Percentage of times accounts performed inline link click |
| `inline_post_engagement` | numeric string | Total actions accounts take involving your ads (1-day click window) |
| `outbound_clicks` | array | Clicks on links taking accounts off Facebook properties |
| `outbound_clicks_ctr` | array | Percentage of times accounts performed outbound click |

## Conversion Metrics

| Field | Type | Description |
|-------|------|-------------|
| `actions` | array | Total number of actions attributed to your ads |
| `action_values` | array | Total value of all conversions attributed to your ads |
| `conversions` | array | Conversion actions attributed to your ads |
| `conversion_values` | array | Value of conversions attributed to your ads |
| `cost_per_action_type` | array | Average cost of a relevant action |
| `cost_per_conversion` | array | Average cost per conversion |
| `cost_per_unique_action_type` | array | Average cost of each unique action (estimated) |
| `cost_per_unique_conversion` | array | Average cost per unique conversion |

## ROAS (Return on Ad Spend) Metrics

| Field | Type | Description |
|-------|------|-------------|
| `purchase_roas` | array | Total ROAS from purchases (from Business Tools) |
| `website_purchase_roas` | array | Total ROAS from website purchases (Facebook pixel) |
| `mobile_app_purchase_roas` | array | Total ROAS from mobile app purchases |
| `catalog_segment_value_mobile_purchase_roas` | array | ROAS from mobile app purchases for catalog segment |
| `catalog_segment_value_website_purchase_roas` | array | ROAS from website purchases for catalog segment |
| `catalog_segment_value_omni_purchase_roas` | array | ROAS from all purchases for catalog segment |

## Video Metrics

| Field | Type | Description |
|-------|------|-------------|
| `video_play_actions` | array | Number of times video starts to play (in development) |
| `video_30_sec_watched_actions` | array | Times video played for at least 30 seconds |
| `video_p25_watched_actions` | array | Times video played at 25% of length |
| `video_p50_watched_actions` | array | Times video played at 50% of length |
| `video_p75_watched_actions` | array | Times video played at 75% of length |
| `video_p95_watched_actions` | array | Times video played at 95% of length |
| `video_p100_watched_actions` | array | Times video played at 100% of length |
| `video_avg_time_watched_actions` | array | Average time video was played |
| `video_time_watched_actions` | array | Total time video was watched |
| `video_continuous_2_sec_watched_actions` | array | 2-second continuous video views |
| `video_play_curve_actions` | list<AdsHistogramStats> | Video play curve graph by second |
| `video_play_retention_0_to_15s_actions` | list<AdsHistogramStats> | Video retention 0-15 seconds |
| `video_play_retention_20_to_60s_actions` | list<AdsHistogramStats> | Video retention 20-60 seconds |
| `video_play_retention_graph_actions` | list<AdsHistogramStats> | Video retention graph |
| `cost_per_15_sec_video_view` | array | Average cost per 15-second video view |
| `cost_per_2_sec_continuous_video_view` | array | Average cost per 2-second continuous view |
| `cost_per_thruplay` | array | Average cost for each ThruPlay (in development) |

## Instant Experience (Canvas) Metrics

| Field | Type | Description |
|-------|------|-------------|
| `canvas_avg_view_percent` | numeric string | Average percentage of Instant Experience viewed |
| `canvas_avg_view_time` | numeric string | Average time (seconds) spent viewing Instant Experience |
| `instant_experience_clicks_to_open` | numeric string | Clicks to open Instant Experience |
| `instant_experience_clicks_to_start` | numeric string | Clicks to start Instant Experience |
| `instant_experience_outbound_clicks` | array | Outbound clicks from Instant Experience |

## Objective & Results Metrics

| Field | Type | Description |
|-------|------|-------------|
| `objective` | string | Goal you want to achieve with advertising |
| `optimization_goal` | string | Optimization goal selected for ad/ad set |
| `results` | list<AdsInsightsResult> | Times ad achieved outcome based on objective |
| `objective_results` | list<AdsInsightsResult> | Responses wanted from campaign based on objective |
| `result_rate` | list<AdsInsightsResult> | Percentage of results out of all ad views |
| `objective_result_rate` | list<AdsInsightsResult> | Objective results divided by impressions |
| `cost_per_result` | list<AdsInsightsResult> | Average cost per result |
| `cost_per_objective_result` | list<AdsInsightsResult> | Average cost per objective result |

## Product Catalog Metrics

| Field | Type | Description |
|-------|------|-------------|
| `catalog_segment_actions` | array | Actions attributed to catalog segment ads |
| `catalog_segment_value` | array | Value of conversions from catalog segment |
| `converted_product_quantity` | numeric | Number of products purchased (with product ID breakdown) |
| `converted_product_value` | numeric | Value of purchases (with product ID breakdown) |
| `product_views` | string | Product views |

## Attribution & Settings

| Field | Type | Description |
|-------|------|-------------|
| `attribution_setting` | string | Default attribution window for calculations |
| `buying_type` | string | Method of payment and targeting (auction/fixed/reach & frequency) |
| `anchor_event_attribution_setting` | string | Anchor event attribution setting |
| `multi_event_conversion_attribution_setting` | string | Multi-event conversion attribution |

## Auction Metrics

| Field | Type | Description |
|-------|------|-------------|
| `auction_bid` | numeric string | Auction bid amount |
| `auction_competitiveness` | numeric string | Auction competitiveness score |
| `auction_max_competitor_bid` | numeric string | Maximum competitor bid in auction |
| `wish_bid` | numeric string | Wish bid amount |

## Full View Metrics

| Field | Type | Description |
|-------|------|-------------|
| `full_view_impressions` | numeric string | Number of Full Views on Page posts |
| `full_view_reach` | numeric string | Accounts that performed Full View on Page post |

## Social Metrics

| Field | Type | Description |
|-------|------|-------------|
| `social_spend` | numeric string | Amount spent on ads with social information |

## Interactive Component Metrics

| Field | Type | Description |
|-------|------|-------------|
| `interactive_component_tap` | array | Taps on interactive components |

## Landing Page Metrics

| Field | Type | Description |
|-------|------|-------------|
| `landing_page_view_per_link_click` | numeric string | Landing page views per link click |
| `purchase_per_landing_page_view` | numeric string | Purchases per landing page view |

## Marketing Messages Metrics

| Field | Type | Description |
|-------|------|-------------|
| `marketing_messages_delivered` | numeric string | Messages delivered to customers |
| `marketing_messages_delivery_rate` | numeric string | Messages delivered / messages sent |
| `marketing_messages_read_rate_benchmark` | string | 75th percentile of read rates across similar businesses |

## Instagram Metrics

| Field | Type | Description |
|-------|------|-------------|
| `instagram_upcoming_event_reminders_set` | numeric string | Instagram event reminders set |

## Shops Metrics

| Field | Type | Description |
|-------|------|-------------|
| `shops_assisted_purchases` | string | Purchases assisted by shops |

## Qualifying Questions

| Field | Type | Description |
|-------|------|-------------|
| `qualifying_question_qualify_answer_rate` | numeric string | Rate of qualifying answers |

## DDA (Data-Driven Attribution) Metrics

| Field | Type | Description |
|-------|------|-------------|
| `dda_countby_convs` | numeric string | DDA conversion count |
| `cost_per_dda_countby_convs` | numeric string | Cost per DDA conversion |
| `dda_results` | list<AdsInsightsDdaResult> | DDA results |

## Comparison Node

| Field | Type | Description |
|-------|------|-------------|
| `comparison_node` | AdsInsightsComparison | Fields to compare (current vs comparison time range) |

## Asset Fields

| Field | Type | Description |
|-------|------|-------------|
| `body_asset` | AdAssetBody | Body asset information |
| `description_asset` | AdAssetDescription | Description asset |
| `image_asset` | AdAssetImage | Image asset |
| `media_asset` | AdAssetMedia | Media asset |
| `title_asset` | AdAssetTitle | Title asset |
| `video_asset` | AdAssetVideo | Video asset |
| `rule_asset` | AdAssetRule | Rule asset |
| `creative_automation_asset_id` | AdAssetMedia | Creative automation asset ID |

## Breakdown Dimensions

These fields are used with the `breakdowns` parameter:

| Breakdown | Description |
|-----------|-------------|
| `age` | Age range |
| `gender` | Gender |
| `country` | Country |
| `region` | Region |
| `dma` | Designated Market Area |
| `publisher_platform` | Publisher platform (Facebook, Instagram, Audience Network, Messenger) |
| `platform_position` | Position on platform (feed, stories, etc.) |
| `device_platform` | Device platform (mobile, desktop, etc.) |
| `impression_device` | Device used for impression |
| `product_id` | Product ID (for catalog ads) |
| `coarse_conversion_value` | Coarse conversion value (low/medium/high) |
| `fidelity_type` | SKAdNetwork fidelity type |
| `postback_sequence_index` | SKAdNetwork postback sequence (0/1/2) |
| `hsid` | SKAdNetwork source identifier |
| `redownload` | App reinstall flag |
| `skan_version` | SKAdNetwork version |

## Product Breakdown Fields

| Field | Type | Description |
|-------|------|-------------|
| `product_brand_breakdown` | string | Product brand |
| `product_category_breakdown` | string | Product category |
| `product_custom_label_0_breakdown` | string | Custom label 0 |
| `product_custom_label_1_breakdown` | string | Custom label 1 |
| `product_custom_label_2_breakdown` | string | Custom label 2 |
| `product_custom_label_3_breakdown` | string | Custom label 3 |
| `product_custom_label_4_breakdown` | string | Custom label 4 |
| `product_group_content_id_breakdown` | string | Product group content ID |
| `product_group_retailer_id` | string | Product group retailer ID |
| `product_retailer_id` | string | Product retailer ID |
| `product_set_id_breakdown` | string | Product set ID |
| `product_vendor_id_breakdown` | string | Product vendor ID |

## Creative & Format Fields

| Field | Type | Description |
|-------|------|-------------|
| `ad_format_asset` | string | Ad format asset |
| `creative_relaxation_asset_type` | string | Creative relaxation asset type |
| `flexible_format_asset_type` | string | Flexible format asset type |
| `gen_ai_asset_type` | string | Generative AI asset type |

## Rule & Automation Fields

| Field | Type | Description |
|-------|------|-------------|
| `rule_set_id` | string | Rule set ID |
| `rule_set_name` | string | Rule set name |
| `is_auto_advance` | string | Auto-advance flag |

## Trending & Topics

| Field | Type | Description |
|-------|------|-------------|
| `reels_trending_topic` | string | Reels trending topic |
| `rta_ugc_topic` | string | RTA UGC topic |

## Performance Indicators

| Field | Type | Description |
|-------|------|-------------|
| `result_values_performance_indicator` | string | Result values performance indicator |
| `anchor_events_performance_indicator` | string | Anchor events performance indicator |

## Hourly Stats

| Field | Type | Description |
|-------|------|-------------|
| `hourly_stats_aggregated_by_advertiser_time_zone` | string | Hourly stats by advertiser timezone |
| `hourly_stats_aggregated_by_audience_time_zone` | string | Hourly stats by audience timezone |

## User Segment

| Field | Type | Description |
|-------|------|-------------|
| `user_segment_key` | string | User segment key |
| `activity_recency` | string | Activity recency |

## Other Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_card_view` | string | Total card views |
| `ad_click_actions` | array | Ad click actions |
| `ad_impression_actions` | array | Ad impression actions |

## Important Notes

### Estimated Metrics
The following metrics are **estimated**:
- `reach`
- `frequency`
- `cpp`
- `cost_per_unique_click`
- `cost_per_unique_inline_link_click`
- `cost_per_unique_outbound_click`
- `cost_per_unique_action_type`

### In Development Metrics
The following metrics are **in development**:
- `video_play_actions`
- `cost_per_thruplay`

### Array/List Fields
Many fields return arrays or lists with action types. Common action types include:
- `offsite_conversion`
- `link_click`
- `post_engagement`
- `page_engagement`
- `post_reaction`
- `comment`
- `onsite_conversion.post_save`
- `video_view`
- `landing_page_view`
- And many more...

### Attribution Windows
Default attribution windows can be:
- 1-day click
- 7-day click
- 28-day click
- 1-day view
- 7-day view

## Best Practices

1. **Request Only Needed Fields**: Don't request all fields - only what you need
2. **Use Breakdowns Wisely**: Breakdowns increase data volume significantly
3. **Batch Requests**: Use async reporting for large date ranges
4. **Handle Estimated Metrics**: Account for estimation in your calculations
5. **Check Field Availability**: Some fields may not be available for all ad types
6. **Use Proper Attribution**: Understand attribution windows for accurate reporting

## Common Field Combinations

### Basic Performance
```
impressions,clicks,spend,reach,frequency,cpm,cpc,ctr
```

### Conversion Tracking
```
impressions,clicks,spend,actions,action_values,conversions,conversion_values,cost_per_action_type,cost_per_conversion
```

### ROAS Analysis
```
spend,purchase_roas,website_purchase_roas,mobile_app_purchase_roas,conversion_values
```

### Video Performance
```
impressions,spend,video_play_actions,video_30_sec_watched_actions,video_p50_watched_actions,video_p100_watched_actions,cost_per_thruplay
```

### Engagement Analysis
```
impressions,reach,inline_link_clicks,inline_post_engagement,outbound_clicks,cost_per_inline_link_click
```

---

**Content was rephrased for compliance with licensing restrictions**

For the most up-to-date information, always refer to the official Meta Marketing API documentation at:
https://developers.facebook.com/docs/marketing-api/reference/
