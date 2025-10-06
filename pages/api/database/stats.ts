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
    // Try the Vercel-optimized MongoDB service
    const { getReliableStats } = await import('../../../lib/mongoService');
    const stats = await getReliableStats();
    
    console.log('✅ Successfully retrieved database statistics');
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    // Return demo data with explanation
    const demoResponse = {
      ...mockStats,
      _note: 'Using demo data - MongoDB Atlas connection temporarily unavailable',
      _error: error instanceof Error ? error.message.substring(0, 200) : 'Connection failed',
      _status: 'This is expected during initial deployment - database will connect once environment variables are set in Vercel'
    };
    
    console.log('📊 Returning demo data due to connection failure');
    res.status(200).json(demoResponse);
  }
}