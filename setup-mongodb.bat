@echo off
echo 🚗 AutoTrader Car Crawler - MongoDB Setup Script
echo ================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Install Playwright browsers
echo 🎭 Installing Playwright browsers...
call npm run install-playwright

if errorlevel 1 (
    echo ❌ Failed to install Playwright browsers
    pause
    exit /b 1
)

echo ✅ Playwright browsers installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit the .env file with your MongoDB connection details
    echo    MongoDB Atlas: https://cloud.mongodb.com/
    echo    Local MongoDB: Use mongodb://localhost:27017
    echo.
) else (
    echo ✅ .env file already exists
)

REM Test basic functionality
echo 🧪 Testing basic setup...
echo Running quick test crawl (5 BMW cars)...

call npm run crawl test BMW 5

if errorlevel 1 (
    echo ⚠️  Basic test had issues, but setup is complete
    echo    This might be due to network or AutoTrader access
    echo    Try running: npm run crawl test BMW 5
) else (
    echo.
    echo 🎉 Setup completed successfully!
)

echo.
echo 📋 Next Steps:
echo 1. Edit .env file with your MongoDB connection string
echo 2. Test MongoDB connection: npm run crawl db-stats
echo 3. Start crawling: npm run crawl make "BMW"
echo.
echo 📖 Documentation:
echo - MongoDB Setup: MONGODB_SETUP.md
echo - Quick Start: QUICKSTART.md
echo - Full Documentation: README.md
echo.
echo 🚀 Ready to crawl! Happy data collecting!
pause