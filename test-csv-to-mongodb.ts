import { MongoDBService } from "./src/mongoService";
import { CarData } from "./src/types";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";

interface CSVRow {
  [key: string]: string;
}

async function testMongoDBWithExistingData() {
  console.log("🧪 Testing MongoDB Integration with Existing CSV Data");
  console.log("====================================================");

  const mongoService = new MongoDBService();

  try {
    // Connect to MongoDB
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoService.connect();
    console.log("✅ Connected to MongoDB Atlas successfully!");

    // Check initial database stats
    console.log("\n📊 Initial Database Statistics:");
    const initialStats = await mongoService.getStats();
    console.log(`Total cars in database: ${initialStats.totalCars}`);

    // Find and read CSV files
    const dataDir = path.join(__dirname, "data");
    const csvFiles = fs
      .readdirSync(dataDir)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => ({
        name: file,
        path: path.join(dataDir, file),
        size: fs.statSync(path.join(dataDir, file)).size,
      }))
      .sort((a, b) => b.size - a.size); // Sort by size, largest first

    if (csvFiles.length === 0) {
      console.log("❌ No CSV files found in data directory");
      return;
    }

    console.log(`\n📁 Found ${csvFiles.length} CSV files:`);
    csvFiles.forEach((file, index) => {
      const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`${index + 1}. ${file.name} (${sizeInMB} MB)`);
    });

    // Use the largest CSV file (most comprehensive data)
    const selectedFile = csvFiles[0];
    console.log(
      `\n📂 Using file: ${selectedFile.name} (${(
        selectedFile.size /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    // Read and parse CSV
    console.log("📖 Reading CSV file...");
    const csvData: CSVRow[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(selectedFile.path)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          })
        )
        .on("data", (row: CSVRow) => {
          csvData.push(row);
        })
        .on("end", () => {
          resolve();
        })
        .on("error", (error: Error) => {
          reject(error);
        });
    });

    console.log(
      `✅ Successfully parsed ${csvData.length} car records from CSV`
    );

    if (csvData.length === 0) {
      console.log("❌ No data found in CSV file");
      return;
    }

    // Show sample of the data
    console.log("\n📄 Sample car data:");
    const sampleCar = csvData[0];
    console.log(
      "Fields available:",
      Object.keys(sampleCar).slice(0, 10).join(", "),
      "..."
    );
    console.log(
      "Sample car:",
      `${sampleCar.Make} ${sampleCar.Model} (${sampleCar.Year})`
    );

    // Convert CSV rows to CarData format
    console.log("\n🔄 Converting CSV data to MongoDB format...");
    const carDataArray: CarData[] = csvData.map((row) => {
      // Handle ImageUrls conversion (from string to array)
      let imageUrls: string[] = [];
      if (row.ImageUrls) {
        try {
          // Split by semicolon and clean up URLs
          imageUrls = row.ImageUrls.split(";")
            .map((url) => url.trim())
            .filter((url) => url.length > 0);
        } catch (error) {
          imageUrls = [row.ImageUrls];
        }
      }

      return {
        Make: row.Make || "",
        Model: row.Model || "",
        Year: row.Year || "",
        "Engine Fuel Type": row["Engine Fuel Type"] || "",
        "Engine HP": row["Engine HP"] || "",
        "Engine Cylinders": row["Engine Cylinders"] || "",
        "Transmission Type": row["Transmission Type"] || "",
        Driven_Wheels: row.Driven_Wheels || "",
        "Number of Doors": row["Number of Doors"] || "",
        "Market Category": row["Market Category"] || "",
        "Vehicle Size": row["Vehicle Size"] || "",
        "Vehicle Style": row["Vehicle Style"] || "",
        "highway MPG": row["highway MPG"] || "",
        "city mpg": row["city mpg"] || "",
        Popularity: row.Popularity || "",
        MSRP: row.MSRP || "",
        Mileage: row.Mileage || "",
        "Body type": row["Body type"] || "",
        Engine: row.Engine || "",
        Gearbox: row.Gearbox || "",
        Doors: row.Doors || "",
        Seats: row.Seats || "",
        "Emission class": row["Emission class"] || "",
        "Body colour": row["Body colour"] || "",
        "Manufacturer warranty": row["Manufacturer warranty"] || "",
        CarUrl: row.CarUrl || `generated-url-${Date.now()}-${Math.random()}`,
        ImageUrls: imageUrls,
        // Performance specifications
        "0-62mph": row["0-62mph"] || "",
        "Top speed": row["Top speed"] || "",
        Cylinders: row.Cylinders || "",
        Valves: row.Valves || "",
        "Engine power": row["Engine power"] || "",
        "Engine torque": row["Engine torque"] || "",
        "Miles per gallon": row["Miles per gallon"] || "",
        // Size and dimensions
        Height: row.Height || "",
        Length: row.Length || "",
        Width: row.Width || "",
        Wheelbase: row.Wheelbase || "",
        "Fuel tank capacity": row["Fuel tank capacity"] || "",
        "Boot space (seats down)": row["Boot space (seats down)"] || "",
        "Boot space (seats up)": row["Boot space (seats up)"] || "",
        "Minimum kerb weight": row["Minimum kerb weight"] || "",
      };
    });

    console.log(
      `✅ Converted ${carDataArray.length} records to CarData format`
    );

    // Test with a small batch first
    const testBatchSize = Math.min(10, carDataArray.length);
    console.log(`\n🧪 Testing with first ${testBatchSize} cars...`);

    const testBatch = carDataArray.slice(0, testBatchSize);
    const testBatchId = `test_batch_${Date.now()}`;

    const testResult = await mongoService.insertCarsBatch(
      testBatch,
      testBatchId
    );
    console.log(
      `✅ Test batch result: ${testResult?.insertedCount || 0} cars inserted`
    );

    // Ask user if they want to proceed with full data
    console.log(
      `\n🤔 Test successful! Would you like to insert all ${carDataArray.length} cars?`
    );
    console.log(
      "⚠️  This may take several minutes depending on the data size..."
    );

    // For this demo, let's proceed with a reasonable batch (first 100 cars)
    const demoBatchSize = Math.min(100, carDataArray.length);
    console.log(
      `\n📦 Proceeding with ${demoBatchSize} cars for demonstration...`
    );

    const demoBatch = carDataArray.slice(0, demoBatchSize);
    const batchId = `demo_batch_${Date.now()}`;

    // Process in smaller chunks to avoid timeout
    const chunkSize = 25;
    let totalInserted = 0;
    let totalDuplicates = 0;

    for (let i = 0; i < demoBatch.length; i += chunkSize) {
      const chunk = demoBatch.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(demoBatch.length / chunkSize);

      console.log(
        `\n📦 Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} cars)...`
      );

      try {
        const result = await mongoService.insertCarsBatch(
          chunk,
          `${batchId}_chunk_${chunkNumber}`
        );
        if (result) {
          totalInserted += result.insertedCount;
          const duplicates = chunk.length - result.insertedCount;
          totalDuplicates += duplicates;
          console.log(
            `✅ Chunk ${chunkNumber}: ${result.insertedCount} inserted, ${duplicates} duplicates/errors`
          );
        }
      } catch (error) {
        console.error(`❌ Error in chunk ${chunkNumber}:`, error);
      }

      // Add delay between chunks to be respectful to MongoDB
      if (i + chunkSize < demoBatch.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("\n🎉 Batch processing completed!");
    console.log(
      `📊 Total results: ${totalInserted} inserted, ${totalDuplicates} duplicates/errors`
    );

    // Get final database stats
    console.log("\n📊 Final Database Statistics:");
    const finalStats = await mongoService.getStats();
    console.log(`Total cars in database: ${finalStats.totalCars}`);
    console.log(
      `Cars added in this session: ${
        finalStats.totalCars - initialStats.totalCars
      }`
    );

    // Show top makes
    if (finalStats.topMakes && finalStats.topMakes.length > 0) {
      console.log("\n🔝 Top Car Makes in Database:");
      finalStats.topMakes.slice(0, 5).forEach((make: any, index: number) => {
        console.log(`${index + 1}. ${make._id}: ${make.count} cars`);
      });
    }

    // Test search functionality
    console.log("\n🔍 Testing search functionality...");
    const bmwCars = await mongoService.searchCars({ Make: /BMW/i }, 5);
    console.log(`Found ${bmwCars.length} BMW cars in database`);

    if (bmwCars.length > 0) {
      console.log(
        "Sample BMW car:",
        `${bmwCars[0].Make} ${bmwCars[0].Model} (${bmwCars[0].Year})`
      );
    }

    console.log("\n✅ MongoDB integration test completed successfully!");
    console.log(
      "🗃️ Your data is now stored in MongoDB Atlas and ready for querying."
    );
  } catch (error) {
    console.error("❌ MongoDB test failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        console.log("\n🔧 Authentication Error - Please check:");
        console.log("1. Username and password in connection string");
        console.log("2. Database user permissions");
        console.log("3. Network access settings in MongoDB Atlas");
      } else if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        console.log("\n🌐 Network Error - Please check:");
        console.log("1. Internet connection");
        console.log("2. MongoDB Atlas cluster status");
        console.log("3. Firewall settings");
      }
    }
  } finally {
    await mongoService.disconnect();
    console.log("🔐 Disconnected from MongoDB");
  }
}

// Check if running directly
if (require.main === module) {
  testMongoDBWithExistingData().catch(console.error);
}

export { testMongoDBWithExistingData };
