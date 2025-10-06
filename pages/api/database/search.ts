import type { NextApiRequest, NextApiResponse } from 'next'

// Mock search results for demo
const generateMockResults = (make?: string, model?: string) => [
  {
    _id: 'demo_1',
    Make: make || 'BMW',
    Model: model || '320i',
    Year: 2023,
    Price: '£35,000',
    Mileage: '12,000 miles',
    Location: 'London',
    Description: 'Excellent condition, full service history',
    _source: 'demo_data'
  },
  {
    _id: 'demo_2', 
    Make: make || 'BMW',
    Model: model || '520d',
    Year: 2022,
    Price: '£42,000',
    Mileage: '18,500 miles',
    Location: 'Manchester',
    Description: 'One owner, low mileage',
    _source: 'demo_data'
  },
  {
    _id: 'demo_3',
    Make: make || 'Audi',
    Model: model || 'A4',
    Year: 2023,
    Price: '£38,500',
    Mileage: '8,200 miles',
    Location: 'Birmingham',
    Description: 'Nearly new, warranty remaining',
    _source: 'demo_data'
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🔍 API Request: Car Search');

  try {
    const { make, model, limit } = req.query;
    const searchLimit = parseInt(limit as string) || 50;

    console.log(`Searching for: make=${make}, model=${model}, limit=${searchLimit}`);

    // Use the standard Vercel + MongoDB pattern
    const { searchCars } = await import('../../../lib/mongodb');
    const results = await searchCars(
      make as string, 
      model as string, 
      searchLimit
    );

    console.log(`✅ Found ${results.length} cars in database`);
    res.status(200).json({ 
      results, 
      total: results.length, 
      connectionMethod: 'database',
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Database search failed:', error);
    
    // Return demo data as fallback
    const mockResults = generateMockResults(
      req.query.make as string, 
      req.query.model as string
    );
    
    console.log('📊 Returning demo search results');
    res.status(200).json({ 
      results: mockResults, 
      total: mockResults.length,
      connectionMethod: 'demo',
      status: 'demo_mode',
      _note: 'Demo results - database connection will be available after environment setup'
    });
  }
}