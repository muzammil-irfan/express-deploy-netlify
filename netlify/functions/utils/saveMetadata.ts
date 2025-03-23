// import ffmpeg from "../../../config/ffmpeg";
import fs from "fs-extra";

export const METADATA_FILE = "data/metadata.json";

export interface Metadata {
  id: string; // Unique ID for reference
  title: string;
  description?: string;
  timestamp: number;
  m3u8Url: string;
  thumbnailUrl: string;
  segmentUrls: string[];
}

export const saveMetadata = async (data: Metadata) => {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid metadata format. Expected an object.");
    }

    let metadata: Metadata[] = [];

    if (fs.existsSync(METADATA_FILE)) {
      const fileContent = await fs.readFile(METADATA_FILE, "utf-8");
      metadata = fileContent ? JSON.parse(fileContent) : [];
    }

    metadata.push(data);

    // Atomic write to prevent corruption
    await fs.writeFile(`${METADATA_FILE}.tmp`, JSON.stringify(metadata, null, 2));
    await fs.rename(`${METADATA_FILE}.tmp`, METADATA_FILE);
  } catch (error) {
    console.error("Error saving metadata:", error);
  }
};