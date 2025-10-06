import type { NextApiRequest, NextApiResponse } from 'next'
import { testConnection } from '../../lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🔧 API Request: MongoDB Debug Test');
  
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
      diagnostics,
      troubleshooting: {
        message: 'Set MONGODB_URI in Vercel Environment Variables',
        steps: ['Go to Vercel Dashboard → Project Settings → Environment Variables']
      }
    });
  }

  try {
    // Use the new connection test function
    const connectionResult = await testConnection();
    
    const response = {
      ...connectionResult,
      diagnostics,
      troubleshooting: connectionResult.status === 'error' ? {
        commonIssues: [
          'MongoDB Atlas IP whitelist: Add 0.0.0.0/0 to Network Access',
          'Incorrect credentials in connection string',
          'Atlas cluster is paused or deleted',
          'SSL/TLS certificate issues'
        ],
        debugSteps: [
          '1. Check MongoDB Atlas Dashboard → Network Access',
          '2. Verify cluster is running (not paused)',
          '3. Test connection string locally',
          '4. Review Atlas logs for connection attempts'
        ]
      } : undefined
    };
    
    if (connectionResult.status === 'success') {
      res.status(200).json(response);
    } else {
      res.status(500).json(response);
    }
    
  } catch (error) {
    console.error('❌ Debug API failed:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Debug API internal error',
      diagnostics,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}