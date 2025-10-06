import { AutotraderCrawler } from "./crawler";

async function testCrawler() {
  const crawler = new AutotraderCrawler();

  try {
    console.log("🧪 Testing AutoTrader Crawler...");

    // Initialize the crawler
    await crawler.initialize();

    console.log("✅ Browser initialized successfully");

    // Test with a small sample - just 1 page of BMW cars
    console.log("🚗 Testing with BMW cars (1 page only)...");
    await crawler.crawlByMake("BMW", 1);

    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await crawler.close();
  }
}

if (require.main === module) {
  testCrawler().catch(console.error);
}
