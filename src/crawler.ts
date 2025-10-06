import { chromium, Browser, Page } from "playwright";
import { AutotraderScraper } from "./scraper";
import { ImageDownloader } from "./imageDownloader";
import { CSVExporter } from "./csvExporter";
import { MongoDBService } from "./mongoService";
import { CarData, CarListing, CrawlResult } from "./types";
import { defaultConfig, mongoConfig } from "./config";
import { v4 as uuidv4 } from "uuid";

export class AutotraderCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private scraper: AutotraderScraper | null = null;
  private imageDownloader: ImageDownloader;
  private csvExporter: CSVExporter;
  private mongoService: MongoDBService | null = null;
  private config = defaultConfig;

  constructor(enableMongoDB: boolean = defaultConfig.enableMongoDB) {
    this.imageDownloader = new ImageDownloader("./images");
    this.csvExporter = new CSVExporter("./data/extracted_cars.csv");

    if (enableMongoDB) {
      this.mongoService = new MongoDBService(mongoConfig);
    }
  }

  async initialize(): Promise<void> {
    console.log("Initializing browser...");
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
    });

    this.page = await this.browser.newPage();

    // Set user agent to avoid bot detection
    await this.page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });

    this.scraper = new AutotraderScraper(this.page);
    console.log("✅ Browser initialized successfully");

    // Initialize MongoDB if enabled
    if (this.mongoService) {
      try {
        await this.mongoService.connect();
        console.log("✅ MongoDB initialized successfully");
      } catch (error) {
        console.error("❌ MongoDB initialization failed:", error);
        console.log(
          "⚠️  Continuing without MongoDB - data will only be saved to CSV"
        );
        this.mongoService = null;
      }
    }
  }

  async crawlCars(
    searchUrl: string,
    maxPages: number = 3,
    downloadImages: boolean = true,
    useInfiniteScroll: boolean = true
  ): Promise<void> {
    if (!this.scraper) {
      throw new Error("Scraper not initialized. Call initialize() first.");
    }

    console.log(`Starting car crawl for: ${searchUrl}`);
    if (useInfiniteScroll) {
      console.log(`🔄 Using infinite scroll to get ALL available cars`);
      console.log(
        `📄 maxPages parameter (${maxPages}) ignored - will get all cars`
      );
    } else {
      console.log(`📄 Limited crawl mode: max ${maxPages} pages`);
    }
    console.log(`🖼️  Download images: ${downloadImages}`);

    try {
      // Get all car listings from search results
      let listings: CarListing[];

      if (useInfiniteScroll) {
        listings = await this.scraper.getAllCarListings(searchUrl, maxPages);
      } else {
        // Use limited crawling for testing
        const maxCars = maxPages * 25; // Approximate 25 cars per page
        listings = await this.scraper.getLimitedCarListings(searchUrl, maxCars);
      }

      console.log(`✅ Found total of ${listings.length} car listings`);

      if (listings.length === 0) {
        console.log("No listings found. Exiting.");
        return;
      }

      const allCarData: CarData[] = [];

      // Process each car listing
      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        console.log(
          `\nProcessing car ${i + 1}/${listings.length}: ${listing.title}`
        );

        try {
          // Extract detailed car information
          const carDetails = await this.scraper.extractCarDetails(listing.url);

          if (carDetails) {
            // Download images if requested
            if (downloadImages && carDetails.ImageUrls.length > 0) {
              console.log(
                `Downloading ${carDetails.ImageUrls.length} images for ${listing.title}`
              );
              await this.imageDownloader.downloadCarImages(
                carDetails.ImageUrls,
                listing.title
              );
            }

            allCarData.push(carDetails);

            // Save progress every 10 cars
            if (allCarData.length % 10 === 0) {
              console.log(
                `Saving progress... (${allCarData.length} cars processed)`
              );
              await this.csvExporter.appendToCsv(allCarData.slice(-10));
            }

            // Add delay between requests to be respectful
            await this.page!.waitForTimeout(2000);
          }
        } catch (error) {
          console.error(`Error processing car ${listing.title}:`, error);
          continue;
        }
      }

      // Save remaining data
      if (allCarData.length % 10 !== 0) {
        const remainingData = allCarData.slice(-(allCarData.length % 10));
        await this.csvExporter.appendToCsv(remainingData);
      }

      console.log(
        `\n✅ Crawling completed! Total cars processed: ${allCarData.length}`
      );
      console.log(`Data saved to: ./data/extracted_cars.csv`);
      if (downloadImages) {
        console.log(`Images saved to: ./images/`);
      }
    } catch (error) {
      console.error("Error during crawling:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log("🔐 Browser closed");
    }

    if (this.mongoService) {
      await this.mongoService.disconnect();
      console.log("🔐 MongoDB disconnected");
    }
  }

  /**
   * Enhanced crawling method with MongoDB integration
   */
  async crawlCarsWithMongoDB(
    searchUrl: string,
    maxPages: number = 3,
    downloadImages: boolean = true,
    useInfiniteScroll: boolean = true
  ): Promise<CrawlResult> {
    const batchId = `batch_${Date.now()}`;
    const startTime = new Date();
    let totalCrawled = 0;
    let successfulInserts = 0;
    let duplicates = 0;
    let errors = 0;

    if (!this.scraper) {
      throw new Error("Scraper not initialized. Call initialize() first.");
    }

    console.log(`🚗 Starting enhanced crawl with MongoDB integration`);
    console.log(`🔗 Search URL: ${searchUrl}`);
    console.log(`🏷️  Batch ID: ${batchId}`);
    console.log(`📊 MongoDB enabled: ${!!this.mongoService}`);

    if (useInfiniteScroll) {
      console.log(`🔄 Using infinite scroll to get ALL available cars`);
    }

    try {
      // Get all car listings
      let listings: CarListing[];
      if (useInfiniteScroll) {
        listings = await this.scraper.getAllCarListings(searchUrl, maxPages);
      } else {
        const maxCars = maxPages * 25;
        listings = await this.scraper.getLimitedCarListings(searchUrl, maxCars);
      }

      console.log(`✅ Found ${listings.length} car listings`);
      if (listings.length === 0) {
        console.log("⚠️  No listings found. Exiting.");
        return this.createCrawlResult(
          batchId,
          startTime,
          totalCrawled,
          successfulInserts,
          duplicates,
          errors
        );
      }

      const batchSize = this.config.batchSize;
      const allCarData: CarData[] = [];
      let currentBatch: CarData[] = [];

      // Process each car listing
      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        console.log(
          `\n🚗 Processing car ${i + 1}/${listings.length}: ${listing.title}`
        );
        totalCrawled++;

        try {
          // Extract detailed car information
          const carDetails = await this.scraper.extractCarDetails(listing.url);

          if (carDetails) {
            // Download images if requested
            if (downloadImages && carDetails.ImageUrls.length > 0) {
              console.log(
                `🖼️  Downloading ${carDetails.ImageUrls.length} images`
              );
              await this.imageDownloader.downloadCarImages(
                carDetails.ImageUrls,
                listing.title
              );
            }

            allCarData.push(carDetails);
            currentBatch.push(carDetails);

            // Process batch when it reaches the configured size
            if (currentBatch.length >= batchSize) {
              const batchResult = await this.processBatch(
                currentBatch,
                batchId
              );
              successfulInserts += batchResult.successful;
              duplicates += batchResult.duplicates;
              errors += batchResult.errors;

              currentBatch = []; // Reset batch

              // Add delay between batches
              await this.page!.waitForTimeout(this.config.delayBetweenRequests);
            }

            // Save CSV progress every 10 cars
            if (allCarData.length % 10 === 0) {
              console.log(
                `💾 Saving CSV progress... (${allCarData.length} cars processed)`
              );
              await this.csvExporter.appendToCsv(allCarData.slice(-10));
            }
          }
        } catch (error) {
          console.error(`❌ Error processing car ${listing.title}:`, error);
          errors++;
          continue;
        }

        // Add delay between requests
        await this.page!.waitForTimeout(this.config.delayBetweenRequests);
      }

      // Process remaining batch
      if (currentBatch.length > 0) {
        const batchResult = await this.processBatch(currentBatch, batchId);
        successfulInserts += batchResult.successful;
        duplicates += batchResult.duplicates;
        errors += batchResult.errors;
      }

      // Save remaining CSV data
      if (allCarData.length % 10 !== 0) {
        const remainingData = allCarData.slice(-(allCarData.length % 10));
        await this.csvExporter.appendToCsv(remainingData);
      }

      const endTime = new Date();
      const result = this.createCrawlResult(
        batchId,
        startTime,
        totalCrawled,
        successfulInserts,
        duplicates,
        errors
      );

      // Print summary
      console.log(`\n✨ Crawling completed! Summary:`);
      console.log(`🔢 Total cars processed: ${totalCrawled}`);
      console.log(`✅ Successfully inserted to DB: ${successfulInserts}`);
      console.log(`🔄 Duplicates skipped: ${duplicates}`);
      console.log(`❌ Errors encountered: ${errors}`);
      console.log(
        `⏱️  Duration: ${(result.duration / 1000 / 60).toFixed(2)} minutes`
      );
      console.log(`💾 CSV saved to: ${this.config.csvPath}`);

      if (this.mongoService) {
        const stats = await this.mongoService.getStats();
        console.log(`📊 Database now contains ${stats.totalCars} total cars`);
      }

      return result;
    } catch (error) {
      console.error("❌ Error during enhanced crawling:", error);
      errors++;
      throw error;
    }
  }

  /**
   * Process a batch of cars - save to both CSV and MongoDB
   */
  private async processBatch(
    batch: CarData[],
    batchId: string
  ): Promise<{ successful: number; duplicates: number; errors: number }> {
    let successful = 0;
    let duplicates = 0;
    let errors = 0;

    console.log(`📦 Processing batch of ${batch.length} cars...`);

    // Save to MongoDB if available
    if (this.mongoService) {
      try {
        const result = await this.mongoService.insertCarsBatch(batch, batchId);
        if (result) {
          successful = result.insertedCount;
          const failed = batch.length - successful;
          duplicates = failed; // Assume failures are mostly duplicates

          console.log(
            `📊 MongoDB: ${successful} inserted, ${duplicates} duplicates/errors`
          );
        }
      } catch (error) {
        console.error("❌ MongoDB batch insert failed:", error);
        errors = batch.length;
      }
    } else {
      console.log("⚠️  MongoDB not available - saving to CSV only");
      successful = batch.length; // CSV assumed to work
    }

    return { successful, duplicates, errors };
  }

  /**
   * Create crawl result summary
   */
  private createCrawlResult(
    batchId: string,
    startTime: Date,
    totalCrawled: number,
    successfulInserts: number,
    duplicates: number,
    errors: number
  ): CrawlResult {
    const endTime = new Date();
    return {
      totalCrawled,
      successfulInserts,
      duplicates,
      errors,
      batchId,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  }

  // Crawl specific makes with infinite scroll (gets ALL cars)
  async crawlByMake(
    make: string,
    maxPages: number = 3,
    useInfiniteScroll: boolean = true
  ): Promise<CrawlResult> {
    const baseUrl =
      "https://www.autotrader.co.uk/car-search?channel=cars&postcode=NW1+6XE";
    const searchUrl = `${baseUrl}&make=${encodeURIComponent(make)}`;

    if (this.mongoService || this.config.enableMongoDB) {
      return await this.crawlCarsWithMongoDB(
        searchUrl,
        maxPages,
        true,
        useInfiniteScroll
      );
    } else {
      await this.crawlCars(searchUrl, maxPages, true, useInfiniteScroll);
      return this.createCrawlResult(
        `legacy_${Date.now()}`,
        new Date(),
        0,
        0,
        0,
        0
      );
    }
  }

  // Crawl all cars with infinite scroll (gets ALL cars)
  async crawlAllCars(
    maxPages: number = 3,
    useInfiniteScroll: boolean = true
  ): Promise<CrawlResult> {
    const searchUrl =
      "https://www.autotrader.co.uk/car-search?channel=cars&postcode=NW1+6XE&make=";

    if (this.mongoService || this.config.enableMongoDB) {
      return await this.crawlCarsWithMongoDB(
        searchUrl,
        maxPages,
        true,
        useInfiniteScroll
      );
    } else {
      await this.crawlCars(searchUrl, maxPages, true, useInfiniteScroll);
      return this.createCrawlResult(
        `legacy_${Date.now()}`,
        new Date(),
        0,
        0,
        0,
        0
      );
    }
  }

  // Quick test method with limited cars (for testing) - MongoDB integrated
  async crawlQuickTest(
    make: string = "BMW",
    maxCars: number = 10
  ): Promise<void> {
    console.log(
      `🧪 Quick test crawl with MongoDB: ${make} (max ${maxCars} cars)`
    );
    const baseUrl =
      "https://www.autotrader.co.uk/car-search?channel=cars&postcode=NW1+6XE";
    const searchUrl = `${baseUrl}&make=${encodeURIComponent(make)}`;

    // Use MongoDB-integrated crawling for tests
    const maxPages = Math.ceil(maxCars / 25); // Approximate pages needed
    await this.crawlCarsWithMongoDB(searchUrl, maxPages, true, false); // useInfiniteScroll = false
  }

  // Crawl cars by specific year range
  async crawlByYear(
    yearFrom: number,
    yearTo: number,
    make: string = "",
    maxPages: number = 3,
    useInfiniteScroll: boolean = true
  ): Promise<void> {
    const baseUrl =
      "https://www.autotrader.co.uk/car-search?channel=cars&postcode=NW1%206XE&sort=relevance";
    let searchUrl = `${baseUrl}&year-from=${yearFrom}&year-to=${yearTo}`;

    if (make) {
      searchUrl += `&make=${encodeURIComponent(make)}`;
    }

    console.log(
      `🗓️ Crawling cars from year ${yearFrom} to ${yearTo}${
        make ? ` (${make})` : " (all makes)"
      }`
    );
    await this.crawlCars(searchUrl, maxPages, true, useInfiniteScroll);
  }

  // Crawl cars year by year from 2000 to 2025 - ALL DATA IN SINGLE CSV
  async crawlByYearRange(
    startYear: number = 2000,
    endYear: number = 2025,
    make: string = "",
    useInfiniteScroll: boolean = true
  ): Promise<void> {
    console.log(
      `📅 Starting year-by-year crawl from ${startYear} to ${endYear}`
    );
    console.log(`🚗 Make filter: ${make || "All makes"}`);
    console.log(`🔄 Using infinite scroll: ${useInfiniteScroll}`);

    // Create a single CSV file for ALL years combined
    const combinedFileName = `./data/cars_${startYear}_to_${endYear}${
      make ? `_${make}` : ""
    }_combined.csv`;
    this.csvExporter = new CSVExporter(combinedFileName);
    console.log(`📄 All data will be saved to: ${combinedFileName}`);

    let totalCarsFound = 0;

    for (let year = startYear; year <= endYear; year++) {
      console.log(`\n🗓️ ===== CRAWLING YEAR ${year} =====`);

      try {
        // Keep using the same CSV exporter (same file) for all years
        await this.crawlByYear(year, year, make, 3, useInfiniteScroll);

        console.log(`✅ Completed crawling for year ${year}`);

        // Show running total (approximate - would need to track exact count)
        console.log(`📊 Year ${year} data added to combined CSV file`);
      } catch (error) {
        console.error(`❌ Error crawling year ${year}:`, error);
        console.log(`⏭️ Continuing to next year...`);
      }

      // Add a delay between years to be respectful to the server
      console.log("⏳ Waiting 30 seconds before next year...");
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }

    console.log(
      `\n🎉 Completed year-by-year crawl from ${startYear} to ${endYear}!`
    );
    console.log(`📄 All data combined in: ${combinedFileName}`);
  }

  // Crawl cars year by year with custom CSV filename
  async crawlByYearRangeToFile(
    fileName: string,
    startYear: number = 2000,
    endYear: number = 2025,
    make: string = "",
    useInfiniteScroll: boolean = true
  ): Promise<void> {
    console.log(
      `📅 Starting year-by-year crawl from ${startYear} to ${endYear}`
    );
    console.log(`🚗 Make filter: ${make || "All makes"}`);
    console.log(`🔄 Using infinite scroll: ${useInfiniteScroll}`);

    // Use custom filename
    const customFileName = fileName.endsWith(".csv")
      ? fileName
      : `${fileName}.csv`;
    const fullPath = `./data/${customFileName}`;
    this.csvExporter = new CSVExporter(fullPath);
    console.log(`📄 All data will be saved to: ${fullPath}`);

    for (let year = startYear; year <= endYear; year++) {
      console.log(`\n🗓️ ===== CRAWLING YEAR ${year} =====`);

      try {
        await this.crawlByYear(year, year, make, 3, useInfiniteScroll);
        console.log(`✅ Completed crawling for year ${year}`);
        console.log(`📊 Year ${year} data added to ${customFileName}`);
      } catch (error) {
        console.error(`❌ Error crawling year ${year}:`, error);
        console.log(`⏭️ Continuing to next year...`);
      }

      // Add a delay between years to be respectful to the server
      console.log("⏳ Waiting 30 seconds before next year...");
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }

    console.log(
      `\n🎉 Completed year-by-year crawl from ${startYear} to ${endYear}!`
    );
    console.log(`📄 All data combined in: ${fullPath}`);
  }
}
