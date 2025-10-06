import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    mongoDatabase: process.env.MONGODB_DATABASE,
    mongoCollection: process.env.MONGODB_COLLECTION,
    mongoUriStart: process.env.MONGODB_URI?.substring(0, 50) + '...',
  };

  console.log('🔍 Environment Diagnostics:', diagnostics);

  try {
    // Test MongoDB connection
    const { createVercelMongoConnection } = await import('../../lib/mongoService');
    const client = await createVercelMongoConnection();
    
    // Test database access
    const db = client.db(process.env.MONGODB_DATABASE || 'ADY');
    const collections = await db.listCollections().toArray();
    
    await client.close();
    
    res.status(200).json({
      status: 'success',
      message: 'MongoDB connection successful!',
      diagnostics,
      collections: collections.map(c => c.name),
    });
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      diagnostics,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      } : error
    });
  }
}