import express, { Request, Response, Router } from "express";
import multer from "multer";
import { processVideo } from "./utils/processVideo";
import { uploadToS3, uploadHLSFolder } from "./utils/s3Upload";
import { saveMetadata } from "./utils/saveMetadata";
import fs from "fs-extra";

const router = Router();

const upload = multer({ dest: "uploads/" });

// Define routes
router.get("/hello", (req, res) => {
  res.send("Hello World!");
});
router.get("/status", (req, res) => {
  res.json({ status: "Running" });
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
        uploadToS3(processedData.thumbnail, "image/jpeg"),
      ]);

      await saveMetadata({ videoUrl: m3u8Url, tsFiles: tsUrls, thumbnail: s3ThumbnailUrl });

      // Cleanup temporary files
      await fs.remove(tempFilePath);
      await fs.remove(processedData.outputDir);

      res.status(200).json({
        message: "File processed & uploaded!",
        videoUrl: m3u8Url,
        tsFiles: tsUrls,
        thumbnail: s3ThumbnailUrl,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;