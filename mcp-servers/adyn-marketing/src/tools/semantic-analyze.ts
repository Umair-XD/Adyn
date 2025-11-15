export interface SemanticAnalyzeInput {
  text: string;
}

export interface SemanticAnalyzeOutput {
  summary: string;
  keywords: string[];
  value_proposition: string;
  brand_tone: string;
  audience_persona: string;
  category: string;
}

export async function semanticAnalyze(input: SemanticAnalyzeInput): Promise<SemanticAnalyzeOutput> {
  try {
    const text = input.text.toLowerCase();
    
    // Extract keywords (simple frequency-based approach)
    const words = text.split(/\s+/).filter(w => w.length > 4);
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    // Detect brand tone
    let brand_tone = 'professional';
    if (text.includes('innovative') || text.includes('cutting-edge')) brand_tone = 'innovative';
    if (text.includes('luxury') || text.includes('premium')) brand_tone = 'luxury';
    if (text.includes('fun') || text.includes('exciting')) brand_tone = 'playful';
    if (text.includes('eco') || text.includes('sustainable')) brand_tone = 'eco-conscious';
    
    // Detect category
    let category = 'general';
    if (text.includes('fashion') || text.includes('clothing')) category = 'fashion';
    if (text.includes('tech') || text.includes('software')) category = 'technology';
    if (text.includes('food') || text.includes('restaurant')) category = 'food & beverage';
    if (text.includes('fitness') || text.includes('health')) category = 'health & wellness';
    if (text.includes('beauty') || text.includes('cosmetic')) category = 'beauty';
    
    // Generate summary
    const summary = input.text.substring(0, 300) + (input.text.length > 300 ? '...' : '');
    
    // Determine audience persona
    let audience_persona = 'general consumers';
    if (category === 'technology') audience_persona = 'tech-savvy professionals aged 25-45';
    if (category === 'fashion') audience_persona = 'style-conscious individuals aged 18-35';
    if (category === 'health & wellness') audience_persona = 'health-conscious adults aged 25-50';
    if (brand_tone === 'luxury') audience_persona = 'affluent consumers aged 30-55';
    
    // Generate value proposition
    const value_proposition = `High-quality ${category} solution that delivers exceptional results and value to ${audience_persona}`;
    
    return {
      summary,
      keywords,
      value_proposition,
      brand_tone,
      audience_persona,
      category
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze content: ${error.message}`);
  }
}
