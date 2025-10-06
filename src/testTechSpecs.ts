import { AutotraderCrawler } from "./crawler";

async function testTechnicalSpecs() {
  const crawler = new AutotraderCrawler();

  try {
    console.log("🧪 Testing Technical Specifications Extraction");
    console.log("===============================================\n");

    await crawler.initialize();

    console.log("🚗 Testing with BMW cars (limited to 3 cars for demo)...");

    // Use quick test with detailed specs
    await crawler.crawlQuickTest("BMW", 3);

    console.log("\n✅ Technical specifications test completed!");
    console.log("📄 Check ./data/extracted_cars.csv for detailed specs");
    console.log("🔍 Look for these new columns:");
    console.log(
      "   Performance: 0-62mph, Top speed, Engine power, Engine torque, etc."
    );
    console.log(
      "   Dimensions: Height, Length, Width, Wheelbase, Boot space, etc."
    );
  } catch (error) {
    console.error("❌ Technical specs test failed:", error);
  } finally {
    await crawler.close();
  }
}

// Run the test
testTechnicalSpecs().catch(console.error);
