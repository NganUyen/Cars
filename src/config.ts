import * as dotenv from "dotenv";

dotenv.config();

export interface CrawlerConfig {
  // Browser settings
  headless: boolean;
  slowMo: number;
  timeout: number;

  // Crawling settings
  delayBetweenRequests: number;
  delayBetweenPages: number;
  maxRetries: number;

  // Output settings
  downloadImages: boolean;
  csvPath: string;
  imagesPath: string;

  // Search settings
  baseUrl: string;
  postcode: string;

  // MongoDB settings
  enableMongoDB: boolean;
  batchSize: number;
  autoPushToDB: boolean;
  enableImageUpload: boolean;
}

export interface MongoDBConfig {
  uri: string;
  database: string;
  collection: string;
}

export const defaultConfig: CrawlerConfig = {
  // Browser settings
  headless: false, // Set to true for production
  slowMo: 1000, // Slow down for debugging (0 for production)
  timeout: 30000, // 30 second timeout

  // Crawling settings
  delayBetweenRequests: 2000, // 2 seconds between car detail requests
  delayBetweenPages: 3000, // 3 seconds between search result pages
  maxRetries: 3, // Retry failed requests 3 times

  // Output settings
  downloadImages: true, // Download car images
  csvPath: "./data/extracted_cars.csv",
  imagesPath: "./images",

  // Search settings
  baseUrl: "https://www.autotrader.co.uk/car-search",
  postcode: "NW1+6XE", // Central London postcode

  // MongoDB settings
  enableMongoDB: process.env.AUTO_PUSH_TO_DB === "true",
  batchSize: parseInt(process.env.BATCH_SIZE || "100"),
  autoPushToDB: process.env.AUTO_PUSH_TO_DB === "true",
  enableImageUpload: process.env.ENABLE_IMAGE_UPLOAD === "true",
};

export const mongoConfig: MongoDBConfig = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  database: process.env.MONGODB_DATABASE || "autotrader_cars",
  collection: process.env.MONGODB_COLLECTION || "cars",
};
