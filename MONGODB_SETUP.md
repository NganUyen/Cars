# 🗃️ MongoDB Integration Setup Guide

This guide will help you set up MongoDB integration with the AutoTrader Car Crawler to automatically store crawled car data in your MongoDB database.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` file with your MongoDB configuration:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
MONGODB_DATABASE=autotrader_cars
MONGODB_COLLECTION=cars

# Application Settings
NODE_ENV=development
AUTO_PUSH_TO_DB=true
BATCH_SIZE=100
ENABLE_IMAGE_UPLOAD=false
```

### 3. Test MongoDB Connection

```bash
npm run crawl db-stats
```

## 🔧 MongoDB Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create MongoDB Atlas Account**

   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Sign up for a free account
   - Create a new cluster (Free tier available)

2. **Get Connection String**

   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your credentials

3. **Configure Network Access**

   - Add your IP address to the whitelist
   - Or allow access from anywhere (0.0.0.0/0) for development

4. **Update .env File**
   ```bash
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/autotrader_cars?retryWrites=true&w=majority
   MONGODB_DATABASE=autotrader_cars
   ```

### Option 2: Local MongoDB

1. **Install MongoDB Locally**

   ```bash
   # Windows (using Chocolatey)
   choco install mongodb

   # macOS (using Homebrew)
   brew install mongodb-community

   # Ubuntu/Debian
   sudo apt-get install mongodb
   ```

2. **Start MongoDB Service**

   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   brew services start mongodb-community
   # or
   sudo systemctl start mongod
   ```

3. **Update .env File**
   ```bash
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=autotrader_cars
   ```

## 📊 Database Features

### Automatic Data Management

- **Duplicate Prevention**: Automatically prevents duplicate car entries based on URL
- **Batch Processing**: Efficiently processes cars in configurable batches (default: 100)
- **Auto-indexing**: Creates performance indexes automatically
- **Data Validation**: Ensures data integrity before insertion

### Database Schema

Each car document contains:

```javascript
{
  // Basic car information
  Make: "BMW",
  Model: "320i M Sport",
  Year: "2023",
  MSRP: "£35,000",
  Mileage: "5,000 miles",

  // Technical specifications
  "Engine Fuel Type": "Petrol",
  "Engine power": "184BHP",
  "0-62mph": "6.2 seconds",
  "Top speed": "155mph",

  // Dimensions
  Height: "1440mm",
  Length: "4709mm",
  Width: "1827mm",

  // Metadata
  imageUrls: ["url1.jpg", "url2.jpg"],
  crawledAt: "2025-10-05T10:30:00Z",
  updatedAt: "2025-10-05T10:30:00Z",
  source: "autotrader-crawler",
  batchId: "batch_1728123456789",
  CarUrl: "https://www.autotrader.co.uk/car-details/..."
}
```

## 🎯 Usage Examples

### Basic Crawling with MongoDB

```bash
# Crawl ALL BMW cars and save to MongoDB
npm run crawl make "BMW"

# Crawl ALL cars (will take hours!)
npm run crawl all

# Quick test with 20 cars
npm run crawl test "Audi" 20
```

### Database Operations

```bash
# View database statistics
npm run crawl db-stats

# Search for specific cars
npm run crawl db-search BMW 320i
npm run crawl db-search Mercedes
npm run crawl db-search

# Clean up old data (older than 30 days)
npm run crawl db-cleanup 30
npm run crawl db-cleanup 7    # Clean data older than 7 days
```

### Sample Output

```bash
🗃️ MongoDB Database Statistics:
==================================
🚗 Total cars in database: 127,543
🆕 Recent cars (24h): 2,847
💾 Database size: 2.3 GB
📁 Collections: 1

🔝 Top 10 Car Makes:
==================
1. BMW: 15,234 cars
2. Audi: 12,847 cars
3. Mercedes-Benz: 11,923 cars
4. Volkswagen: 9,876 cars
5. Ford: 8,543 cars
```

## ⚙️ Configuration Options

### Environment Variables

| Variable              | Description                    | Default                     | Example             |
| --------------------- | ------------------------------ | --------------------------- | ------------------- |
| `MONGODB_URI`         | MongoDB connection string      | `mongodb://localhost:27017` | `mongodb+srv://...` |
| `MONGODB_DATABASE`    | Database name                  | `autotrader_cars`           | `car_data_prod`     |
| `MONGODB_COLLECTION`  | Collection name                | `cars`                      | `vehicle_listings`  |
| `AUTO_PUSH_TO_DB`     | Enable automatic database push | `true`                      | `false`             |
| `BATCH_SIZE`          | Number of cars per batch       | `100`                       | `50`                |
| `ENABLE_IMAGE_UPLOAD` | Future: Upload images to cloud | `false`                     | `true`              |

### Performance Tuning

For large-scale crawling:

```bash
# Larger batch sizes for better performance
BATCH_SIZE=250

# Disable image download for faster crawling
# (modify crawler.ts or add environment variable)
```

## 🔍 Monitoring & Analytics

### Real-time Statistics

The crawler provides real-time statistics during operation:

- Total cars crawled
- Successfully inserted to database
- Duplicate cars detected
- Processing rate (cars per minute)
- Estimated completion time

### Database Indexes

Automatically created indexes for optimal performance:

- `{Make: 1, Model: 1, Year: 1}` - Fast searching by car details
- `{CarUrl: 1}` - Unique constraint and duplicate prevention
- `{crawledAt: -1}` - Time-based queries
- Text index on Make, Model, Body type for full-text search

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**

   ```bash
   ❌ MongoDB connection failed: MongoNetworkError
   ```

   - Check your connection string
   - Verify network access (whitelist IP in Atlas)
   - Ensure MongoDB service is running (local setup)

2. **Authentication Failed**

   ```bash
   ❌ Authentication failed
   ```

   - Verify username and password in connection string
   - Check database user permissions

3. **Duplicate Key Errors** (Normal)
   ```bash
   ⚠️ Car already exists: BMW 320i - https://...
   ```
   - This is normal - the system prevents duplicates
   - No action needed

### Performance Issues

1. **Slow Insertions**

   - Reduce `BATCH_SIZE` if experiencing timeouts
   - Check MongoDB server resources
   - Consider upgrading Atlas cluster tier

2. **Memory Issues**
   - Reduce batch size: `BATCH_SIZE=50`
   - Enable headless mode: Set `headless: true` in config
   - Close other applications

## 🔒 Security Best Practices

1. **Environment Variables**

   - Never commit `.env` file to version control
   - Use strong passwords for MongoDB users
   - Rotate credentials regularly

2. **Network Security**

   - Restrict IP access in MongoDB Atlas
   - Use connection strings with SSL/TLS
   - Monitor database access logs

3. **Data Privacy**
   - Review data retention policies
   - Consider data anonymization for sensitive information
   - Implement regular backups

## 📈 Scaling for Production

### High-Volume Crawling

For crawling hundreds of thousands of cars:

1. **Database Optimization**

   - Use MongoDB Atlas M10+ clusters
   - Enable sharding for very large collections
   - Configure appropriate read/write concerns

2. **Application Scaling**

   - Run multiple crawler instances with different makes
   - Use distributed task queues
   - Implement proper error handling and retries

3. **Monitoring**
   - Set up MongoDB monitoring
   - Track application metrics
   - Configure alerts for failures

This setup provides a robust, scalable solution for automotive data collection and analysis.
