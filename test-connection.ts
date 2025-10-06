import { MongoDBService } from "./src/mongoService";

async function testConnection() {
  console.log("🔗 Testing MongoDB Atlas Connection...");
  console.log("=========================================");

  const mongoService = new MongoDBService();

  try {
    console.log("🔌 Attempting to connect to MongoDB Atlas...");
    await mongoService.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");

    console.log("🏥 Testing database health...");
    const isHealthy = await mongoService.healthCheck();
    console.log(
      `💊 Database health: ${isHealthy ? "Healthy ✅" : "Unhealthy ❌"}`
    );

    console.log("📊 Getting database statistics...");
    const stats = await mongoService.getStats();
    console.log(`🗃️ Database: ${process.env.MONGODB_DATABASE}`);
    console.log(`📁 Collection: ${process.env.MONGODB_COLLECTION}`);
    console.log(`🚗 Total cars: ${stats.totalCars}`);
    console.log(`📏 Database size: ${stats.databaseSize} GB`);

    if (stats.totalCars > 0) {
      console.log("\n🔝 Top car makes in database:");
      stats.topMakes.slice(0, 5).forEach((make: any, index: number) => {
        console.log(`   ${index + 1}. ${make._id}: ${make.count} cars`);
      });
    }

    await mongoService.disconnect();
    console.log("🔐 Disconnected from MongoDB");

    console.log("\n🎉 MongoDB connection test successful!");
    console.log("✅ Your database is ready to receive data.");
  } catch (error) {
    console.error("❌ Connection test failed:", error);

    if (error instanceof Error) {
      console.log("\n🔧 Troubleshooting suggestions:");

      if (
        error.message.includes("authentication") ||
        error.message.includes("auth")
      ) {
        console.log("🔑 Authentication Error:");
        console.log("   - Check username and password in .env file");
        console.log("   - Verify database user exists in MongoDB Atlas");
        console.log("   - Ensure user has proper permissions");
      } else if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        console.log("🌐 Network Error:");
        console.log("   - Check internet connection");
        console.log("   - Verify MongoDB Atlas cluster is running");
        console.log("   - Check IP whitelist in MongoDB Atlas Network Access");
      } else if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo")
      ) {
        console.log("🔍 DNS/Connection Error:");
        console.log("   - Check the MongoDB connection string format");
        console.log("   - Verify cluster URL is correct");
      } else {
        console.log("❓ General Error:");
        console.log("   - Check MongoDB Atlas cluster status");
        console.log("   - Verify all connection parameters");
      }
    }

    process.exit(1);
  }
}

if (require.main === module) {
  testConnection().catch(console.error);
}
