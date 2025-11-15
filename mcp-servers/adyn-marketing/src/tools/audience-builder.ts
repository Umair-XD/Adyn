export interface AudienceBuilderInput {
  persona: string;
  keywords: string[];
  category: string;
}

export interface AudienceBuilderOutput {
  age_range: string;
  interest_groups: string[];
  geos: string[];
  behaviors: string[];
}

export async function audienceBuilder(input: AudienceBuilderInput): Promise<AudienceBuilderOutput> {
  const { persona, keywords, category } = input;
  
  // Determine age range based on persona and category
  let age_range = '25-54';
  if (persona.includes('18-35') || category === 'fashion') age_range = '18-35';
  if (persona.includes('25-45') || category === 'technology') age_range = '25-45';
  if (persona.includes('30-55') || persona.includes('affluent')) age_range = '30-55';
  if (persona.includes('25-50')) age_range = '25-50';
  
  // Build interest groups based on category and keywords
  const interest_groups: string[] = [];
  
  // Category-based interests
  const categoryInterests: Record<string, string[]> = {
    'technology': ['Technology', 'Gadgets', 'Innovation', 'Software', 'Mobile Apps'],
    'fashion': ['Fashion', 'Style', 'Shopping', 'Luxury Goods', 'Accessories'],
    'health & wellness': ['Health & Fitness', 'Wellness', 'Nutrition', 'Yoga', 'Meditation'],
    'food & beverage': ['Food', 'Cooking', 'Restaurants', 'Dining', 'Gourmet'],
    'beauty': ['Beauty', 'Cosmetics', 'Skincare', 'Makeup', 'Personal Care'],
    'general': ['Shopping', 'Lifestyle', 'Entertainment']
  };
  
  interest_groups.push(...(categoryInterests[category] || categoryInterests['general']));
  
  // Add keyword-based interests
  keywords.slice(0, 3).forEach(keyword => {
    interest_groups.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
  });
  
  // Determine geos (default to major markets)
  const geos = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany'
  ];
  
  // Build behaviors based on category and persona
  const behaviors: string[] = [];
  
  if (persona.includes('affluent') || persona.includes('luxury')) {
    behaviors.push('High-income households', 'Luxury shoppers', 'Premium brand buyers');
  } else {
    behaviors.push('Online shoppers', 'Frequent buyers', 'Deal seekers');
  }
  
  if (category === 'technology') {
    behaviors.push('Early technology adopters', 'Tech enthusiasts', 'Mobile device users');
  }
  
  if (category === 'fashion') {
    behaviors.push('Fashion enthusiasts', 'Trend followers', 'Brand conscious');
  }
  
  behaviors.push('Engaged shoppers', 'Social media users');
  
  return {
    age_range,
    interest_groups: [...new Set(interest_groups)].slice(0, 10),
    geos,
    behaviors: [...new Set(behaviors)].slice(0, 8)
  };
}
