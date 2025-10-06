import * as fs from "fs";
import * as path from "path";
import { createObjectCsvWriter } from "csv-writer";
import { CarData } from "./types";

export class CSVExporter {
  private csvPath: string;
  private writer: any;

  constructor(csvPath: string = "./data/extracted_cars.csv") {
    this.csvPath = csvPath;
    this.ensureDirectoryExists(path.dirname(csvPath));
    this.initializeWriter();
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private initializeWriter(): void {
    this.writer = createObjectCsvWriter({
      path: this.csvPath,
      header: [
        { id: "Make", title: "Make" },
        { id: "Model", title: "Model" },
        { id: "Year", title: "Year" },
        { id: "Engine Fuel Type", title: "Engine Fuel Type" },
        { id: "Engine HP", title: "Engine HP" },
        { id: "Engine Cylinders", title: "Engine Cylinders" },
        { id: "Transmission Type", title: "Transmission Type" },
        { id: "Driven_Wheels", title: "Driven_Wheels" },
        { id: "Number of Doors", title: "Number of Doors" },
        { id: "Market Category", title: "Market Category" },
        { id: "Vehicle Size", title: "Vehicle Size" },
        { id: "Vehicle Style", title: "Vehicle Style" },
        { id: "highway MPG", title: "highway MPG" },
        { id: "city mpg", title: "city mpg" },
        { id: "Popularity", title: "Popularity" },
        { id: "MSRP", title: "MSRP" },
        { id: "Mileage", title: "Mileage" },
        { id: "Body type", title: "Body type" },
        { id: "Engine", title: "Engine" },
        { id: "Gearbox", title: "Gearbox" },
        { id: "Doors", title: "Doors" },
        { id: "Seats", title: "Seats" },
        { id: "Emission class", title: "Emission class" },
        { id: "Body colour", title: "Body colour" },
        { id: "Manufacturer warranty", title: "Manufacturer warranty" },
        { id: "CarUrl", title: "CarUrl" },
        { id: "ImageUrls", title: "ImageUrls" },
        // Performance specifications
        { id: "0-62mph", title: "0-62mph" },
        { id: "Top speed", title: "Top speed" },
        { id: "Cylinders", title: "Cylinders" },
        { id: "Valves", title: "Valves" },
        { id: "Engine power", title: "Engine power" },
        { id: "Engine torque", title: "Engine torque" },
        { id: "Miles per gallon", title: "Miles per gallon" },
        // Size and dimensions
        { id: "Height", title: "Height" },
        { id: "Length", title: "Length" },
        { id: "Width", title: "Width" },
        { id: "Wheelbase", title: "Wheelbase" },
        { id: "Fuel tank capacity", title: "Fuel tank capacity" },
        { id: "Boot space (seats down)", title: "Boot space (seats down)" },
        { id: "Boot space (seats up)", title: "Boot space (seats up)" },
        { id: "Minimum kerb weight", title: "Minimum kerb weight" },
      ],
    });
  }

  async exportToCsv(carDataArray: CarData[]): Promise<void> {
    try {
      // Convert ImageUrls array to string for CSV
      const processedData = carDataArray.map((car) => ({
        ...car,
        ImageUrls: car.ImageUrls.join("; "),
      }));

      await this.writer.writeRecords(processedData);
      console.log(
        `Successfully exported ${carDataArray.length} cars to ${this.csvPath}`
      );
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      throw error;
    }
  }

  async appendToCsv(carDataArray: CarData[]): Promise<void> {
    try {
      const processedData = carDataArray.map((car) => ({
        ...car,
        ImageUrls: car.ImageUrls.join("; "),
      }));

      // Check if file exists
      const fileExists = fs.existsSync(this.csvPath);

      if (!fileExists) {
        // If file doesn't exist, write with headers
        await this.writer.writeRecords(processedData);
      } else {
        // If file exists, append without headers
        const appendWriter = createObjectCsvWriter({
          path: this.csvPath,
          header: [
            { id: "Make", title: "Make" },
            { id: "Model", title: "Model" },
            { id: "Year", title: "Year" },
            { id: "Engine Fuel Type", title: "Engine Fuel Type" },
            { id: "Engine HP", title: "Engine HP" },
            { id: "Engine Cylinders", title: "Engine Cylinders" },
            { id: "Transmission Type", title: "Transmission Type" },
            { id: "Driven_Wheels", title: "Driven_Wheels" },
            { id: "Number of Doors", title: "Number of Doors" },
            { id: "Market Category", title: "Market Category" },
            { id: "Vehicle Size", title: "Vehicle Size" },
            { id: "Vehicle Style", title: "Vehicle Style" },
            { id: "highway MPG", title: "highway MPG" },
            { id: "city mpg", title: "city mpg" },
            { id: "Popularity", title: "Popularity" },
            { id: "MSRP", title: "MSRP" },
            { id: "Mileage", title: "Mileage" },
            { id: "Body type", title: "Body type" },
            { id: "Engine", title: "Engine" },
            { id: "Gearbox", title: "Gearbox" },
            { id: "Doors", title: "Doors" },
            { id: "Seats", title: "Seats" },
            { id: "Emission class", title: "Emission class" },
            { id: "Body colour", title: "Body colour" },
            { id: "Manufacturer warranty", title: "Manufacturer warranty" },
            { id: "CarUrl", title: "CarUrl" },
            { id: "ImageUrls", title: "ImageUrls" },
            // Performance specifications
            { id: "0-62mph", title: "0-62mph" },
            { id: "Top speed", title: "Top speed" },
            { id: "Cylinders", title: "Cylinders" },
            { id: "Valves", title: "Valves" },
            { id: "Engine power", title: "Engine power" },
            { id: "Engine torque", title: "Engine torque" },
            { id: "Miles per gallon", title: "Miles per gallon" },
            // Size and dimensions
            { id: "Height", title: "Height" },
            { id: "Length", title: "Length" },
            { id: "Width", title: "Width" },
            { id: "Wheelbase", title: "Wheelbase" },
            { id: "Fuel tank capacity", title: "Fuel tank capacity" },
            { id: "Boot space (seats down)", title: "Boot space (seats down)" },
            { id: "Boot space (seats up)", title: "Boot space (seats up)" },
            { id: "Minimum kerb weight", title: "Minimum kerb weight" },
          ],
          append: true,
        });

        await appendWriter.writeRecords(processedData);
      }

      console.log(
        `Successfully appended ${carDataArray.length} cars to ${this.csvPath}`
      );
    } catch (error) {
      console.error("Error appending to CSV:", error);
      throw error;
    }
  }
}
