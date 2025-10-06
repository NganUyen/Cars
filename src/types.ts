export interface CarData {
  Make: string;
  Model: string;
  Year: string;
  "Engine Fuel Type": string;
  "Engine HP": string;
  "Engine Cylinders": string;
  "Transmission Type": string;
  Driven_Wheels: string;
  "Number of Doors": string;
  "Market Category": string;
  "Vehicle Size": string;
  "Vehicle Style": string;
  "highway MPG": string;
  "city mpg": string;
  Popularity: string;
  MSRP: string;
  Mileage: string;
  "Body type": string;
  Engine: string;
  Gearbox: string;
  Doors: string;
  Seats: string;
  "Emission class": string;
  "Body colour": string;
  "Manufacturer warranty": string;
  CarUrl: string;
  ImageUrls: string[];
  // Performance specifications
  "0-62mph": string;
  "Top speed": string;
  Cylinders: string;
  Valves: string;
  "Engine power": string;
  "Engine torque": string;
  "Miles per gallon": string;
  // Size and dimensions
  Height: string;
  Length: string;
  Width: string;
  Wheelbase: string;
  "Fuel tank capacity": string;
  "Boot space (seats down)": string;
  "Boot space (seats up)": string;
  "Minimum kerb weight": string;
}

export interface CarListing {
  title: string;
  price: string;
  url: string;
}

export interface CrawlerConfig {
  enableMongoDB: boolean;
  batchSize: number;
  autoPushToDB: boolean;
  enableImageUpload: boolean;
}

export interface CrawlResult {
  totalCrawled: number;
  successfulInserts: number;
  duplicates: number;
  errors: number;
  batchId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
}
