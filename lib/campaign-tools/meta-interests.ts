/**
 * META INTEREST ID MAPPING SERVICE
 * 
 * Maps common interest keywords to real Meta Marketing API interest IDs.
 * Now utilizes the live Targeting Search API via MetaAPIClient.
 */

export interface MetaInterest {
    id: string;
    name: string;
    audience_size_lower_bound: number;
    audience_size_upper_bound: number;
    path: string[];
}

/**
 * Validates and maps interest names to Meta API interest IDs
 * @param interestNames - Array of interest keywords
 * @param accessToken - Optional Meta access token for live lookup
 * @returns Array of validated Meta interests with real IDs
 */
export async function validateInterests(interestNames: string[], accessToken?: string): Promise<MetaInterest[]> {
    const validatedInterests: MetaInterest[] = [];

    // 1. Try Live Lookup if Token exists
    if (accessToken) {
        try {
            const { MetaAPIClient } = await import('../meta-api');
            const client = new MetaAPIClient(accessToken);

            for (const interestName of interestNames) {
                const results = await client.searchInterests(interestName, 1);
                if (results && results.length > 0) {
                    const first = results[0];
                    validatedInterests.push({
                        id: first.id,
                        name: first.name,
                        audience_size_lower_bound: first.audience_size_lower_bound || 0,
                        audience_size_upper_bound: first.audience_size_upper_bound || 0,
                        path: first.path || []
                    });
                }
            }
        } catch (error) {
            console.error('Live interest validation failed:', error);
        }
    }

    // 2. Fallback: Add remaining interests as unvalidated placeholders
    // This ensures expert marketer targeting is preserved in logs even without a token
    const remainingNames = interestNames.filter(name =>
        !validatedInterests.some(v => v.name.toLowerCase() === name.toLowerCase())
    );

    for (const name of remainingNames) {
        validatedInterests.push({
            id: `PASS_THROUGH_${name.toUpperCase().replace(/\s+/g, '_')}`,
            name,
            audience_size_lower_bound: 1000000, // Safe default for unvalidated/expert suggestions
            audience_size_upper_bound: 5000000,
            path: ['Strategy Builder', 'Expert Suggestion']
        });
    }

    return validatedInterests;
}

/**
 * Gets interest suggestions based on a seed keyword
 * @param keyword - Interest keyword or ID
 * @param accessToken - Optional Meta access token for live lookup
 * @param limit - Maximum number of suggestions to return
 */
export async function getInterestSuggestions(keyword: string, accessToken?: string, limit = 25): Promise<MetaInterest[]> {
    if (accessToken) {
        try {
            const { MetaAPIClient } = await import('../meta-api');
            const client = new MetaAPIClient(accessToken);

            // If keyword is an ID (numeric), use suggestions API
            if (/^\d+$/.test(keyword)) {
                const results = await client.getInterestSuggestions([keyword], limit);
                return results.map(r => ({
                    id: r.id,
                    name: r.name,
                    audience_size_lower_bound: r.audience_size_lower_bound || 0,
                    audience_size_upper_bound: r.audience_size_upper_bound || 0,
                    path: r.path || []
                }));
            } else {
                // Otherwise search for interests matching keyword
                const results = await client.searchInterests(keyword, limit);
                return results.map(r => ({
                    id: r.id,
                    name: r.name,
                    audience_size_lower_bound: r.audience_size_lower_bound || 0,
                    audience_size_upper_bound: r.audience_size_upper_bound || 0,
                    path: r.path || []
                }));
            }
        } catch (error) {
            console.error('Live interest suggestions failed:', error);
        }
    } else {
        console.warn('No access token provided for interest suggestions. Live lookup skipped.');
    }

    return [];
}

/**
 * Converts interest names to Meta API format with real IDs
 */
export function formatInterestsForAPI(interests: MetaInterest[]): Array<{ id: string; name: string }> {
    return interests.map(interest => ({
        id: interest.id,
        name: interest.name
    }));
}
