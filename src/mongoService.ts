import {
  MongoClient,
  Db,
  Collection,
  InsertOneResult,
  InsertManyResult,
} from "mongodb";
import { CarData } from "./types";
import * as dotenv from "dotenv";

dotenv.config();

export interface MongoCarDocument extends Omit<CarData, "ImageUrls"> {
  imageUrls: string[];
  crawledAt: Date;
  updatedAt: Date;
  source: string;
  batchId?: string;
}

export interface DatabaseConfig {
  uri: string;
  database: string;
  collection: string;
}

export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<MongoCarDocument> | null = null;
  private config: DatabaseConfig;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      uri:
        config?.uri || process.env.MONGODB_URI || "mongodb://localhost:27017",
      database:
        config?.database || process.env.MONGODB_DATABASE || "autotrader_cars",
      collection:
        config?.collection || process.env.MONGODB_COLLECTION || "cars",
    };

    if (!this.config.uri.startsWith("mongodb")) {
      throw new Error(
        "Invalid MongoDB URI. Must start with mongodb:// or mongodb+srv://"
      );
    }
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      console.log("🔗 Connecting to MongoDB...");

      this.client = new MongoClient(this.config.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.collection = this.db.collection<MongoCarDocument>(
        this.config.collection
      );

      // Test connection
      await this.db.admin().ping();
      console.log(`✅ Connected to MongoDB database: ${this.config.database}`);

      // Create indexes for better performance
      await this.createIndexes();
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      throw error;
    }
  }

  /**
   * Create database indexes for better performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.collection) return;

    try {
      // Create compound index on Make, Model, Year for fast searching
      await this.collection.createIndex(
        {
          Make: 1,
          Model: 1,
          Year: 1,
        },
        { background: true }
      );

      // Create index on CarUrl for duplicate detection
      await this.collection.createIndex(
        {
          CarUrl: 1,
        },
        { unique: true, background: true }
      );

      // Create index on crawledAt for time-based queries
      await this.collection.createIndex(
        {
          crawledAt: -1,
        },
        { background: true }
      );

      // Create text index for searching
      await this.collection.createIndex(
        {
          Make: "text",
          Model: "text",
          "Body type": "text",
        },
        { background: true }
      );

      console.log("📊 Database indexes created successfully");
    } catch (error) {
      console.warn("⚠️  Warning: Some indexes may already exist:", error);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log("🔐 Disconnected from MongoDB");
    }
  }

  /**
   * Convert CarData to MongoDB document format
   */
  private transformCarData(
    carData: CarData,
    batchId?: string
  ): MongoCarDocument {
    const { ImageUrls, ...rest } = carData;

    return {
      ...rest,
      imageUrls: ImageUrls,
      crawledAt: new Date(),
      updatedAt: new Date(),
      source: "autotrader-crawler",
      ...(batchId && { batchId }),
    };
  }

  /**
   * Insert a single car document
   */
  async insertCar(
    carData: CarData,
    batchId?: string
  ): Promise<InsertOneResult | null> {
    if (!this.collection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    try {
      const document = this.transformCarData(carData, batchId);
      const result = await this.collection.insertOne(document);

      console.log(
        `✅ Inserted car: ${carData.Make} ${carData.Model} (${carData.Year})`
      );
      return result;
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error - car already exists
        console.log(
          `⚠️  Car already exists: ${carData.Make} ${carData.Model} - ${carData.CarUrl}`
        );
        return null;
      }

      console.error(
        `❌ Error inserting car ${carData.Make} ${carData.Model}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Insert multiple cars in batch
   */
  async insertCarsBatch(
    carsData: CarData[],
    batchId?: string
  ): Promise<InsertManyResult | null> {
    if (!this.collection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    if (carsData.length === 0) {
      console.log("⚠️  No cars to insert");
      return null;
    }

    try {
      const documents = carsData.map((car) =>
        this.transformCarData(car, batchId)
      );

      // Use ordered: false to continue inserting even if some fail
      const result = await this.collection.insertMany(documents, {
        ordered: false,
      });

      console.log(
        `✅ Batch inserted: ${result.insertedCount}/${carsData.length} cars`
      );

      if (result.insertedCount < carsData.length) {
        console.log(
          `⚠️  ${
            carsData.length - result.insertedCount
          } cars were duplicates or failed`
        );
      }

      return result;
    } catch (error: any) {
      // Handle partial success in bulk operations
      if (error.result && error.result.insertedCount > 0) {
        console.log(
          `✅ Partial success: ${error.result.insertedCount}/${carsData.length} cars inserted`
        );
        console.log(
          `⚠️  ${
            error.result.writeErrors?.length || 0
          } cars failed (likely duplicates)`
        );
        return error.result;
      }

      console.error("❌ Batch insert failed:", error);
      throw error;
    }
  }

  /**
   * Update an existing car or insert if not exists (upsert)
   */
  async upsertCar(carData: CarData, batchId?: string): Promise<void> {
    if (!this.collection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    try {
      const document = this.transformCarData(carData, batchId);

      await this.collection.updateOne(
        { CarUrl: carData.CarUrl },
        {
          $set: { ...document, updatedAt: new Date() },
          $setOnInsert: { crawledAt: new Date() },
        },
        { upsert: true }
      );

      console.log(
        `✅ Upserted car: ${carData.Make} ${carData.Model} (${carData.Year})`
      );
    } catch (error) {
      console.error(
        `❌ Error upserting car ${carData.Make} ${carData.Model}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.collection || !this.db) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    try {
      const totalCars = await this.collection.countDocuments();
      const recentCars = await this.collection.countDocuments({
        crawledAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      });

      // Get top makes
      const topMakes = await this.collection
        .aggregate([
          { $group: { _id: "$Make", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      const dbStats = await this.db.stats();

      return {
        totalCars,
        recentCars,
        topMakes,
        databaseSize:
          Math.round((dbStats.dataSize / (1024 * 1024 * 1024)) * 100) / 100, // GB
        collections: dbStats.collections,
      };
    } catch (error) {
      console.error("❌ Error getting database stats:", error);
      throw error;
    }
  }

  /**
   * Search cars by make, model, or other criteria
   */
  async searchCars(
    query: any,
    limit: number = 100
  ): Promise<MongoCarDocument[]> {
    if (!this.collection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    try {
      return await this.collection.find(query).limit(limit).toArray();
    } catch (error) {
      console.error("❌ Error searching cars:", error);
      throw error;
    }
  }

  /**
   * Delete cars older than specified days
   */
  async cleanupOldData(daysOld: number = 30): Promise<number> {
    if (!this.collection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await this.collection.deleteMany({
        crawledAt: { $lt: cutoffDate },
      });

      console.log(
        `🧹 Cleaned up ${result.deletedCount} cars older than ${daysOld} days`
      );
      return result.deletedCount;
    } catch (error) {
      console.error("❌ Error cleaning up old data:", error);
      throw error;
    }
  }

  /**
   * Check if database connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false;

      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}
