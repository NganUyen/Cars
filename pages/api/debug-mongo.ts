import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🔍 MongoDB Connection Diagnostic Starting...');

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    mongoDatabase: process.env.MONGODB_DATABASE,
    mongoCollection: process.env.MONGODB_COLLECTION,
    mongoUriPrefix: process.env.MONGODB_URI?.substring(0, 30) + '...',
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('MONGO')),
  };

  console.log('📋 Environment Diagnostics:', JSON.stringify(diagnostics, null, 2));

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      status: 'error',
      message: 'MONGODB_URI environment variable not found',
      diagnostics
    });
  }

  try {
    console.log('🧪 Testing MongoDB connection...');
    
    // Import and test our service using standard Vercel pattern
    const clientPromise = (await import('../../lib/mongodb')).default;
    
    const startTime = Date.now();
    const client = await clientPromise;
    const connectionTime = Date.now() - startTime;
    
    console.log(`⏱️ Connection established in ${connectionTime}ms`);
    
    // Test database operations
    const db = client.db(process.env.MONGODB_DATABASE || 'ADY');
    
    // List collections
    const collectionsStartTime = Date.now();
    const collections = await db.listCollections().toArray();
    const collectionsTime = Date.now() - collectionsStartTime;
    
    console.log(`📚 Found ${collections.length} collections in ${collectionsTime}ms`);
    
    // Test collection access
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'Data');
    
    const countStartTime = Date.now();
    const documentCount = await collection.estimatedDocumentCount();
    const countTime = Date.now() - countStartTime;
    
    console.log(`📊 Document count: ${documentCount} (${countTime}ms)`);
    
    // Test a simple query
    const queryStartTime = Date.now();
    const sample = await collection.findOne({});
    const queryTime = Date.now() - queryStartTime;
    
    console.log(`🔍 Sample query completed in ${queryTime}ms`);
    
    await client.close();
    
    const result = {
      status: 'success',
      message: 'MongoDB Atlas connection fully operational!',
      diagnostics,
      performance: {
        connectionTime: `${connectionTime}ms`,
        collectionsTime: `${collectionsTime}ms`,
        countTime: `${countTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${Date.now() - startTime}ms`
      },
      database: {
        collections: collections.map(c => c.name),
        documentCount,
        sampleDocument: sample ? Object.keys(sample) : null
      }
    };
    
    console.log('✅ Diagnostic complete - all tests passed');
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    
    const errorInfo = {
      status: 'error',
      message: 'MongoDB connection diagnostic failed',
      diagnostics,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : null
      },
      troubleshooting: {
        commonIssues: [
          'MongoDB Atlas IP whitelist: Add 0.0.0.0/0 to Network Access',
          'Incorrect credentials in connection string',
          'Atlas cluster is paused or deleted',
          'Database/collection names mismatch',
          'Vercel region blocked by Atlas'
        ],
        debugSteps: [
          '1. Check MongoDB Atlas Dashboard → Network Access',
          '2. Verify cluster is running (not paused)',
          '3. Test connection string locally',
          '4. Check Vercel environment variables',
          '5. Review Atlas logs for connection attempts'
        ]
      }
    };
    
    res.status(500).json(errorInfo);
  }
}