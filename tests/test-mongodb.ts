import { MongoDBService } from "../src/mongoService";
import { CarData } from "../src/types";

async function testMongoDBIntegration() {
  console.log("🧪 Testing MongoDB Integration...");

  const testCarData: CarData = {
    Make: "BMW",
    Model: "Test 320i",
    Year: "2023",
    "Engine Fuel Type": "Petrol",
    "Engine HP": "184",
    "Engine Cylinders": "4",
    "Transmission Type": "Automatic",
    Driven_Wheels: "RWD",
    "Number of Doors": "4",
    "Market Category": "Luxury",
    "Vehicle Size": "Compact",
    "Vehicle Style": "Sedan",
    "highway MPG": "35",
    "city mpg": "25",
    Popularity: "High",
    MSRP: "£35000",
    Mileage: "1000 miles",
    "Body type": "Sedan",
    Engine: "2.0L",
    Gearbox: "Automatic",
    Doors: "4",
    Seats: "5",
    "Emission class": "Euro 6",
    "Body colour": "White",
    "Manufacturer warranty": "Yes",
    CarUrl: "https://test-url.com/test-car-" + Date.now(),
    ImageUrls: ["https://test.com/image1.jpg", "https://test.com/image2.jpg"],
    "0-62mph": "6.2 seconds",
    "Top speed": "155mph",
    Cylinders: "4",
    Valves: "16",
    "Engine power": "184BHP",
    "Engine torque": "300NM",
    "Miles per gallon": "30.5mpg",
    Height: "1440mm",
    Length: "4709mm",
    Width: "1827mm",
    Wheelbase: "2851mm",
    "Fuel tank capacity": "59L",
    "Boot space (seats down)": "1200L",
    "Boot space (seats up)": "480L",
    "Minimum kerb weight": "1455kg",
  };

  try {
    const mongoService = new MongoDBService();

    console.log("🔗 Connecting to MongoDB...");
    await mongoService.connect();
    console.log("✅ MongoDB connected");

    console.log("📝 Testing single car insert...");
    await mongoService.insertCar(testCarData, "test-batch");
    console.log("✅ Single car insert successful");

    console.log("📝 Testing batch insert...");
    const batchData = [
      {
        ...testCarData,
        Model: "Test 330i",
        CarUrl: "https://test-url.com/test-car-batch-1-" + Date.now(),
      },
      {
        ...testCarData,
        Model: "Test 340i",
        CarUrl: "https://test-url.com/test-car-batch-2-" + Date.now(),
      },
    ];
    await mongoService.insertCarsBatch(batchData, "test-batch");
    console.log("✅ Batch insert successful");

    console.log("📊 Getting database stats...");
    const stats = await mongoService.getStats();
    console.log(`Database contains ${stats.totalCars} cars`);

    console.log("🔍 Testing search functionality...");
    const searchResults = await mongoService.searchCars({ Make: "BMW" }, 5);
    console.log(`Found ${searchResults.length} BMW cars`);

    console.log("🔐 Disconnecting...");
    await mongoService.disconnect();
    console.log("✅ Disconnected");

    console.log("\n🎉 All MongoDB tests passed!");
    console.log("✅ MongoDB integration is working correctly");
  } catch (error) {
    console.error("❌ MongoDB test failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your .env file configuration");
    console.log("2. Verify MongoDB connection string");
    console.log("3. Ensure MongoDB service is running");
    console.log("4. Check network connectivity");
    process.exit(1);
  }
}

if (require.main === module) {
  testMongoDBIntegration().catch(console.error);
}

export { testMongoDBIntegration };
