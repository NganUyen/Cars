import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

export class ImageDownloader {
  private downloadDir: string;

  constructor(downloadDir: string = "./images") {
    this.downloadDir = downloadDir;
    this.ensureDirectoryExists(this.downloadDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 100); // Limit filename length
  }

  /**
   * Download a single image from URL
   */
  async downloadImage(
    url: string,
    carName: string,
    imageIndex: number
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const sanitizedCarName = this.sanitizeFilename(carName);
        const carDir = path.join(this.downloadDir, sanitizedCarName);
        this.ensureDirectoryExists(carDir);

        // Extract file extension from URL or use jpg as default
        const urlPath = new URL(url).pathname;
        const extension = path.extname(urlPath) || ".jpg";
        const filename = `image_${imageIndex
          .toString()
          .padStart(2, "0")}${extension}`;
        const filePath = path.join(carDir, filename);

        const protocol = url.startsWith("https:") ? https : http;

        const request = protocol.get(url, (response: any) => {
          if (response.statusCode === 200) {
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);

            fileStream.on("finish", () => {
              fileStream.close();
              console.log(`Downloaded: ${filename} for ${carName}`);
              resolve(filePath);
            });

            fileStream.on("error", (error: any) => {
              console.error(`Error writing file ${filename}:`, error);
              resolve(null);
            });
          } else {
            console.error(`Failed to download ${url}: ${response.statusCode}`);
            resolve(null);
          }
        });

        request.on("error", (error: any) => {
          console.error(`Error downloading ${url}:`, error);
          resolve(null);
        });

        request.setTimeout(30000, () => {
          request.destroy();
          console.error(`Timeout downloading ${url}`);
          resolve(null);
        });
      } catch (error) {
        console.error(`Error downloading image ${url}:`, error);
        resolve(null);
      }
    });
  }

  /**
   * Download all images for a car
   */
  async downloadCarImages(
    imageUrls: string[],
    carName: string
  ): Promise<string[]> {
    const downloadPromises = imageUrls.map((url, index) =>
      this.downloadImage(url, carName, index + 1)
    );

    const results = await Promise.all(downloadPromises);
    return results.filter((path) => path !== null) as string[];
  }
}
