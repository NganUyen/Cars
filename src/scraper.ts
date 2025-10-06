import { Page } from "playwright";
import { CarListing } from "./types";

export class AutotraderScraper {
  private page: Page;
  private baseUrl = "https://www.autotrader.co.uk";

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get all car listings from a search results page with infinite scroll
   */
  async getCarListings(searchUrl: string): Promise<CarListing[]> {
    console.log(`Navigating to: ${searchUrl}`);
    await this.page.goto(searchUrl, { waitUntil: "networkidle" });

    // Wait for search results to load
    await this.page.waitForSelector('[data-testid="search-listing-title"]', {
      timeout: 10000,
    });

    let allListings: CarListing[] = [];
    let previousCount = 0;
    let noNewCarsCount = 0;
    const maxNoNewCarsAttempts = 5; // Reduced to prevent infinite loops
    let totalScrollAttempts = 0;
    const maxTotalScrollAttempts = 2000; // For 455k+ results
    let lastProgressReport = 0;
    const startTime = Date.now();

    console.log("🔄 Starting infinite scroll to load ALL cars...");
    console.log("📊 Expected: 455,700+ results - this may take hours!");
    console.log("⏱️  Estimated time: 3-8 hours for complete dataset");

    while (
      noNewCarsCount < maxNoNewCarsAttempts &&
      totalScrollAttempts < maxTotalScrollAttempts
    ) {
      totalScrollAttempts++;

      // Progress reporting every 100 attempts
      if (totalScrollAttempts % 100 === 0) {
        console.log(
          `🔄 Scroll attempt ${totalScrollAttempts}/${maxTotalScrollAttempts} - Found ${allListings.length} cars so far`
        );
      }

      // Safety check for very large datasets - if we've found a substantial number,
      // increase our patience for the final stretch
      if (allListings.length > 400000 && noNewCarsCount >= 5) {
        console.log(
          "🎯 Large dataset detected - extending patience for final results..."
        );
        await this.page.waitForTimeout(8000); // Longer wait for massive datasets
      }
      // Get current listings
      const currentListings = await this.page.evaluate(() => {
        const linkElements = document.querySelectorAll(
          '[data-testid="search-listing-title"]'
        );
        const results: CarListing[] = [];

        linkElements.forEach((link: Element) => {
          const href = link.getAttribute("href");
          const titleElement = link.textContent?.trim();

          if (href && titleElement) {
            // Extract just the car name (before the span with price info)
            const title = titleElement.split(",")[0].trim();

            // Find price from the span within the link
            const spanElement = link.querySelector("span");
            const priceText = spanElement?.textContent || "";
            const priceMatch = priceText.match(/£[\d,]+/);
            const price = priceMatch ? priceMatch[0] : "Price not found";

            results.push({
              title,
              price,
              url: href.startsWith("http")
                ? href
                : `https://www.autotrader.co.uk${href}`,
            });
          }
        });

        return results;
      });

      // Progress reporting and checkpoint system every 1000 cars
      if (currentListings.length - lastProgressReport >= 1000) {
        const percentage = ((currentListings.length / 455700) * 100).toFixed(1);
        const estimatedRemaining = Math.round(
          (455700 - currentListings.length) /
            (currentListings.length / totalScrollAttempts)
        );

        console.log(
          `📊 MILESTONE: ${currentListings.length} cars loaded (${percentage}% of expected 455,700)`
        );
        console.log(
          `⏱️  Estimated remaining attempts: ${estimatedRemaining} (based on current rate)`
        );

        // Time estimation
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const rate = currentListings.length / elapsedMinutes; // cars per minute
        const remainingCars = 455700 - currentListings.length;
        const estimatedRemainingMinutes = remainingCars / rate;

        console.log(
          `🕐 Elapsed: ${elapsedMinutes.toFixed(
            1
          )} minutes | Rate: ${rate.toFixed(0)} cars/min`
        );
        console.log(
          `⏰ ETA: ${estimatedRemainingMinutes.toFixed(0)} minutes remaining`
        );
        console.log(
          `🔄 Scroll attempts: ${totalScrollAttempts}/${maxTotalScrollAttempts}`
        );

        lastProgressReport = currentListings.length;
      }

      // Check if we got new cars
      if (currentListings.length > previousCount) {
        allListings = currentListings;
        const newCars = currentListings.length - previousCount;
        previousCount = currentListings.length;
        noNewCarsCount = 0; // Reset the counter

        if (newCars > 0) {
          console.log(
            `✅ Found ${newCars} new cars (total: ${currentListings.length})`
          );
        }
      } else {
        noNewCarsCount++;
        console.log(
          `⏳ No new cars loaded (attempt ${noNewCarsCount}/${maxNoNewCarsAttempts})`
        );
      }

      // Simple scroll strategy
      await this.page.evaluate(() => {
        // Scroll to bottom to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight);
      });

      await this.page.waitForTimeout(2000);

      // Enhanced button detection for AutoTrader
      try {
        // More comprehensive selectors for AutoTrader
        const loadMoreSelectors = [
          '[data-testid="load-more-button"]',
          '[data-gui*="load-more"]',
          '[data-testid*="load-more"]',
          '[aria-label*="load more" i]',
          '[aria-label*="show more" i]',
          'button:has-text("Load more")',
          'button:has-text("Show more")',
          'button:has-text("View more")',
          'button:has-text("More results")',
          ".load-more-button",
          ".load-more",
          '[class*="load-more"]',
          '[class*="show-more"]',
        ];

        let loadMoreButton = null;
        for (const selector of loadMoreSelectors) {
          try {
            const buttons = await this.page.$$(selector);
            for (const button of buttons) {
              if (await button.isVisible()) {
                loadMoreButton = button;
                break;
              }
            }
            if (loadMoreButton) break;
          } catch (e) {
            continue;
          }
        }

        if (loadMoreButton) {
          console.log('🔄 Found "Load More" button, clicking...');
          await loadMoreButton.scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(1000);
          await loadMoreButton.click();
          await this.page.waitForTimeout(3000); // Longer wait for loading
          noNewCarsCount = 0; // Reset counter since we clicked load more
          console.log(
            "✅ Load More button clicked, waiting for new content..."
          );
          continue;
        }
      } catch (error) {
        console.log("⚠️ Error with load more button:", error);
      }

      // Enhanced pagination detection for AutoTrader
      try {
        const nextSelectors = [
          '[aria-label="Next page"]',
          '[aria-label="Next"]',
          '[data-testid="pagination-next"]',
          '[data-gui*="pagination-next"]',
          '[data-testid*="next"]',
          ".pagination-next",
          ".pager-next",
          'a[href*="page="]:has-text("Next")',
          'button:has-text("Next")',
          'a:has-text("Next")',
          '[class*="next-page"]',
          '[class*="pagination"] a:last-child',
          'nav [aria-label="pagination"] a:last-child',
        ];

        let nextButton = null;
        for (const selector of nextSelectors) {
          try {
            const buttons = await this.page.$$(selector);
            for (const button of buttons) {
              if (await button.isVisible()) {
                const text = await button.textContent();
                if (
                  text &&
                  (text.toLowerCase().includes("next") ||
                    text.includes("›") ||
                    text.includes("→"))
                ) {
                  nextButton = button;
                  break;
                }
              }
            }
            if (nextButton) break;
          } catch (e) {
            continue;
          }
        }

        if (nextButton) {
          console.log('➡️ Found pagination "Next" button, clicking...');
          await nextButton.scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(1000);
          await nextButton.click();
          await this.page.waitForTimeout(4000); // Longer wait for page load
          noNewCarsCount = 0; // Reset counter since we moved to next page
          console.log("✅ Next page loaded");
          continue;
        }
      } catch (error) {
        console.log("⚠️ Error with pagination:", error);
      }

      // Simple scroll to load more content
      console.log("📜 Scrolling to load more cars...");

      // Single scroll to bottom with reasonable wait time
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await this.page.waitForTimeout(2000);

      // Check if we're at the bottom of the page
      const isAtBottom = await this.page.evaluate(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        // Check if we're within 100px of the bottom
        return scrollTop + clientHeight >= scrollHeight - 100;
      });

      if (isAtBottom) {
        console.log("📍 Reached the bottom of the page");
      }

      // Enhanced completion detection
      if (noNewCarsCount >= 8) {
        // If we're close to the limit
        console.log("🔍 Running final completion checks...");

        // Check for "end of results" indicators
        const endIndicators = await this.page.evaluate(() => {
          const indicators = [
            "No more results",
            "End of results",
            "All results shown",
            "No additional results",
            "You have reached the end",
            "That's all",
            "No more cars",
          ];

          const pageText = document.body.innerText.toLowerCase();
          return indicators.some((indicator) =>
            pageText.includes(indicator.toLowerCase())
          );
        });

        if (endIndicators) {
          console.log("🏁 Found end-of-results indicator, stopping crawl");
          break;
        }

        // Simple completion check - if we've tried enough times and found no new cars, stop
        console.log(`📊 Current listing count: ${currentListings.length} cars`);
        console.log("🔍 No more new cars detected after multiple attempts");
        console.log("✅ Crawl completed - reached end of available results");
        break;
      }
    }

    // Remove duplicates based on URL
    const uniqueListings = allListings.filter(
      (listing, index, self) =>
        index === self.findIndex((l) => l.url === listing.url)
    );

    console.log(
      `🏁 Finished loading cars. Total unique cars found: ${uniqueListings.length}`
    );
    return uniqueListings;
  }

  /**
   * Get all car listings with infinite scroll (replaces multiple page crawling)
   */
  async getAllCarListings(
    searchUrl: string,
    maxPages: number = 5
  ): Promise<CarListing[]> {
    // With infinite scroll, we ignore maxPages parameter and get all available cars
    console.log(
      `🚀 Getting ALL car listings with infinite scroll from: ${searchUrl}`
    );
    console.log(
      `ℹ️  Note: maxPages parameter (${maxPages}) is ignored with infinite scroll - we'll get all available cars`
    );

    return await this.getCarListings(searchUrl);
  }

  /**
   * Get limited car listings for testing purposes
   */
  async getLimitedCarListings(
    searchUrl: string,
    maxCars: number = 50
  ): Promise<CarListing[]> {
    console.log(
      `🧪 Getting limited car listings (max ${maxCars} cars) from: ${searchUrl}`
    );
    await this.page.goto(searchUrl, { waitUntil: "networkidle" });

    // Wait for search results to load
    await this.page.waitForSelector('[data-testid="search-listing-title"]', {
      timeout: 10000,
    });

    let allListings: CarListing[] = [];
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    while (allListings.length < maxCars && scrollAttempts < maxScrollAttempts) {
      // Get current listings
      const currentListings = await this.page.evaluate(() => {
        const linkElements = document.querySelectorAll(
          '[data-testid="search-listing-title"]'
        );
        const results: CarListing[] = [];

        linkElements.forEach((link: Element) => {
          const href = link.getAttribute("href");
          const titleElement = link.textContent?.trim();

          if (href && titleElement) {
            const title = titleElement.split(",")[0].trim();
            const spanElement = link.querySelector("span");
            const priceText = spanElement?.textContent || "";
            const priceMatch = priceText.match(/£[\d,]+/);
            const price = priceMatch ? priceMatch[0] : "Price not found";

            results.push({
              title,
              price,
              url: href.startsWith("http")
                ? href
                : `https://www.autotrader.co.uk${href}`,
            });
          }
        });

        return results;
      });

      console.log(`📊 Loaded ${currentListings.length} cars so far...`);

      if (currentListings.length >= maxCars) {
        allListings = currentListings.slice(0, maxCars);
        break;
      }

      allListings = currentListings;

      // Scroll to load more
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      await this.page.waitForTimeout(2000);
      scrollAttempts++;
    }

    // Remove duplicates
    const uniqueListings = allListings.filter(
      (listing, index, self) =>
        index === self.findIndex((l) => l.url === listing.url)
    );

    console.log(`🏁 Got ${uniqueListings.length} cars (limited to ${maxCars})`);
    return uniqueListings.slice(0, maxCars);
  }

  /**
   * Expand a specification section by clicking its accordion button
   */
  private async expandSpecSection(sectionName: string): Promise<boolean> {
    try {
      console.log(`🔽 Expanding ${sectionName} section...`);

      // Look for the accordion button for this section
      const button = await this.page.$(`button:has-text("${sectionName}")`);
      if (!button) {
        console.log(`⚠️  Could not find ${sectionName} section button`);
        return false;
      }

      // Check if section is already expanded
      const isExpanded = await button.getAttribute("aria-expanded");
      if (isExpanded === "true") {
        console.log(`✅ ${sectionName} section already expanded`);
        return true;
      }

      // Click to expand
      await button.click();
      await this.page.waitForTimeout(1500);

      console.log(`✅ ${sectionName} section expanded`);
      return true;
    } catch (error) {
      console.log(`❌ Error expanding ${sectionName} section:`, error);
      return false;
    }
  }

  /**
   * Extract detailed car information from a car detail page with technical specs
   */
  async extractCarDetails(carUrl: string): Promise<any> {
    try {
      console.log(`🔍 Extracting details from: ${carUrl}`);
      await this.page.goto(carUrl, { waitUntil: "networkidle" });

      // Wait for the page to load
      await this.page.waitForSelector('[data-testid="advert-title"]', {
        timeout: 10000,
      });

      // Try to click "View spec and features" button to get detailed specs
      let hasDetailedSpecs = false;
      try {
        console.log('🔧 Looking for "View spec and features" button...');
        const specButton = await this.page.$(
          '[data-testid="tech-spec-link"], [data-gui="tech-spec-link"]'
        );
        if (specButton) {
          console.log("✅ Found spec button, clicking...");
          await specButton.click();
          await this.page.waitForTimeout(3000); // Wait for page to load
          hasDetailedSpecs = true;
          console.log("📊 Technical specifications page loaded");
        } else {
          console.log("⚠️  Spec button not found, using basic specs only");
        }
      } catch (error) {
        console.log("⚠️  Could not click spec button:", error);
      }

      const carDetails = await this.page.evaluate(() => {
        const result: any = {
          ImageUrls: [],
        };

        // Extract car name
        const titleElement = document.querySelector(
          '[data-testid="advert-title"]'
        );
        if (titleElement) {
          const fullTitle = titleElement.textContent?.trim() || "";
          // Try to extract make and model from title
          const titleParts = fullTitle.split(" ");
          result.Make = titleParts[0] || "";
          result.Model = titleParts.slice(1).join(" ") || "";
        }

        // Extract price
        const priceElement = document.querySelector(
          '[data-testid="advert-price"]'
        );
        if (priceElement) {
          result.MSRP = priceElement.textContent?.trim() || "";
        }

        // Extract key specs from the specifications section
        const keySpecsSection = document.querySelector(
          '[data-gui="key-specs-section"]'
        );
        if (keySpecsSection) {
          const specItems = keySpecsSection.querySelectorAll(".sc-6lr8b9-2");

          specItems.forEach((item: Element) => {
            const termElement = item.querySelector(".term_details");
            const valueElement = item.querySelector(".value_details");

            if (termElement && valueElement) {
              const term = termElement.textContent?.trim();
              let value = valueElement.textContent?.trim();

              // Clean up value by removing button text and extra elements
              const mainValue =
                valueElement.querySelector("div") ||
                valueElement.querySelector("span:not(.sc-efqqw2-1)");
              if (mainValue && mainValue.textContent) {
                value = mainValue.textContent.trim();
              }

              switch (term) {
                case "Mileage":
                  result.Mileage = value;
                  break;
                case "Fuel type":
                  result["Engine Fuel Type"] = value;
                  break;
                case "Body type":
                  result["Body type"] = value;
                  result["Vehicle Style"] = value;
                  break;
                case "Engine":
                  result.Engine = value;
                  break;
                case "Gearbox":
                  result.Gearbox = value;
                  result["Transmission Type"] = value;
                  break;
                case "Doors":
                  result.Doors = value;
                  result["Number of Doors"] = value;
                  break;
                case "Seats":
                  result.Seats = value;
                  break;
                case "Emission class":
                  result["Emission class"] = value;
                  break;
                case "Body colour":
                  result["Body colour"] = value;
                  break;
                case "Manufacturer warranty":
                  result["Manufacturer warranty"] = value;
                  break;
              }
            }
          });
        }

        return result;
      });

      // Extract detailed technical specifications if available
      if (hasDetailedSpecs) {
        console.log("📋 Extracting detailed technical specifications...");

        try {
          // Expand Performance section
          await this.expandSpecSection("Performance");
          // Expand Size and dimensions section
          await this.expandSpecSection("Size and dimensions");

          // Wait for sections to expand
          await this.page.waitForTimeout(2000);

          // Extract detailed specs
          const detailedSpecs = await this.page.evaluate(() => {
            const specs: any = {};

            // Extract Performance specifications
            const performanceList = document.querySelector(
              '[data-testid="Performance-list"]'
            );
            if (performanceList) {
              const performanceItems = performanceList.querySelectorAll("li");
              performanceItems.forEach((item: Element) => {
                const label = item
                  .querySelector(".sc-1hlguh0-3")
                  ?.textContent?.trim();
                const value = item
                  .querySelector(".sc-1hlguh0-4")
                  ?.textContent?.trim();
                if (label && value) {
                  specs[label] = value;
                }
              });
            }

            // Extract Size and dimensions specifications
            const sizeList = document.querySelector(
              '[data-testid="Size and dimensions-list"]'
            );
            if (sizeList) {
              const sizeItems = sizeList.querySelectorAll("li");
              sizeItems.forEach((item: Element) => {
                const label = item
                  .querySelector(".sc-1hlguh0-3")
                  ?.textContent?.trim();
                const value = item
                  .querySelector(".sc-1hlguh0-4")
                  ?.textContent?.trim();
                if (label && value) {
                  specs[label] = value;
                }
              });
            }

            return specs;
          });

          // Merge detailed specs with basic car details
          Object.assign(carDetails, detailedSpecs);
          console.log(
            `✅ Extracted ${
              Object.keys(detailedSpecs).length
            } detailed specifications`
          );
        } catch (error) {
          console.log("⚠️  Error extracting detailed specs:", error);
        }
      }

      // Re-evaluate to get images (in case we're on a different page now)
      const imageUrls = await this.page.evaluate(() => {
        const imageUrls: string[] = [];

        // Extract images from gallery
        const imageContainers = document.querySelectorAll(
          '[data-testid^="gallery-grid-image-container"], .image-gallery-item'
        );
        imageContainers.forEach((container: Element) => {
          const img = container.querySelector("img");
          if (img && img.src) {
            // Get the highest resolution source if available
            const picture = container.querySelector("picture");
            if (picture) {
              const sources = picture.querySelectorAll("source");
              if (sources.length > 0) {
                const srcset = sources[0].getAttribute("srcset");
                if (srcset) {
                  imageUrls.push(srcset);
                  return;
                }
              }
            }
            imageUrls.push(img.src);
          }
        });

        // Remove duplicates from image URLs
        return [...new Set(imageUrls)];
      });

      // Add images to car details
      carDetails.ImageUrls = imageUrls;

      // Set default values for missing fields
      const defaultedDetails = {
        Make: "",
        Model: "",
        Year: "",
        "Engine Fuel Type": "",
        "Engine HP": "",
        "Engine Cylinders": "",
        "Transmission Type": "",
        Driven_Wheels: "",
        "Number of Doors": "",
        "Market Category": "",
        "Vehicle Size": "",
        "Vehicle Style": "",
        "highway MPG": "",
        "city mpg": "",
        Popularity: "",
        MSRP: "",
        Mileage: "",
        "Body type": "",
        Engine: "",
        Gearbox: "",
        Doors: "",
        Seats: "",
        "Emission class": "",
        "Body colour": "",
        "Manufacturer warranty": "",
        CarUrl: carUrl,
        ImageUrls: [],
        // Performance specifications defaults
        "0-62mph": "",
        "Top speed": "",
        Cylinders: "",
        Valves: "",
        "Engine power": "",
        "Engine torque": "",
        "Miles per gallon": "",
        // Size and dimensions defaults
        Height: "",
        Length: "",
        Width: "",
        Wheelbase: "",
        "Fuel tank capacity": "",
        "Boot space (seats down)": "",
        "Boot space (seats up)": "",
        "Minimum kerb weight": "",
        ...carDetails,
      };

      return defaultedDetails;
    } catch (error) {
      console.error(`Error extracting car details from ${carUrl}:`, error);
      return null;
    }
  }
}
