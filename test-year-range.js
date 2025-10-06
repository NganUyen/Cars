// Quick test to show the year-range functionality structure
console.log("📅 Year Range Crawling Test Structure");
console.log("=====================================\n");

const startYear = 2000;
const endYear = 2025;

console.log(`Starting year: ${startYear}`);
console.log(`Ending year: ${endYear}`);
console.log(`Total years to process: ${endYear - startYear + 1}`);
console.log();

for (let year = startYear; year <= endYear; year++) {
  const url = `https://www.autotrader.co.uk/car-search?channel=cars&postcode=NW1%206XE&sort=relevance&year-from=${year}&year-to=${year}`;
  const fileName = `./data/cars_${year}.csv`;

  console.log(`Year ${year}:`);
  console.log(`  URL: ${url}`);
  console.log(`  Output: ${fileName}`);

  if (year === 2003) {
    console.log("  ... (showing first few examples)");
    break;
  }
}

console.log("\n🔄 Each year will be processed sequentially");
console.log("💾 Each year gets its own CSV file to prevent memory issues");
console.log("⏱️ 30-second delay between years to be respectful to the server");
console.log("📊 This will create 26 separate CSV files (2000-2025)");
