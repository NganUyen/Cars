# 🚗 AutoTrader Car Crawler - Quick Start Guide (Infinite Scroll!)

## Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
npm run install-playwright
```

### 2. Run Your First Crawl

```bash
# Quick test (recommended first run - limited cars)
npm run crawl test

# 🔄 Crawl ALL BMW cars (infinite scroll - gets EVERY BMW!)
npm run crawl make "BMW"

# Crawl all cars (2 pages)
npm run crawl all 2
```

### 3. Analyze Results

```bash
# View analytics of crawled data
npm run crawl analyze
```

## 📁 Output Files

After crawling, you'll find:

- **CSV Data**: `./data/extracted_cars.csv`
- **Car Images**: `./images/{Car_Name}/`

## 🎯 Common Commands

```bash
# 🧪 Test the crawler (limited cars)
npm run crawl test
npm run crawl test "Audi" 15        # Test with 15 Audi cars

# 🔄 Crawl ALL cars for specific brands (infinite scroll)
npm run crawl make "Audi"           # Gets EVERY Audi car!
npm run crawl make "Mercedes-Benz"  # Gets EVERY Mercedes car!
npm run crawl make "Toyota"         # Gets EVERY Toyota car!

# 🔄 Crawl ALL cars for popular brands (WARNING: Takes hours!)
npm run crawl brands                # Gets EVERY car for 15 popular brands!

# 🔄 Crawl ALL cars on the site (WARNING: Could be 100,000+ cars!)
npm run crawl all                   # Gets EVERY car on AutoTrader!

# 🧹 Clean up old data
npm run crawl clean

# 📊 Analyze crawled data
npm run crawl analyze

# ❓ Get help
npm run crawl help
```

## 📊 Sample Output

The crawler extracts comprehensive car data:

| Make | Model        | Price   | Fuel Type | Body Type | Mileage | Engine | Doors |
| ---- | ------------ | ------- | --------- | --------- | ------- | ------ | ----- |
| BMW  | 320i M Sport | £35,000 | Petrol    | Sedan     | 5,000   | 2.0L   | 4     |
| Audi | A4 Advanced  | £32,000 | Petrol    | Sedan     | 8,000   | 2.0L   | 4     |

## ⚙️ Configuration

- **Speed**: Adjust `slowMo` in `src/config.ts` (default: 1000ms)
- **Headless**: Set `headless: true` for background mode
- **Delays**: Modify request delays to be more/less aggressive

## 🛡️ Respectful Crawling

The crawler includes:

- ✅ Delays between requests (2-3 seconds)
- ✅ User-agent rotation
- ✅ Error handling and retries
- ✅ Progress saving every 10 cars
- ✅ Graceful shutdown on interruption

## 🚨 Important Notes

- **Legal**: Use responsibly and respect AutoTrader's terms of service
- **Rate Limiting**: Don't crawl too aggressively to avoid being blocked
- **Commercial Use**: Consider using AutoTrader's official API for business purposes

## 🎉 Happy Crawling!

Start with `npm run crawl test` to see the crawler in action!
