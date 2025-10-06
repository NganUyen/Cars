import * as fs from "fs";
import * as path from "path";

interface CarAnalytics {
  totalCars: number;
  makeDistribution: { [make: string]: number };
  fuelTypeDistribution: { [fuel: string]: number };
  bodyTypeDistribution: { [body: string]: number };
  gearboxDistribution: { [gearbox: string]: number };
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  mileageRange: {
    min: number;
    max: number;
    average: number;
  };
  carsWithImages: number;
  totalImages: number;
}

export class DataAnalyzer {
  private csvPath: string;

  constructor(csvPath: string = "./data/extracted_cars.csv") {
    this.csvPath = csvPath;
  }

  async analyzeCrawledData(): Promise<CarAnalytics> {
    if (!fs.existsSync(this.csvPath)) {
      throw new Error(`CSV file not found: ${this.csvPath}`);
    }

    const csvContent = fs.readFileSync(this.csvPath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",");

    const analytics: CarAnalytics = {
      totalCars: 0,
      makeDistribution: {},
      fuelTypeDistribution: {},
      bodyTypeDistribution: {},
      gearboxDistribution: {},
      priceRange: { min: Infinity, max: 0, average: 0 },
      mileageRange: { min: Infinity, max: 0, average: 0 },
      carsWithImages: 0,
      totalImages: 0,
    };

    let totalPrice = 0;
    let totalMileage = 0;
    let priceCount = 0;
    let mileageCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",");
      if (values.length < headers.length) continue;

      analytics.totalCars++;

      // Extract data
      const make = values[0] || "Unknown";
      const fuelType = values[3] || "Unknown";
      const bodyType = values[17] || "Unknown";
      const gearbox = values[19] || "Unknown";
      const priceStr = values[15] || "";
      const mileageStr = values[16] || "";
      const imageUrls = values[26] || "";

      // Count distributions
      analytics.makeDistribution[make] =
        (analytics.makeDistribution[make] || 0) + 1;
      analytics.fuelTypeDistribution[fuelType] =
        (analytics.fuelTypeDistribution[fuelType] || 0) + 1;
      analytics.bodyTypeDistribution[bodyType] =
        (analytics.bodyTypeDistribution[bodyType] || 0) + 1;
      analytics.gearboxDistribution[gearbox] =
        (analytics.gearboxDistribution[gearbox] || 0) + 1;

      // Analyze prices
      const priceMatch = priceStr.match(/£([\d,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ""));
        if (!isNaN(price)) {
          analytics.priceRange.min = Math.min(analytics.priceRange.min, price);
          analytics.priceRange.max = Math.max(analytics.priceRange.max, price);
          totalPrice += price;
          priceCount++;
        }
      }

      // Analyze mileage
      const mileageMatch = mileageStr.match(/([\d,]+)/);
      if (mileageMatch) {
        const mileage = parseInt(mileageMatch[1].replace(/,/g, ""));
        if (!isNaN(mileage)) {
          analytics.mileageRange.min = Math.min(
            analytics.mileageRange.min,
            mileage
          );
          analytics.mileageRange.max = Math.max(
            analytics.mileageRange.max,
            mileage
          );
          totalMileage += mileage;
          mileageCount++;
        }
      }

      // Count images
      if (imageUrls.trim()) {
        analytics.carsWithImages++;
        const imageCount = imageUrls.split(";").length;
        analytics.totalImages += imageCount;
      }
    }

    // Calculate averages
    analytics.priceRange.average =
      priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;
    analytics.mileageRange.average =
      mileageCount > 0 ? Math.round(totalMileage / mileageCount) : 0;

    if (analytics.priceRange.min === Infinity) analytics.priceRange.min = 0;
    if (analytics.mileageRange.min === Infinity) analytics.mileageRange.min = 0;

    return analytics;
  }

  printAnalytics(analytics: CarAnalytics): void {
    console.log("\n📊 AutoTrader Data Analytics Report");
    console.log("===================================\n");

    console.log(`🚗 Total Cars Crawled: ${analytics.totalCars}`);
    console.log(
      `📷 Cars with Images: ${analytics.carsWithImages} (${Math.round(
        (analytics.carsWithImages / analytics.totalCars) * 100
      )}%)`
    );
    console.log(`🖼️  Total Images Downloaded: ${analytics.totalImages}`);

    console.log("\n💰 Price Analysis:");
    console.log(`   Min: £${analytics.priceRange.min.toLocaleString()}`);
    console.log(`   Max: £${analytics.priceRange.max.toLocaleString()}`);
    console.log(
      `   Average: £${analytics.priceRange.average.toLocaleString()}`
    );

    console.log("\n🛣️  Mileage Analysis:");
    console.log(`   Min: ${analytics.mileageRange.min.toLocaleString()} miles`);
    console.log(`   Max: ${analytics.mileageRange.max.toLocaleString()} miles`);
    console.log(
      `   Average: ${analytics.mileageRange.average.toLocaleString()} miles`
    );

    console.log("\n🏭 Top Car Makes:");
    const sortedMakes = Object.entries(analytics.makeDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    sortedMakes.forEach(([make, count], index) => {
      console.log(`   ${index + 1}. ${make}: ${count} cars`);
    });

    console.log("\n⛽ Fuel Types:");
    Object.entries(analytics.fuelTypeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([fuel, count]) => {
        console.log(`   ${fuel}: ${count} cars`);
      });

    console.log("\n🚙 Body Types:");
    Object.entries(analytics.bodyTypeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([body, count]) => {
        console.log(`   ${body}: ${count} cars`);
      });

    console.log("\n⚙️  Gearbox Types:");
    Object.entries(analytics.gearboxDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([gearbox, count]) => {
        console.log(`   ${gearbox}: ${count} cars`);
      });

    console.log("\n===================================");
  }
}

// Run analytics if this file is executed directly
async function runAnalytics() {
  const analyzer = new DataAnalyzer();

  try {
    console.log("📈 Analyzing crawled car data...");
    const analytics = await analyzer.analyzeCrawledData();
    analyzer.printAnalytics(analytics);
  } catch (error) {
    console.error("❌ Analytics failed:", error);
  }
}

if (require.main === module) {
  runAnalytics().catch(console.error);
}
