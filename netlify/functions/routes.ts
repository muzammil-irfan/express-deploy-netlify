import express, { Request, Response, Router } from "express";
import multer from "multer";
import { processVideo } from "./utils/processVideo";
import { uploadToS3, uploadHLSFolder } from "./utils/s3Upload";
import { saveMetadata } from "./utils/saveMetadata";
import fs from "fs-extra";
import {Metadata, METADATA_FILE} from "./utils/saveMetadata";

const router = Router();

const upload = multer({ dest: "tmp/uploads/" });

// Define routes
router.get("/status", (req, res) => {
  res.json({ status: "Running" });
});

router.get("/videos", async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      res.json([]);
      return;
    }

    const metadata = JSON.parse(await fs.readFile(METADATA_FILE, "utf-8"));

    const s3BaseUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com`;
    const cloudFrontBaseUrl = "https://d20ajpfoxm2g4r.cloudfront.net";

    const updatedMetadata = metadata.map((item: any) => ({
      videoUrl: item.videoUrl.replace(s3BaseUrl, cloudFrontBaseUrl),
      thumbnail: item.thumbnail.replace(s3BaseUrl, cloudFrontBaseUrl),
      tsFiles: item.tsFiles.map((tsUrl: string) => tsUrl.replace(s3BaseUrl, cloudFrontBaseUrl)), // Fixing tsFiles
    }));

    res.json(updatedMetadata);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/upload",
  upload.single("video"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // const tempFilePath = `/tmp/${Date.now()}-${req.file.originalname}`;
      // await fs.writeFile(tempFilePath, req.file.buffer);

      // const processedData = await processVideo(tempFilePath);
      const tempFilePath = req.file.path; // File is already saved to disk

      const processedData = await processVideo(tempFilePath);

      // Upload HLS files & Thumbnail
      const [{ m3u8Url, tsUrls }, s3ThumbnailUrl] = await Promise.all([
        uploadHLSFolder(processedData.outputDir),
        uploadToS3(processedData.thumbnail, "thumbnails", "image/webp"),
      ]);

      // Save metadata
      const metadata: Metadata = {
        id: Date.now().toString(),
        title: req.file.originalname,
        timestamp: Date.now(),
        m3u8Url,
        thumbnailUrl: s3ThumbnailUrl,
        segmentUrls: tsUrls,
      };

      await saveMetadata(metadata);

      // Cleanup temporary files
      await Promise.all([fs.remove(tempFilePath), fs.remove(processedData.outputDir)]);

      res.status(200).json({
        message: "File processed & uploaded!",
        videoUrl: m3u8Url,
        tsFiles: tsUrls,
        thumbnail: s3ThumbnailUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;