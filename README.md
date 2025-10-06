# AutoTrader Car Crawler

A comprehensive web crawler built with TypeScript, Playwright, and Node.js to extract car data from AutoTrader UK.

## Features

- 🚗 Crawl car listings from AutoTrader UK with **infinite scroll**
- 📊 Extract detailed car specifications
- 🔧 **NEW: Extract technical specifications** (performance, dimensions)
- �️ **NEW: MongoDB integration** - automatic database storage
- �🖼️ Download car images automatically
- 📁 Export data to CSV format
- 🎯 Filter by car make or crawl all cars
- 🔄 Resume-friendly with progress saving
- 🛡️ Respectful crawling with delays
- 📊 Real-time statistics and database analytics

## Installation

1. Install dependencies:

```bash
npm install
```

2. Install Playwright browsers:

```bash
npm run install-playwright
```

3. **Optional: Set up MongoDB** (for database storage):

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your MongoDB connection details
# See MONGODB_SETUP.md for detailed instructions
```

## Usage

### Build the project

```bash
npm run build
```

### Run the crawler

#### Crawl all cars (with MongoDB integration)

```bash
npm run crawl all
```

#### Crawl cars by specific make (with MongoDB integration)

```bash
npm run crawl make "BMW"
npm run crawl make "Audi"
npm run crawl make "Mercedes-Benz"
```

#### Database operations

```bash
npm run crawl db-stats              # View database statistics
npm run crawl db-search BMW 320i    # Search specific cars
npm run crawl db-cleanup 30         # Clean old data
```

#### Custom crawling

```bash
npm run dev custom 10
```

## Command Line Arguments

- `command`: `all`, `make`, or `custom`
- `maxPages`: Number of pages to crawl (default: 3)
- `make`: Car make/brand name (required for `make` command)

## Output

### CSV File

The crawler generates a CSV file at `./data/extracted_cars.csv` with the following columns:

- Make, Model, Year
- Engine Fuel Type, Engine HP, Engine Cylinders
- Transmission Type, Driven_Wheels
- Number of Doors, Seats
- Market Category, Vehicle Size, Vehicle Style
- Highway MPG, City MPG, Popularity
- MSRP, Mileage
- Body type, Engine, Gearbox
- Emission class, Body colour
- Manufacturer warranty
- Car URL, Image URLs

### MongoDB Database

**NEW**: When MongoDB is configured, car data is automatically stored in your database with:

- **Duplicate Prevention**: Automatic detection and prevention of duplicate entries
- **Batch Processing**: Efficient insertion in configurable batches (default: 100 cars)
- **Rich Metadata**: Includes crawl timestamps, batch IDs, and data source information
- **Performance Indexes**: Auto-created indexes for fast searching and querying
- **Real-time Statistics**: Live progress tracking and database analytics

**Database Features**:

- 🔍 Full-text search across all car fields
- 📊 Aggregation queries for analytics
- 🕒 Time-based data retention policies
- 🔄 Automatic data validation and cleansing

### Images

Car images are downloaded to `./images/{Car_Name}/` directories.

## Data Extracted

The crawler extracts the following information from each car listing:

### Basic Information

- Car name and model
- Price (MSRP)
- Year

### Specifications

- Mileage
- Fuel type (Petrol, Diesel, Electric, Hybrid, etc.)
- Body type (SUV, Sedan, Hatchback, etc.)
- Engine size
- Transmission (Manual/Automatic)
- Number of doors and seats
- Emission class
- Body color
- Manufacturer warranty status

### Media

- All available car images in high resolution
- Images organized by car name in separate folders

## Example Output

```csv
Make,Model,Year,Engine Fuel Type,MSRP,Mileage,Body type,Engine,Gearbox,Doors,Seats,Body colour
Alfa Romeo,Junior,2024,Petrol Hybrid,£31650,10 miles,SUV,1.2L,Automatic,5,5,Black
BMW,320i M Sport,2023,Petrol,£35000,5000 miles,Sedan,2.0L,Automatic,4,5,White
```

## Configuration

### Browser Settings

- Headless mode: Set `headless: true` in `src/crawler.ts` for production
- Speed: Adjust `slowMo` parameter for debugging

### Rate Limiting

- Default delay: 2 seconds between requests
- Adjust `waitForTimeout` values in the code for faster/slower crawling

### File Paths

- CSV output: `./data/extracted_cars.csv`
- Images: `./images/{car_name}/`

## Project Structure

```
src/
├── index.ts          # Main entry point
├── crawler.ts        # Main crawler orchestrator
├── scraper.ts        # AutoTrader specific scraping logic
├── imageDownloader.ts # Image downloading functionality
├── csvExporter.ts    # CSV export functionality
└── types.ts          # TypeScript type definitions

data/
└── extracted_cars.csv # Generated CSV output

images/
└── {Car_Name}/       # Downloaded images organized by car
    ├── image_01.jpg
    ├── image_02.jpg
    └── ...
```

## Error Handling

- Graceful error handling for individual car failures
- Automatic retry mechanisms for network issues
- Progress saving every 10 cars processed
- Detailed logging for debugging

## Legal and Ethical Usage

⚠️ **Important Notes:**

- This tool is for educational and research purposes
- Respect AutoTrader's terms of service
- Use reasonable delays between requests
- Don't overload their servers
- Consider using their official API for commercial purposes

## Troubleshooting

### Common Issues

1. **Browser not found**: Run `npm run install-playwright`
2. **Permission errors**: Check file system permissions for output directories
3. **Network timeouts**: Increase timeout values in the code
4. **Anti-bot measures**: Use longer delays or rotate user agents

### Debug Mode

Set `headless: false` in the crawler to see browser interactions.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the crawler.

## License

MIT License - see LICENSE file for details.
