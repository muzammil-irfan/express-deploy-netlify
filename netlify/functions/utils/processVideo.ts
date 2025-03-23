import ffmpeg from "../../../config/ffmpeg";
import path from "path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";

export const processVideo = async (videoPath: string) => {
  const uniqueId = uuidv4();
  const outputDir = path.join("/tmp", `processed-${uniqueId}`);
  await fs.ensureDir(outputDir);

  const hlsPath = path.join(outputDir, "output.m3u8");
  const thumbnailPath = path.join(outputDir, "thumbnail.jpg");

  try {
    // Convert to HLS and generate .ts chunks
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          "-preset veryfast",
          "-crf 23",
          "-hls_time 10",
          "-hls_list_size 0",
          "-f hls",
          "-hls_segment_filename", `${outputDir}/segment_%03d.ts`, // Ensures TS segments are named correctly
        ])
        .output(hlsPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // Generate Thumbnail
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          folder: outputDir,
          filename: "thumbnail.jpg",
          size: "300x?", // Maintain aspect ratio
        })
        .on("end", resolve)
        .on("error", reject);
    });

    return { hlsPath, thumbnail: thumbnailPath, outputDir };
  } catch (error) {
    console.error("Processing error:", error);
    throw error;
  }
};