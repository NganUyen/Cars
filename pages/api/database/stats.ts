import type { NextApiRequest, NextApiResponse } from 'next'

// Mock data for fallback when database is unavailable
const mockStats = {
  totalCars: 15420,
  recentCars: 1234,
  topMakes: [
    { _id: 'BMW', count: 2150 },
    { _id: 'Mercedes-Benz', count: 1890 },
    { _id: 'Audi', count: 1675 },
    { _id: 'Toyota', count: 1520 },
    { _id: 'Ford', count: 1340 }
  ],
  databaseSize: 15420 * 2048,
  lastUpdated: new Date().toISOString(),
  connectionMethod: 'demo',
  status: 'demo_mode'
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🎯 API Request: Database Stats');

  try {
    // Try the Vercel-optimized MongoDB service - NO FALLBACK TO DEMO DATA
    const { getReliableStats } = await import('../../../lib/mongoService');
    const stats = await getReliableStats();
    
    console.log('✅ Successfully retrieved database statistics');
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Database connection failed - NO FALLBACK:', error);
    
    // Return error response instead of demo data
    const errorResponse = {
      status: 'error',
      message: 'Failed to connect to MongoDB Atlas',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      troubleshooting: {
        possibleCauses: [
          'MongoDB Atlas network access restrictions',
          'Incorrect environment variables in Vercel',
          'Atlas cluster is paused or unavailable',
          'Connection timeout due to cold start'
        ],
        nextSteps: [
          'Check MongoDB Atlas Network Access settings',
          'Verify environment variables in Vercel dashboard',
          'Ensure Atlas cluster is running'
        ]
      }
    };
    
    res.status(500).json(errorResponse);
  }
}