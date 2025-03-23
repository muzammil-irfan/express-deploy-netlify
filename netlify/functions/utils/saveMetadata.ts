// import ffmpeg from "../../../config/ffmpeg";
import fs from "fs-extra";

const METADATA_FILE = "uploads/metadata.json";

export const saveMetadata = async (data: any) => {
  try {
    const metadata = fs.existsSync(METADATA_FILE)
      ? JSON.parse(await fs.readFile(METADATA_FILE, "utf-8"))
      : [];

    metadata.push(data);
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error("Error saving metadata:", error);
  }
};
