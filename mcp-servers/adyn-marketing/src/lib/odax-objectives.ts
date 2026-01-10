/**
 * ODAX (Outcome-Driven Ad Experiences) OBJECTIVE MAPPING
 * 
 * Meta requires ODAX objectives for all new campaigns as of v21.0 (Oct 2024)
 * This service maps legacy objectives to ODAX equivalents
 */

export interface ObjectiveMapping {
    legacy: string;
    odax: string;
    description: string;
    optimization_goals: string[];
}

/**
 * Official ODAX objective mappings from Meta Marketing API v21.0+
 */
export const ODAX_MAPPINGS: Record<string, ObjectiveMapping> = {
    'CONVERSIONS': {
        legacy: 'CONVERSIONS',
        odax: 'OUTCOME_SALES',
        description: 'Drive sales and conversions on your website or app',
        optimization_goals: ['OFFSITE_CONVERSIONS', 'CONVERSIONS']
    },
    'LINK_CLICKS': {
        legacy: 'LINK_CLICKS',
        odax: 'OUTCOME_TRAFFIC',
        description: 'Drive quality traffic to your website',
        optimization_goals: ['LINK_CLICKS', 'LANDING_PAGE_VIEWS']
    },
    'LEAD_GENERATION': {
        legacy: 'LEAD_GENERATION',
        odax: 'OUTCOME_LEADS',
        description: 'Collect leads through forms or instant experiences',
        optimization_goals: ['LEAD_GENERATION', 'QUALITY_LEAD']
    },
    'REACH': {
        legacy: 'REACH',
        odax: 'OUTCOME_AWARENESS',
        description: 'Maximize reach and brand awareness',
        optimization_goals: ['REACH', 'IMPRESSIONS']
    },
    'POST_ENGAGEMENT': {
        legacy: 'POST_ENGAGEMENT',
        odax: 'OUTCOME_ENGAGEMENT',
        description: 'Increase engagement with your content',
        optimization_goals: ['POST_ENGAGEMENT', 'LINK_CLICKS']
    },
    'APP_INSTALLS': {
        legacy: 'APP_INSTALLS',
        odax: 'OUTCOME_APP_PROMOTION',
        description: 'Drive app installs and engagement',
        optimization_goals: ['APP_INSTALLS', 'APP_EVENTS']
    },
    'BRAND_AWARENESS': {
        legacy: 'BRAND_AWARENESS',
        odax: 'OUTCOME_AWARENESS',
        description: 'Build awareness for your brand',
        optimization_goals: ['REACH', 'AD_RECALL_LIFT']
    }
};

/**
 * Converts legacy objective to ODAX objective
 * @param legacyObjective - Legacy campaign objective
 * @param useODAX - Whether to enforce ODAX (default true for v21.0+)
 * @returns ODAX objective or legacy if useODAX is false
 */
export function mapToODAX(legacyObjective: string, useODAX = true): string {
    if (!useODAX) {
        return legacyObjective;
    }

    // Check if already ODAX
    if (legacyObjective.startsWith('OUTCOME_')) {
        return legacyObjective;
    }

    // Map legacy to ODAX
    const mapping = ODAX_MAPPINGS[legacyObjective];
    if (mapping) {
        return mapping.odax;
    }

    // Default fallback
    console.warn(`No ODAX mapping found for ${legacyObjective}, defaulting to OUTCOME_TRAFFIC`);
    return 'OUTCOME_TRAFFIC';
}

/**
 * Gets recommended optimization goals for an objective
 */
export function getOptimizationGoals(objective: string): string[] {
    // Check if ODAX
    const odaxKey = Object.keys(ODAX_MAPPINGS).find(
        key => ODAX_MAPPINGS[key].odax === objective
    );

    if (odaxKey) {
        return ODAX_MAPPINGS[odaxKey].optimization_goals;
    }

    // Check if legacy
    const mapping = ODAX_MAPPINGS[objective];
    if (mapping) {
        return mapping.optimization_goals;
    }

    // Default
    return ['LINK_CLICKS'];
}

/**
 * Validates if an optimization goal is compatible with an objective
 */
export function isCompatibleGoal(objective: string, optimizationGoal: string): boolean {
    const compatibleGoals = getOptimizationGoals(objective);
    return compatibleGoals.includes(optimizationGoal);
}
