#!/usr/bin/env node

import { AutotraderCrawler } from "./crawler";
import { DataAnalyzer } from "./analytics";
import { MongoDBService } from "./mongoService";
import { mongoConfig } from "./config";

const USAGE = `
🚗 AutoTrader Car Crawler CLI (Now with MongoDB & Infinite Scroll!)

Usage: npm run crawl [command] [options]

Commands:
  help                          Show this help message
  all                          🔄 Crawl ALL cars (infinite scroll - gets every car!)
  make [make]                  🔄 Crawl ALL cars for specific make (infinite scroll)
  brands                       🔄 Crawl ALL cars for popular brands (infinite scroll)
  year [year]                  📅 Crawl ALL cars for specific year (e.g., 2020)
  year-range [start] [end]     📅 Crawl cars year by year in range - SINGLE CSV FILE
  year-make [year] [make]      📅 Crawl cars for specific year and make
  test [make] [maxCars]        🧪 Quick test crawl (limited cars for testing)
  analyze                      📊 Analyze existing CSV data
  clean                        🧹 Clean up data and images folders
  db-stats                     📊 Show MongoDB database statistics
  db-search [make] [model]     🔍 Search cars in MongoDB database
  db-cleanup [days]            🧹 Clean up old data from MongoDB (default: 30 days)

Examples:
  npm run crawl all                      # 🔄 Crawl ALL cars (infinite scroll + MongoDB)
  npm run crawl make "BMW"              # 🔄 Crawl ALL BMW cars (infinite scroll + MongoDB)
  npm run crawl make "Mercedes-Benz"    # 🔄 Crawl ALL Mercedes cars (infinite scroll + MongoDB)
  npm run crawl brands                  # 🔄 Crawl ALL cars for popular brands
  npm run crawl year 2020               # 📅 Crawl ALL cars from 2020
  npm run crawl year-range 2000 2025    # 📅 Year by year: ALL data in SINGLE CSV
  npm run crawl year-make 2020 "BMW"    # 📅 Crawl BMW cars from 2020
  npm run crawl test "BMW" 20           # 🧪 Quick test: 20 BMW cars only
  npm run crawl test                    # 🧪 Quick test: 10 BMW cars (default)
  npm run crawl analyze                 # 📊 Analyze existing data
  npm run crawl clean                   # 🧹 Clean up output folders
  npm run crawl db-stats                # 📊 View database statistics
  npm run crawl db-search BMW 320i      # 🔍 Search for BMW 320i in database
  npm run crawl db-cleanup 30           # 🧹 Remove data older than 30 days

🔄 Infinite Scroll Features:
  • Automatically scrolls to load ALL available cars
  • Clicks "Load More" buttons when found
  • Handles pagination automatically
  • Gets every single car listing available
  • No page limits - gets everything!

🗄️ MongoDB Features:
  • Automatic data push to MongoDB cluster
  • Duplicate detection and prevention
  • Batch processing for optimal performance
  • Real-time statistics and search capabilities
  • Data retention management
  • Configurable via .env file

Popular Makes:
  BMW, Audi, Mercedes-Benz, Volkswagen, Ford, Toyota, Honda, 
  Nissan, Hyundai, Kia, Peugeot, Renault, Fiat, SEAT, Skoda
`;

const POPULAR_MAKES = [
  "BMW",
  "Audi",
  "Mercedes-Benz",
  "Volkswagen",
  "Ford",
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Peugeot",
  "Renault",
  "Fiat",
  "SEAT",
  "Skoda",
];

async function cleanupFolders() {
  const fs = await import("fs");
  const path = await import("path");

  console.log("🧹 Cleaning up data and images folders...");

  const dataDir = "./data";
  const imagesDir = "./images";

  try {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
      console.log("✅ Cleaned data folder");
    }

    if (fs.existsSync(imagesDir)) {
      fs.rmSync(imagesDir, { recursive: true, force: true });
      console.log("✅ Cleaned images folder");
    }

    // Recreate directories
    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    console.log("✅ Folders recreated");
  } catch (error) {
    console.error("❌ Error cleaning folders:", error);
  }
}

async function crawlPopularBrands() {
  const crawler = new AutotraderCrawler();

  try {
    await crawler.initialize();

    console.log(
      `🔄 Crawling ALL cars for ${POPULAR_MAKES.length} popular car brands with infinite scroll...`
    );
    console.log(
      `⚠️  WARNING: This will crawl EVERY car for each brand - could take hours!`
    );
    console.log(
      `📊 Estimated total: Could be 50,000+ cars across all brands\n`
    );

    for (let i = 0; i < POPULAR_MAKES.length; i++) {
      const make = POPULAR_MAKES[i];
      console.log(`\n📈 Progress: ${i + 1}/${POPULAR_MAKES.length}`);
      console.log(`🚗 Crawling ALL ${make} cars with infinite scroll...`);

      await crawler.crawlByMake(make); // No page limit - infinite scroll

      // Longer delay between brands
      if (i < POPULAR_MAKES.length - 1) {
        console.log("⏱️  Waiting 30 seconds before next brand...");
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }

    console.log("\n🎉 All popular brands crawled successfully!");
  } catch (error) {
    console.error("❌ Popular brands crawl failed:", error);
  } finally {
    await crawler.close();
  }
}

async function showDatabaseStats() {
  const mongoService = new MongoDBService(mongoConfig);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoService.connect();

    console.log("📊 Getting database statistics...");
    const stats = await mongoService.getStats();

    console.log("\n📊 MongoDB Database Statistics:");
    console.log("==================================");
    console.log(
      `🚗 Total cars in database: ${stats.totalCars.toLocaleString()}`
    );
    console.log(`🆕 Recent cars (24h): ${stats.recentCars.toLocaleString()}`);
    console.log(`💾 Database size: ${stats.databaseSize} GB`);
    console.log(`📁 Collections: ${stats.collections}`);

    console.log("\n🔝 Top 10 Car Makes:");
    console.log("==================");
    stats.topMakes.forEach((make: any, index: number) => {
      console.log(
        `${index + 1}. ${make._id}: ${make.count.toLocaleString()} cars`
      );
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await mongoService.disconnect();
  }
}

async function searchDatabase(make?: string, model?: string) {
  const mongoService = new MongoDBService(mongoConfig);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoService.connect();

    let query: any = {};
    let searchDesc = "all cars";

    if (make) {
      query.Make = new RegExp(make, "i"); // Case insensitive
      searchDesc = `${make} cars`;

      if (model) {
        query.Model = new RegExp(model, "i");
        searchDesc = `${make} ${model} cars`;
      }
    }

    console.log(`🔍 Searching for ${searchDesc}...`);
    const results = await mongoService.searchCars(query, 20); // Limit to 20 results

    if (results.length === 0) {
      console.log("⚠️  No cars found matching your criteria.");
      return;
    }

    console.log(`\n🚗 Found ${results.length} ${searchDesc}:`);
    console.log("=".repeat(50));

    results.forEach((car, index) => {
      console.log(`${index + 1}. ${car.Make} ${car.Model} (${car.Year})`);
      console.log(`   Price: ${car.MSRP} | Mileage: ${car.Mileage}`);
      console.log(
        `   Body Type: ${car["Body type"]} | Fuel: ${car["Engine Fuel Type"]}`
      );
      console.log(`   Crawled: ${car.crawledAt.toLocaleDateString()}`);
      console.log("-".repeat(50));
    });

    if (results.length >= 20) {
      console.log(
        "📝 Showing first 20 results. Use more specific search terms for fewer results."
      );
    }
  } catch (error) {
    console.error("❌ Database search failed:", error);
  } finally {
    await mongoService.disconnect();
  }
}

async function cleanupDatabase(daysOld: number) {
  const mongoService = new MongoDBService(mongoConfig);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoService.connect();

    console.log(`🧹 Cleaning up data older than ${daysOld} days...`);
    const deletedCount = await mongoService.cleanupOldData(daysOld);

    if (deletedCount > 0) {
      console.log(`✅ Successfully removed ${deletedCount} old car records.`);
    } else {
      console.log("💫 No old data found to clean up.");
    }
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
  } finally {
    await mongoService.disconnect();
  }
}

async function runQuickTest(make: string = "BMW", maxCars: number = 10) {
  const crawler = new AutotraderCrawler();

  try {
    console.log(
      `🧪 Running quick test crawl: ${make} (max ${maxCars} cars)...`
    );
    await crawler.initialize();

    await crawler.crawlQuickTest(make, maxCars);

    console.log("✅ Quick test completed successfully!");
  } catch (error) {
    console.error("❌ Quick test failed:", error);
  } finally {
    await crawler.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  console.log("🚗 AutoTrader Car Crawler");
  console.log("=========================\n");

  switch (command.toLowerCase()) {
    case "help":
    case "-h":
    case "--help":
      console.log(USAGE);
      break;

    case "all": {
      const crawler = new AutotraderCrawler();
      try {
        await crawler.initialize();
        console.log("🔄 Starting infinite scroll to crawl ALL cars...");
        await crawler.crawlAllCars(); // No page limit - infinite scroll
      } finally {
        await crawler.close();
      }
      break;
    }

    case "make": {
      const make = args[1];

      if (!make) {
        console.error("❌ Please provide a car make name");
        console.log('Example: npm run crawl make "BMW"');
        process.exit(1);
      }

      const crawler = new AutotraderCrawler();
      try {
        await crawler.initialize();
        console.log(`🔄 Starting infinite scroll to crawl ALL ${make} cars...`);
        await crawler.crawlByMake(make); // No page limit - infinite scroll
      } finally {
        await crawler.close();
      }
      break;
    }

    case "brands": {
      console.log(
        "🔄 Starting infinite scroll to crawl ALL cars for popular brands..."
      );
      await crawlPopularBrands(); // No page limit - infinite scroll
      break;
    }

    case "year": {
      const year = parseInt(args[1]);

      if (!year || year < 1900 || year > 2030) {
        console.error("❌ Please provide a valid year (1900-2030)");
        console.log("Example: npm run crawl year 2020");
        process.exit(1);
      }

      const crawler = new AutotraderCrawler();
      try {
        await crawler.initialize();
        console.log(
          `📅 Starting infinite scroll to crawl ALL cars from year ${year}...`
        );
        await crawler.crawlByYear(year, year); // No page limit - infinite scroll
      } finally {
        await crawler.close();
      }
      break;
    }

    case "year-range": {
      const startYear = parseInt(args[1]) || 2000;
      const endYear = parseInt(args[2]) || 2025;

      if (startYear < 1900 || endYear > 2030 || startYear > endYear) {
        console.error("❌ Please provide valid year range (1900-2030)");
        console.log("Example: npm run crawl year-range 2000 2025");
        process.exit(1);
      }

      const crawler = new AutotraderCrawler();
      try {
        await crawler.initialize();
        console.log(
          `📅 Starting year-by-year crawl from ${startYear} to ${endYear}...`
        );
        await crawler.crawlByYearRange(startYear, endYear);
      } finally {
        await crawler.close();
      }
      break;
    }

    case "year-make": {
      const year = parseInt(args[1]);
      const make = args[2];

      if (!year || year < 1900 || year > 2030) {
        console.error("❌ Please provide a valid year (1900-2030)");
        console.log('Example: npm run crawl year-make 2020 "BMW"');
        process.exit(1);
      }

      if (!make) {
        console.error("❌ Please provide a car make name");
        console.log('Example: npm run crawl year-make 2020 "BMW"');
        process.exit(1);
      }

      const crawler = new AutotraderCrawler();
      try {
        await crawler.initialize();
        console.log(
          `📅 Starting infinite scroll to crawl ALL ${make} cars from year ${year}...`
        );
        await crawler.crawlByYear(year, year, make);
      } finally {
        await crawler.close();
      }
      break;
    }

    case "test": {
      const make = args[1] || "BMW";
      const maxCars = parseInt(args[2]) || 10;
      await runQuickTest(make, maxCars);
      break;
    }

    case "analyze": {
      const analyzer = new DataAnalyzer();
      try {
        const analytics = await analyzer.analyzeCrawledData();
        analyzer.printAnalytics(analytics);
      } catch (error) {
        console.error("❌ Analytics failed:", error);
      }
      break;
    }

    case "clean": {
      await cleanupFolders();
      break;
    }

    case "db-stats": {
      await showDatabaseStats();
      break;
    }

    case "db-search": {
      const make = args[1];
      const model = args[2];
      await searchDatabase(make, model);
      break;
    }

    case "db-cleanup": {
      const days = parseInt(args[1]) || 30;
      await cleanupDatabase(days);
      break;
    }

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Use "npm run crawl help" to see available commands');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
