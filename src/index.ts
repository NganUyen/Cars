import { AutotraderCrawler } from "./crawler";

async function main() {
  const crawler = new AutotraderCrawler();

  try {
    // Initialize the crawler
    await crawler.initialize();

    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || "all";
    const maxPages = parseInt(args[1]) || 3;
    const make = args[2] || "";

    console.log("🚗 AutoTrader Car Crawler Started");
    console.log("=================================");
    console.log(`Command: ${command}`);
    console.log(`Max pages: ${maxPages}`);
    if (make) console.log(`Make: ${make}`);
    console.log("=================================\n");

    switch (command.toLowerCase()) {
      case "make":
        if (!make) {
          console.error('Please provide a make name when using "make" command');
          console.log('Usage: npm run dev make 3 "BMW"');
          process.exit(1);
        }
        await crawler.crawlByMake(make, maxPages);
        break;

      case "all":
        await crawler.crawlAllCars(maxPages);
        break;

      case "custom":
        // Example custom search URL
        const customUrl =
          "https://www.autotrader.co.uk/car-search?channel=cars&postcode=NW1+6XE&make=";
        await crawler.crawlCars(customUrl, maxPages);
        break;

      default:
        console.log("Available commands:");
        console.log("  all    - Crawl all cars (default)");
        console.log("  make   - Crawl cars by specific make");
        console.log("  custom - Use custom search URL");
        console.log("");
        console.log("Usage examples:");
        console.log(
          "  npm run dev all 5              # Crawl all cars, max 5 pages"
        );
        console.log(
          '  npm run dev make 3 "BMW"       # Crawl BMW cars, max 3 pages'
        );
        console.log(
          '  npm run dev make 2 "Audi"      # Crawl Audi cars, max 2 pages'
        );
        break;
    }
  } catch (error) {
    console.error("❌ Crawler failed:", error);
    process.exit(1);
  } finally {
    await crawler.close();
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

export { main };
