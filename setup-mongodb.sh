#!/bin/bash

echo "🚗 AutoTrader Car Crawler - MongoDB Setup Script"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npm run install-playwright

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Playwright browsers"
    exit 1
fi

echo "✅ Playwright browsers installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file with your MongoDB connection details"
    echo "   MongoDB Atlas: https://cloud.mongodb.com/"
    echo "   Local MongoDB: Use mongodb://localhost:27017"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Test basic functionality
echo "🧪 Testing basic setup..."
echo "Running quick test crawl (5 BMW cars)..."

npm run crawl test BMW 5

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit .env file with your MongoDB connection string"
    echo "2. Test MongoDB connection: npm run crawl db-stats"
    echo "3. Start crawling: npm run crawl make \"BMW\""
    echo ""
    echo "📖 Documentation:"
    echo "- MongoDB Setup: MONGODB_SETUP.md"
    echo "- Quick Start: QUICKSTART.md"
    echo "- Full Documentation: README.md"
else
    echo "⚠️  Basic test had issues, but setup is complete"
    echo "   This might be due to network or AutoTrader access"
    echo "   Try running: npm run crawl test BMW 5"
fi

echo ""
echo "🚀 Ready to crawl! Happy data collecting!"