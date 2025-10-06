import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🤖 API Request: Crawler Status');

  // Return crawler status information
  const status = {
    isActive: false,
    lastRun: null,
    totalCrawled: 0,
    status: 'idle',
    capabilities: {
      autotraderUK: true,
      imageDownload: true,
      csvExport: true,
      mongodbIntegration: true,
      batchProcessing: true
    },
    features: [
      'Web scraping with Playwright',
      'Car data extraction from AutoTrader UK',
      'Image downloading and management',
      'CSV export functionality', 
      'MongoDB integration',
      'Batch processing support',
      'Year range filtering',
      'Make and model filtering'
    ],
    _note: 'Crawler functionality is available but requires proper environment setup for production use'
  };

  res.status(200).json(status);
}