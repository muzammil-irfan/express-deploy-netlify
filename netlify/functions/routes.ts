import express, { Request, Response, Router } from "express";
import multer from "multer";
import { processVideo } from "./utils/processVideo";
import { uploadToS3, uploadHLSFolder } from "./utils/s3Upload";
import { saveMetadata } from "./utils/saveMetadata";
import fs from "fs-extra";
import {Metadata, METADATA_FILE} from "./utils/saveMetadata";
import { getMetadata } from "../../config/supabase";

const router = Router();

const CLOUDFRONT_URL = "https://d20ajpfoxm2g4r.cloudfront.net";

const upload = multer({ dest: "/tmp/uploads/" });

// Define routes
router.get("/status", (req, res) => {
  res.json({ status: "Running" });
});

router.get("/videos", async (req: Request, res: Response) => {
  try {
    const metadata = await getMetadata();

    const s3BaseUrl = `https://${process.env.S3_BUCKET_NAME_NETLIFY}.s3.amazonaws.com`;
    const cloudFrontBaseUrl = CLOUDFRONT_URL;
    console.log(metadata, s3BaseUrl, cloudFrontBaseUrl);
    const updatedMetadata:Metadata[] = [];
    // const updatedMetadata = metadata.forEach((item: any) => ({
    //   videoUrl: item.m3u8Url?.replace(s3BaseUrl, cloudFrontBaseUrl),
    //   thumbnail: item.thumbnailUrl?.replace(s3BaseUrl, cloudFrontBaseUrl),
    //   tsFiles: item.segmentUrls?.map((tsUrl: string) => tsUrl.replace(s3BaseUrl, cloudFrontBaseUrl)), // Fixing tsFiles
    // }));
    metadata.map(item=>{
      const obj = {
        ...item,
        m3u8url: item.m3u8url?.replace(s3BaseUrl, cloudFrontBaseUrl),
        thumbnailurl: item.thumbnailurl?.replace(s3BaseUrl, cloudFrontBaseUrl),
        segmenturls: item.segmenturls?.map((tsUrl: string) => tsUrl.replace(s3BaseUrl, cloudFrontBaseUrl)),
      }
      console.log(obj);
      updatedMetadata.push(obj);
    })

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
        m3u8url: m3u8Url,
        thumbnailurl: s3ThumbnailUrl,
        segmenturls: tsUrls,
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