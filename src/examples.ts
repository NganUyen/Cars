import { AutotraderCrawler } from "./crawler";

async function runExamples() {
  const crawler = new AutotraderCrawler();

  try {
    await crawler.initialize();

    console.log("🚗 AutoTrader Crawler - Usage Examples");
    console.log("=====================================\n");

    // Example 1: Crawl BMW cars (2 pages)
    console.log("📝 Example 1: Crawling BMW cars (2 pages)...");
    await crawler.crawlByMake("BMW", 2);
    console.log("✅ BMW crawl completed\n");

    // Small delay between examples
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Example 2: Crawl Audi cars (1 page)
    console.log("📝 Example 2: Crawling Audi cars (1 page)...");
    await crawler.crawlByMake("Audi", 1);
    console.log("✅ Audi crawl completed\n");

    // Small delay between examples
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Example 3: Crawl all cars (1 page only for demo)
    console.log("📝 Example 3: Crawling all cars (1 page)...");
    await crawler.crawlAllCars(1);
    console.log("✅ All cars crawl completed\n");

    console.log("🎉 All examples completed successfully!");
    console.log("📄 Check ./data/extracted_cars.csv for results");
    console.log("🖼️  Check ./images/ for downloaded car images");
  } catch (error) {
    console.error("❌ Example failed:", error);
  } finally {
    await crawler.close();
  }
}

// Popular car makes to try
const popularMakes = [
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

async function crawlPopularMakes() {
  const crawler = new AutotraderCrawler();

  try {
    await crawler.initialize();

    console.log("🏁 Crawling Popular Car Makes");
    console.log("=============================\n");

    for (const make of popularMakes.slice(0, 5)) {
      // Limit to first 5 for demo
      console.log(`🚗 Crawling ${make} cars...`);
      await crawler.crawlByMake(make, 1); // 1 page per make

      // Delay between makes
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    console.log("🎉 Popular makes crawling completed!");
  } catch (error) {
    console.error("❌ Popular makes crawl failed:", error);
  } finally {
    await crawler.close();
  }
}

// Run based on command line argument
const command = process.argv[2] || "examples";

if (command === "popular") {
  crawlPopularMakes().catch(console.error);
} else {
  runExamples().catch(console.error);
}
